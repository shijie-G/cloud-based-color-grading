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
        @action:selectImage="handleSelectImage"
        @action:uploadImage="handleImageUpload"
        @layout:resetLayout="resetLayout"
        @layout:updateGalleryHeight="updateGalleryHeight"
        @resize:start="handleGalleryResizeStart"
        @resize:end="handleGalleryResizeEnd"
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
        @update:adjustments="setAdjustments"
        @update:hslAdjustments="(v) => Object.assign(hslAdjustments, v)"
        @action:uploadImage="handleImageUpload"
        @action:save="handleSaveImage"
        @action:reset="() => { resetAdjustments(); resetHSL() }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ImageItem } from './component-interfaces'
import TopNavbar from './components/TopNavbar.vue';
import ImageDisplay from './components/ImageDisplay.vue';
import PanelResizer from './components/PanelResizer.vue';
import AdjustPanel from './components/AdjustPanel.vue';

// 导入 Composables
import { useLayoutState } from './composables/useLayoutState'
import { useImageState } from './composables/useImageState'
import { useAdjustmentState } from './composables/useAdjustmentState'
import { useHSLState } from './composables/useHSLState'
import { useImageStorage } from './composables/useImageStorage'

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
  exportProcessed,
} = useHSLState()

// 调色参数持久化
const { saveAdjustments, loadAdjustments } = useImageStorage()

// 防抖保存 timer
let saveTimer: ReturnType<typeof setTimeout> | null = null
// 加载参数期间不触发保存
let isLoadingAdjustments = false

// 序列化当前所有调色参数为 JSON
const serializeAdjustments = () => JSON.stringify({
  adjustments: { ...adjustments },
  hslAdjustments: JSON.parse(JSON.stringify(hslAdjustments)),
})

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
      resetAdjustments()
      resetHSL()
      return
    }
    const data = JSON.parse(json)
    if (data.adjustments) setAdjustments(data.adjustments)
    if (data.hslAdjustments) Object.assign(hslAdjustments, data.hslAdjustments)
  } catch {
    resetAdjustments()
    resetHSL()
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

// selectedImageId 变化时（含页面刷新后 onMounted 恢复）加载调色参数
watch(selectedImageId, (id) => {
  if (id != null) applyStoredAdjustments(id)
}, { immediate: true })

// 图片显示组件引用（供模板 ref 使用）
const imageDisplayRef = ref(null)

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