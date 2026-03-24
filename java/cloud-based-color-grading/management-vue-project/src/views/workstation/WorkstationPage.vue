<template>
  <div class="editor-container">
    <!-- 顶部导航栏 -->
    <TopNavbar />
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧图片显示区 -->
      <ImageDisplay
        :leftPanelWidth="leftPanelWidth"
        :images="uploadedImages"
        :selectedImageId="selectedImageId"
        :imageSrc="imageSrc"
        :processedSrc="processedSrc"
        :showUploadTips="!imageSrc"
        :galleryHeight="galleryHeight"
        :maskActive="maskLayers.length > 0"
        :maskActiveLayer="maskActiveLayer"
        :maskShowOverlay="!!maskShowOverlay && !adjSliderDragging && activePanelTab === 'mask' && !!maskActiveLayerId"
        @action:selectImage="handleSelectImage"
        @action:uploadImage="handleImageUpload"
        @layout:resetLayout="resetLayout"
        @layout:updateGalleryHeight="updateGalleryHeight"
        @resize:start="handleGalleryResizeStart"
        @resize:end="handleGalleryResizeEnd"
        @mask:commit="handleMaskCommit"
        @mask:updateLayer="handleMaskUpdateLayer"
        ref="imageDisplayRef"
      />

      <!-- 可拖拽的分割线 -->
      <PanelResizer
        :currentWidth="leftPanelWidth"
        :isResizing="isResizing"
        @layout:updatePanelWidth="updatePanelWidth"
        @resize:start="handlePanelResizeStart"
        @resize:end="handlePanelResizeEnd"
      />

      <!-- 右侧调色区 -->
      <AdjustPanel
        :rightPanelWidth="rightPanelWidth"
        :adjustments="adjustments"
        :hslAdjustments="hslAdjustments"
        :canSave="!!imageSrc"
        :canReset="!!imageSrc"
        :imageSrc="imageSrc"
        :processedSrc="processedSrc"
        :maskLayers="maskLayers"
        :maskActiveLayerId="maskActiveLayerId"
        :maskActiveLayer="maskActiveLayer"
        :maskShowOverlay="!!maskShowOverlay"
        @update:adjustments="setAdjustments"
        @update:hslAdjustments="(v) => Object.assign(hslAdjustments, v)"
        @action:uploadImage="handleImageUpload"
        @action:save="handleSaveImage"
        @action:reset="() => { resetAdjustments(); setBasicAdjustments({ brightness:0, contrast:0, saturation:0, vibrance:0, hue:0, temperature:0, clarity:0 }); resetHSL(); resetMask(); setMaskLayers([]) }"
        @mask:toggleOverlay="handleMaskToggleOverlay"
        @mask:addLayer="handleMaskAddLayer"
        @mask:removeLayer="handleMaskRemoveLayer"
        @mask:selectLayer="handleMaskSelectLayer"
        @mask:toggleLayerEnabled="handleMaskToggleLayerEnabled"
        @mask:updateLayer="handleMaskUpdateLayer"
        @mask:invert="handleMaskInvert"
        @mask:clear="handleMaskClear"
        @mask:updateLayerAdj="handleMaskUpdateLayerAdj"
        @mask:adjSliderStart="adjSliderDragging = true"
        @mask:adjSliderEnd="adjSliderDragging = false"
        @tab:change="activePanelTab = $event"
        @mask:clearSelection="maskSetActiveLayer('')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';;
import type { ImageItem } from './component-interfaces'
import TopNavbar from './components/TopNavbar.vue';
import ImageDisplay from './components/ImageDisplay.vue';
import PanelResizer from './components/PanelResizer.vue';
import AdjustPanel from './components/AdjustPanel.vue';

import { useLayoutState } from './composables/useLayoutState'
import { useImageState } from './composables/useImageState'
import { useAdjustmentState } from './composables/useAdjustmentState'
import { useHSLState } from './composables/useHSLState'
import { useImageStorage } from './composables/useImageStorage'
import { useMaskState } from './composables/useMaskState'

// 使用布局状态管理
const {
  leftPanelWidth,
  rightPanelWidth,
  isResizing,
  galleryHeight,
  isGalleryResizing,
  startResize,
  startGalleryResize,
  resetLayout,
  saveLayoutSettings
} = useLayoutState();

// 使用图片状态管理
const {
  imageSrc,
  uploadedImages,
  selectedImageId,
  handleImageUpload,
  selectImage,
} = useImageState();

// 使用调整状态管理
const {
  adjustments,
  imageFilter,
  resetAdjustments,
  setAdjustments,
} = useAdjustmentState();

