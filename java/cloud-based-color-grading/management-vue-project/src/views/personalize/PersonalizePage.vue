<script setup lang="ts">
import { ref } from 'vue'
import { useLayerManager } from './composables/useLayerManager'
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

// 画布配置
const canvasConfig = ref<CanvasConfig>({
  width: 0,
  height: 0,
  backgroundColor: 'transparent'
})

// 图片选择器
const showImageSelector = ref(false)
const baseImageUrl = ref<string>('')  // 底图URL

// 打开图片选择器
function handleAddImageFromGallery() {
  showImageSelector.value = true
}

// 从相册选择图片
function handleImageSelect(imageUrl: string, width: number, height: number) {
  console.log('选择图片:', imageUrl, width, height)

  // 如果还没有底图，设置为底图
  if (!baseImageUrl.value) {
    canvasConfig.value.width = width
    canvasConfig.value.height = height
    baseImageUrl.value = imageUrl
    console.log('设置底图:', baseImageUrl.value, canvasConfig.value)
  } else {
    // 后续图片作为普通图层添加，等比例缩放
    const maxSize = Math.min(canvasConfig.value.width, canvasConfig.value.height) * 0.5
    let finalWidth = width
    let finalHeight = height

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      finalWidth = width * ratio
      finalHeight = height * ratio
    }

    layerManager.addLayer({
      name: '图片图层',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 1,
      x: (canvasConfig.value.width - finalWidth) / 2,
      y: (canvasConfig.value.height - finalHeight) / 2,
      width: finalWidth,
      height: finalHeight,
      rotation: 0,
      imageUrl,
      strokeColor: '#000000',
      strokeWidth: 0
    })
  }
}

// 添加文字图层
function handleAddText() {
  layerManager.addLayer({
    name: '文字图层',
    type: 'text',
    visible: true,
    locked: false,
    opacity: 1,
    x: 200,
    y: 200,
    width: 200,
    height: 50,
    rotation: 0,
    text: '双击编辑文字',
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000'
  })
}

// 添加形状图层
function handleAddShape(shapeType: 'rectangle' | 'circle') {
  layerManager.addLayer({
    name: shapeType === 'rectangle' ? '矩形' : '圆形',
    type: 'shape',
    visible: true,
    locked: false,
    opacity: 1,
    x: 300,
    y: 225,
    width: 200,
    height: 150,
    rotation: 0,
    shapeType,
    fillColor: '#5b6af0',
    strokeColor: '#000000',
    strokeWidth: 2
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
function handleClear() {
  if (confirm('确定要清空所有图层吗？')) {
    layerManager.clearLayers()
    canvasConfig.value.width = 0
    canvasConfig.value.height = 0
    baseImageUrl.value = ''
  }
}
</script>

<template>
  <div class="personalize-page">
    <!-- 顶部工具栏 -->
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
    </div>

    <!-- 主工作区 -->
    <div class="workspace">
      <!-- 素材库面板 -->
      <AssetPanel
        @add-image-from-gallery="handleAddImageFromGallery"
        @add-text="handleAddText"
        @add-shape="handleAddShape"
      />

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
        <!-- 属性面板 -->
        <PropertyPanel
          :layer="selectedLayer"
          @update="handleUpdateProperty"
        />

        <!-- 图层管理面板 -->
        <LayerPanel
          :layers="sortedLayers"
          :selected-layer-id="selectedLayerId"
          @select="layerManager.selectLayer"
          @remove="layerManager.removeLayer"
          @duplicate="layerManager.duplicateLayer"
          @toggle-visibility="layerManager.toggleLayerVisibility"
          @toggle-lock="layerManager.toggleLayerLock"
          @move-up="layerManager.moveLayerUp"
          @move-down="layerManager.moveLayerDown"
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
  border-left: 1px solid rgba(255, 255, 255, 0.05);
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
