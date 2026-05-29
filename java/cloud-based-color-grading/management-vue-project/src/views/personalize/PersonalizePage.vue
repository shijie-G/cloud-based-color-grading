<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useLayerManager } from './composables/useLayerManager'
import { usePersonalizeStorage } from './composables/usePersonalizeStorage'
import { useHSLState } from '@/views/workstation/composables/useHSLState'
import { drawLinearMask, drawRadialMask } from '@/views/workstation/composables/useMaskState'
import { imageDB } from '@/views/workstation/utils/imageDB'
import { resolvePersonalizeBaseSrc } from './utils/previewBaseImage'
import CanvasArea from './components/CanvasArea.vue'
import LayerPanel from './components/LayerPanel.vue'
import AssetPanel from './components/AssetPanel.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import ImageSelector from './components/ImageSelector.vue'
import type { CanvasConfig } from './types'

// 图层管理
const layerManager = useLayerManager()
const {
  layers,
  selectedLayerId,
  selectedLayer,
  sortedLayers
} = layerManager

// 图层存储管理
const personalizeStorage = usePersonalizeStorage()
const { saveLayersToStorage, loadLayersFromStorage } = personalizeStorage

// 使用 HSL 调色处理链
const {
  processedSrc,
  hslAdjustments,
  setSourceImage,
  setBasicAdjustments,
  setMaskLayers,
  setFilterConfig,
  resetHSL,
} = useHSLState()

// 画布配置
const canvasConfig = ref<CanvasConfig>({
  width: 0,
  height: 0,
  backgroundColor: 'transparent'
})

// 图片选择器
const showImageSelector = ref(false)
const baseImageUrl = ref<string>('')  // 底图URL（调色后的）
const currentImageId = ref<number | null>(null)  // 当前图片 ID

// 自动保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 监听图层变化，自动保存（传递图片尺寸用于百分比转换）
watch(layers, () => {
  if (!currentImageId.value || !canvasConfig.value.width || !canvasConfig.value.height) return

  // 防抖保存：500ms 后保存
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveLayersToStorage(
      currentImageId.value!,
      layers.value,
      canvasConfig.value.width,
      canvasConfig.value.height
    )
  }, 500)
}, { deep: true })

// 监听 processedSrc 变化，更新 baseImageUrl
watch(processedSrc, (newSrc) => {
  if (newSrc) {
    baseImageUrl.value = newSrc
    console.log('PersonalizePage: 更新底图为调色后的图片')
  }
})

// 面板宽度
const assetPanelWidth = ref(260)
const propertyPanelWidth = ref(280)
const layerPanelWidth = ref(280)

// 拖拽调整宽度
let isDraggingResizer = false
let currentResizer = ''
let startX = 0
let startWidth = 0