// HSL 颜色范围调节 + 基础调色像素链
const {
  hslAdjustments,
  processedSrc,
  resetHSL,
  setSourceImage,
  setBasicAdjustments,
  setMaskCanvas,
  setMaskLayers,
  updateMaskLayerAdj,
  exportProcessed,
} = useHSLState()

// 蒙版状态
const {
  layers: maskLayers,
  activeLayerId: maskActiveLayerId,
  activeLayer: maskActiveLayer,
  compositeCanvas: maskCompositeCanvas,
  showOverlay: maskShowOverlay,
  maskActive,
  addLayer: maskAddLayer,
  removeLayer: maskRemoveLayer,
  setActiveLayer: maskSetActiveLayer,
  toggleLayerEnabled: maskToggleLayerEnabled,
  updateLayer: maskUpdateLayer,
  generateLayerMask,
  initSize: maskInitSize,
  invertActiveLayer: maskInvertActive,
  clearActiveLayer: maskClearActive,
  toggleOverlay: toggleMaskOverlay,
  getSerializable: getMaskSerializable,
  loadFromSerializable: loadMaskFromSerializable,
  resetMask,
} = useMaskState()

// 调色参数持久化
const { saveAdjustments, loadAdjustments } = useImageStorage()

// 防抖保存 timer
let saveTimer: ReturnType<typeof setTimeout> | null = null
// 加载参数期间不触发保存
let isLoadingAdjustments = false

// 序列化当前所有调色参数为 JSON（含蒙版）
const serializeAdjustments = () => {
  return JSON.stringify({
    adjustments: { ...adjustments },
    hslAdjustments: JSON.parse(JSON.stringify(hslAdjustments)),
    mask: getMaskSerializable(),
  })
}

// 防抖自动保存（500ms 无操作后写入 DB）
const scheduleSave = () => {
  if (!selectedImageId.value || isLoadingAdjustments) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveAdjustments(selectedImageId.value!, serializeAdjustments())
  }, 500)
}

// 从 DB 加载并应用调色参数
const applyStoredAdjustments = async (imageId: number) => {
  isLoadingAdjustments = true
  try {
    const json = await loadAdjustments(imageId)
    if (!json) {
      resetAdjustments(); resetHSL(); resetMask()
      setMaskLayers([])
      return
    }
    const data = JSON.parse(json)
    if (data.adjustments) setAdjustments(data.adjustments)
    if (data.hslAdjustments) Object.assign(hslAdjustments, data.hslAdjustments)
    // 恢复蒙版
    if (data.mask && Array.isArray(data.mask) && data.mask.length > 0 && imageSrc.value) {
      const img = new Image()
      img.onload = () => {
        maskInitSize(img.naturalWidth, img.naturalHeight)
        loadMaskFromSerializable(data.mask)
        setMaskLayers([...maskLayers])
      }
      img.src = imageSrc.value
    } else {
      resetMask()
      setMaskLayers([])
    }
  } catch {
    resetAdjustments(); resetHSL(); resetMask()
    setMaskLayers([])
  } finally {
    isLoadingAdjustments = false
  }
}

// 监听调色参数变化 → 自动保存
watch(adjustments, scheduleSave, { deep: true })
watch(hslAdjustments, scheduleSave, { deep: true })

// 当选中图片变化时，通知 HSL 处理器 + 加载该图片的调色参数
watch(imageSrc, (src) => {
  setSourceImage(src)
}, { immediate: true })

// adjustments 变化时同步给处理链（基础调色像素级处理）
watch(adjustments, (adj) => {
  setBasicAdjustments({ ...adj })
}, { deep: true })

// 图片切换时重置蒙版
watch(imageSrc, () => {
  resetMask()
  setMaskLayers([])
})

// 统一触发蒙版处理链更新
const syncMaskLayers = () => {
  setMaskLayers([...maskLayers])
}

// 蒙版 commit（拖拽结束，重新生成蒙版并触发处理链）
const handleMaskCommit = () => {
  if (maskActiveLayer.value) generateLayerMask(maskActiveLayer.value)
  syncMaskLayers()
  scheduleSave()
}

// 蒙版参数更新（来自 MaskCanvas 拖拽或 MaskControls 控件）
const handleMaskUpdateLayer = (newLayer: import('./composables/useMaskState').MaskLayer) => {
  maskUpdateLayer(newLayer)
  syncMaskLayers()
  scheduleSave()
}