function handleResizerMouseDown(resizer: string, e: MouseEvent) {
  isDraggingResizer = true
  currentResizer = resizer
  startX = e.clientX

  if (resizer === 'asset') {
    startWidth = assetPanelWidth.value
  } else if (resizer === 'property') {
    startWidth = propertyPanelWidth.value
  } else if (resizer === 'layer') {
    startWidth = layerPanelWidth.value
  }

  document.addEventListener('mousemove', handleResizerMouseMove)
  document.addEventListener('mouseup', handleResizerMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResizerMouseMove(e: MouseEvent) {
  if (!isDraggingResizer) return

  const delta = e.clientX - startX

  if (currentResizer === 'asset') {
    // 素材库：向右拖增加宽度，最小260px
    assetPanelWidth.value = Math.max(260, Math.min(500, startWidth + delta))
  } else if (currentResizer === 'property') {
    // 属性面板：向左拖增加宽度，最小260px
    propertyPanelWidth.value = Math.max(260, Math.min(500, startWidth - delta))
  } else if (currentResizer === 'layer') {
    // 图层面板：向左拖增加宽度，最小260px
    layerPanelWidth.value = Math.max(260, Math.min(500, startWidth - delta))
  }
}

function handleResizerMouseUp() {
  isDraggingResizer = false
  currentResizer = ''
  document.removeEventListener('mousemove', handleResizerMouseMove)
  document.removeEventListener('mouseup', handleResizerMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 打开图片选择器
function handleAddImageFromGallery() {
  showImageSelector.value = true
}

// 选择贴纸
function handleStickerSelect(sticker: { id: string; name: string; url: string; category: string }) {
  // 加载贴纸图片获取尺寸
  const img = new Image()
  img.onload = () => {
    const maxSize = Math.min(canvasConfig.value.width, canvasConfig.value.height) * 0.3
    let finalWidth = img.naturalWidth
    let finalHeight = img.naturalHeight

    // 等比例缩放
    if (finalWidth > maxSize || finalHeight > maxSize) {
      const ratio = Math.min(maxSize / finalWidth, maxSize / finalHeight)
      finalWidth = finalWidth * ratio
      finalHeight = finalHeight * ratio
    }

    layerManager.addLayer({
      name: sticker.name,
      type: 'image',
      visible: true,
      locked: false,
      opacity: 1,
      x: (canvasConfig.value.width - finalWidth) / 2,
      y: (canvasConfig.value.height - finalHeight) / 2,
      width: finalWidth,
      height: finalHeight,
      rotation: 0,
      imageUrl: sticker.url,
      strokeColor: '#000000',
      strokeWidth: 0
    })
  }
  img.src = sticker.url
}

// 从相册选择图片
async function handleImageSelect(imageId: number, imageUrl: string, width: number, height: number) {
  console.log('选择图片:', imageId, imageUrl, width, height)

  // 切换画布：清空所有图层，设置新的底图
  layerManager.clearLayers()

  // 设置画布尺寸
  canvasConfig.value.width = width
  canvasConfig.value.height = height
  currentImageId.value = imageId

  // 从 IndexedDB 读取图片数据，应用调色参数
  try {
    const dbItem = await imageDB.getImage(imageId)
    if (!dbItem) {
      console.error('图片不存在:', imageId)
      return
    }

    // 仅以原图 + 裁切状态重建底图，不直接拿 editedSrc 作为调色输入
    const baseSrc = await resolvePersonalizeBaseSrc(dbItem)
    setSourceImage(baseSrc)

    // 应用调色参数（如果有）
    if (dbItem.adjustmentsJson) {
      const data = JSON.parse(dbItem.adjustmentsJson)

      // 1. 基础调色
      if (data.adjustments) {
        setBasicAdjustments(data.adjustments)
      }

      // 2. HSL 调整（直接写入 reactive 对象，处理链自动触发）
      if (data.hslAdjustments) {
        Object.assign(hslAdjustments, data.hslAdjustments)
      }

      // 3. 蒙版：重建 canvas 后再传给处理链（与 WorkstationPage 对齐）
      if (data.mask && Array.isArray(data.mask) && data.mask.length > 0) {
        const maskImg = new Image()
        maskImg.onload = () => {
          const w = maskImg.naturalWidth
          const h = maskImg.naturalHeight
          const rebuiltLayers = data.mask.map((d: any) => {
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            if (d.type === 'linear') {
              drawLinearMask(ctx, w, h, d.linear)
            } else {
              drawRadialMask(ctx, w, h, d.radial)
            }
            return {
              id: d.id,
              name: d.name,
              enabled: d.enabled,
              type: d.type,
              linear: { ...d.linear },
              radial: { ...d.radial },
              adjustments: d.adjustments ?? {
                brightness: 0, contrast: 0, saturation: 0,
                vibrance: 0, hue: 0, temperature: 0, clarity: 0,
              },
              canvas,
            }
          })
          setMaskLayers(rebuiltLayers)
        }
        maskImg.src = baseSrc
      } else {
        setMaskLayers([])
      }

      // 4. 滤镜（独立字段 filterConfigJson）
      if (dbItem.filterConfigJson) {
        setFilterConfig(JSON.parse(dbItem.filterConfigJson))
      } else {
        setFilterConfig({
          blur_radius: 0, sharpen_amount: 0, sharpen_radius: 1.0,
          style_type: 0, style_strength: 0,
          style_highlight_color: '#f8e9d6', style_shadow_color: '#2a3d55',
          style_blend: 0.3, grain_intensity: 0, vignette_strength: 0, vignette_size: 1.2,
        })
      }

      console.log('PersonalizePage: 应用调色参数')
    } else {
      // 没有调色参数，重置并直接使用原图
      setBasicAdjustments({ brightness: 0, contrast: 0, saturation: 0, vibrance: 0, hue: 0, temperature: 0, clarity: 0 })
      resetHSL()
      setMaskLayers([])
      setFilterConfig({
        blur_radius: 0, sharpen_amount: 0, sharpen_radius: 1.0,
        style_type: 0, style_strength: 0,
        style_highlight_color: '#f8e9d6', style_shadow_color: '#2a3d55',
        style_blend: 0.3, grain_intensity: 0, vignette_strength: 0, vignette_size: 1.2,
      })
      baseImageUrl.value = baseSrc
      console.log('PersonalizePage: 没有调色参数，使用原图')
    }
  } catch (error) {
    console.error('加载图片数据失败:', error)
    baseImageUrl.value = imageUrl
  }

  console.log('切换画布底图:', baseImageUrl.value, canvasConfig.value)

  // 加载该图片保存的图层数据（传递图片尺寸用于百分比还原）
  try {
    const savedLayers = await loadLayersFromStorage(imageId, width, height)
    if (savedLayers.length > 0) {
      console.log(`✅ 恢复 ${savedLayers.length} 个图层（百分比 → 像素）`)
      // 逐个添加图层（保持原有的 ID 和属性）
      savedLayers.forEach(layer => {
        layerManager.addLayer(layer)
      })
    }
  } catch (error) {
    console.error('加载图层数据失败:', error)
  }
}

// 添加文字图层（使用百分比计算初始位置）
function handleAddText() {
  if (!canvasConfig.value.width || !canvasConfig.value.height) {
    console.warn('画布尺寸未初始化，无法添加图层')
    return
  }

  // 百分比 → 像素：图层位置相对于图片左上角
  const centerX = canvasConfig.value.width * 0.4  // 40% 位置
  const centerY = canvasConfig.value.height * 0.4  // 40% 位置
  const textWidth = canvasConfig.value.width * 0.2  // 20% 宽度
  const textHeight = canvasConfig.value.height * 0.05  // 5% 高度
  const fontSize = canvasConfig.value.height * 0.03  // 3% 字体大小

  layerManager.addLayer({
    name: '文字图层',
    type: 'text',
    visible: true,
    locked: false,
    opacity: 1,
    x: centerX,
    y: centerY,
    width: textWidth,
    height: textHeight,
    rotation: 0,
    text: '双击编辑文字',
    fontSize: fontSize,
    fontFamily: 'Arial',
    color: '#000000'
  })
}

// 添加形状图层（使用百分比计算初始位置）
function handleAddShape(shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow' | 'pentagon' | 'hexagon') {
  if (!canvasConfig.value.width || !canvasConfig.value.height) {
    console.warn('画布尺寸未初始化，无法添加图层')
    return
  }

  const shapeNames: Record<string, string> = {
    rectangle: '矩形',
    circle: '圆形',
    triangle: '三角形',
    star: '星形',
    heart: '心形',
    arrow: '箭头',
    pentagon: '五边形',
    hexagon: '六边形'
  }

  // 百分比 → 像素：图层位置相对于图片左上角
  const centerX = canvasConfig.value.width * 0.35  // 35% 位置
  const centerY = canvasConfig.value.height * 0.35  // 35% 位置
  const shapeWidth = canvasConfig.value.width * 0.15  // 15% 宽度
  const shapeHeight = canvasConfig.value.height * 0.15  // 15% 高度

  layerManager.addLayer({
    name: shapeNames[shapeType] || '形状',
    type: 'shape',
    visible: true,
    locked: false,
    opacity: 1,
    x: centerX,
    y: centerY,
    width: shapeWidth,
    height: shapeHeight,
    rotation: 0,
    shapeType,
    fillColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 0
  })
}

// 更新图层属性
function handleUpdateProperty(updates: any) {
  if (selectedLayerId.value) {
    layerManager.updateLayer(selectedLayerId.value, updates)
  }
}

// 导出画布
function handleExport() {
  // TODO: 实现导出功能
  alert('导出功能开发中...')
}

// 清空画布
async function handleClear() {
  if (confirm('确定要清空所有图层吗？')) {
    layerManager.clearLayers()
    canvasConfig.value.width = 0
    canvasConfig.value.height = 0
    baseImageUrl.value = ''

    // 清除存储的图层数据
    if (currentImageId.value) {
      try {
        await personalizeStorage.clearLayersFromStorage(currentImageId.value)
      } catch (error) {
        console.error('清除图层存储失败:', error)
      }
    }

    currentImageId.value = null
  }
}

// 离开模块时清空图层（不保存）
onBeforeUnmount(() => {
  console.log('离开个性化模块，清空图层')
  layerManager.clearLayers()
  canvasConfig.value.width = 0
  canvasConfig.value.height = 0
  baseImageUrl.value = ''
  currentImageId.value = null

  // 清除定时器
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
})
</script>

<template>
  <div class="personalize-page">
    <!-- 顶部工具栏
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>个性化设计</h2>
        <div v-if="canvasConfig.width > 0" class="canvas-info">
          <span>{{ canvasConfig.width }} × {{ canvasConfig.height }}px</span>
        </div>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="handleClear">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>清空</span>
        </button>
        <button class="toolbar-btn primary" @click="handleExport">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>导出</span>
        </button>
      </div>
    </div> -->

    <!-- 主工作区 -->
    <div class="workspace">
      <!-- 素材库面板 -->
      <AssetPanel
        :disabled="!baseImageUrl"
        :style="{ width: `${assetPanelWidth}px` }"
        @add-image-from-gallery="handleAddImageFromGallery"
        @add-text="handleAddText"
        @add-shape="handleAddShape"
        @add-sticker="handleStickerSelect"
      />

      <!-- 素材库分隔条 -->
      <div class="resizer" @mousedown="handleResizerMouseDown('asset', $event)"></div>

      <!-- 画布区域 -->
      <CanvasArea
        v-if="canvasConfig.width > 0"
        :layers="layers"
        :selected-layer-id="selectedLayerId"
        :config="canvasConfig"
        :base-image-url="baseImageUrl"
        @select-layer="layerManager.selectLayer"
        @update-layer="layerManager.updateLayer"
      />

      <!-- 空状态提示 -->
      <div v-else class="canvas-empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
        <p>从相册选择图片开始设计</p>
      </div>

      <!-- 右侧面板组 -->
      <div class="right-panels">
        <!-- 画布和属性之间的分隔条 -->
        <div class="resizer" @mousedown="handleResizerMouseDown('property', $event)"></div>

        <!-- 属性面板 -->
        <PropertyPanel
          :style="{ width: `${propertyPanelWidth}px` }"
          :layer="selectedLayer"
          @update="handleUpdateProperty"
        />

        <!-- 属性和图层之间的分隔条 -->
        <div class="resizer" @mousedown="handleResizerMouseDown('layer', $event)"></div>

        <!-- 图层管理面板 -->
        <LayerPanel
          :style="{ width: `${layerPanelWidth}px` }"
          :layers="sortedLayers"
          :selected-layer-id="selectedLayerId"
          @select="layerManager.selectLayer"
          @remove="layerManager.removeLayer"
          @duplicate="layerManager.duplicateLayer"
          @toggle-visibility="layerManager.toggleLayerVisibility"
          @toggle-lock="layerManager.toggleLayerLock"
          @move-up="layerManager.moveLayerUp"
          @move-down="layerManager.moveLayerDown"
          @reorder="layerManager.reorderLayers"
        />
      </div>
    </div>

    <!-- 图片选择器 -->
    <ImageSelector
      v-if="showImageSelector"
      @select="handleImageSelect"
      @close="showImageSelector = false"
    />
  </div>
</template>

<style scoped>
.personalize-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #16181c;
}

.toolbar {
  height: 64px;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e4e9;
}

.canvas-info {
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.toolbar-right {
  display: flex;
  gap: 0.75rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #e2e4e9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.toolbar-btn:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.toolbar-btn.primary {
  background: #5b6af0;
  border-color: #5b6af0;
}

.toolbar-btn.primary:hover {
  background: #4a59df;
  border-color: #4a59df;
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.right-panels {
  display: flex;
}

.resizer {
  width: 4px;
  background: rgba(255, 255, 255, 0.05);
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.resizer:hover {
  background: rgba(91, 106, 240, 0.5);
}

.resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -2px;
  right: -2px;
}

.canvas-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.canvas-empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.canvas-empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