// 蒙版工具栏事件
const handleMaskAddLayer = (type: import('./composables/useMaskState').MaskType) => {
  if (maskLayers.length === 0 && imageSrc.value) {
    const img = new Image()
    img.onload = () => { maskInitSize(img.naturalWidth, img.naturalHeight); maskAddLayer(type); syncMaskLayers() }
    img.src = imageSrc.value
  } else {
    maskAddLayer(type)
    syncMaskLayers()
  }
  scheduleSave()
}
const handleMaskRemoveLayer = (id: string) => { maskRemoveLayer(id); syncMaskLayers(); scheduleSave() }
const handleMaskSelectLayer = (id: string) => { maskSetActiveLayer(id) }
const handleMaskToggleLayerEnabled = (id: string) => { maskToggleLayerEnabled(id); syncMaskLayers(); scheduleSave() }
const handleMaskToggleOverlay = () => { toggleMaskOverlay() }
const handleMaskInvert = () => { maskInvertActive(); syncMaskLayers(); scheduleSave() }
const handleMaskClear  = () => { maskClearActive();  syncMaskLayers(); scheduleSave() }

// 蒙版层独立调色参数更新
const handleMaskUpdateLayerAdj = (payload: { id: string; adjustments: import('./component-interfaces').AdjustmentValues }) => {
  const layer = maskLayers.find(l => l.id === payload.id)
  if (!layer) return
  Object.assign(layer.adjustments, payload.adjustments)
  // 直接更新处理链中的参数，不重传 canvas，避免 rAF 延迟导致蒙版闪烁
  updateMaskLayerAdj(payload.id, payload.adjustments)
  scheduleSave()
}

// selectedImageId 变化时（含页面刷新后 onMounted 恢复）加载调色参数
watch(selectedImageId, (id) => {
  if (id != null) applyStoredAdjustments(id)
}, { immediate: true })

// 图片显示组件引用（供模板 ref 使用）
const imageDisplayRef = ref(null)
// 局部调色滑块拖动中：临时隐藏蒙版叠加层
const adjSliderDragging = ref(false)
// 当前激活的面板 tab
const activePanelTab = ref<'basic' | 'mask'>('basic')

// 处理面板拖拽开始
const handlePanelResizeStart = () => {
  isResizing.value = true;
};

// 处理面板拖拽结束
const handlePanelResizeEnd = () => {
  isResizing.value = false;
  saveLayoutSettings();
};

// 更新面板宽度
const updatePanelWidth = (width: number) => {
  leftPanelWidth.value = width;
};

// 处理图片全览区拖拽开始
const handleGalleryResizeStart = () => {
  isGalleryResizing.value = true;
};

// 处理图片全览区拖拽结束
const handleGalleryResizeEnd = () => {
  isGalleryResizing.value = false;
  saveLayoutSettings();
};

// 更新图片全览区高度
const updateGalleryHeight = (height: number) => {
  galleryHeight.value = height;
};

// 处理图片选择
const handleSelectImage = async (image: ImageItem) => {
  selectImage(image)
  await applyStoredAdjustments(image.id)
}

// 暴露方法供测试使用
const selectImageForTest = (image: ImageItem) => {
  handleSelectImage(image)
}

// 处理保存图片（format: 'png' | 'jpeg'）
const handleSaveImage = async (format: 'png' | 'jpeg' = 'png') => {
  if (!imageSrc.value) {
    alert('请先上传图片！')
    return
  }

  // 完整处理链（基础调色 + HSL）已在 exportProcessed 内部完成，直接下载
  const dataUrl = await exportProcessed(format, format === 'jpeg' ? 0.95 : 1)

  const link = document.createElement('a')
  link.download = `edited-${Date.now()}.${format}`
  link.href = dataUrl
  link.click()
}

// 暴露属性和方法供测试使用
defineExpose({
  // 状态
  leftPanelWidth,
  rightPanelWidth,
  isResizing,
  galleryHeight,
  isGalleryResizing,
  imageSrc,
  uploadedImages,
  selectedImageId,
  adjustments,
  imageFilter,
  imageDisplayRef,
  
  // 方法
  selectImage: selectImageForTest,
  resetLayout,
  resetAdjustments,
  handleImageUpload,
  handleSaveImage,
  saveImage: handleSaveImage, // 别名供测试使用
  updatePanelWidth,
  updateGalleryHeight,
  handlePanelResizeStart,
  handlePanelResizeEnd,
  handleGalleryResizeStart,
  handleGalleryResizeEnd,
  
  // 布局相关方法（从 useLayoutState 暴露）
  startResize,
  startGalleryResize,
  stopResize: handlePanelResizeEnd, // 映射到结束方法
  stopGalleryResize: handleGalleryResizeEnd, // 映射到结束方法
  
  // 直接暴露 composable 方法供测试
  setAdjustments
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', sans-serif;
}

.editor-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>