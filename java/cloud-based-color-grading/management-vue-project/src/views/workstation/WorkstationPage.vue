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
        :imageFilter="imageFilter"
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
        :imageFilter="imageFilter"
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

// HSL 颜色范围调节
const {
  hslAdjustments,
  processedSrc,
  resetHSL,
  setSourceImage,
  exportProcessed,
} = useHSLState()

// 当选中图片变化时，通知 HSL 处理器
watch(imageSrc, (src) => {
  setSourceImage(src)
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
const handleSelectImage = (image: ImageItem) => {
  selectImage(image);
  resetAdjustments();
};

// 暴露方法供测试使用
const selectImageForTest = (image: ImageItem) => {
  handleSelectImage(image);
};

// 处理保存图片（format: 'png' | 'jpeg'）
const handleSaveImage = async (format: 'png' | 'jpeg' = 'png') => {
  if (!imageSrc.value) {
    alert('请先上传图片！')
    return
  }

  // 1. 获取 HSL 处理后的原图 dataURL（无 HSL 调整时直接用原图）
  const hslDataUrl = await exportProcessed(format, format === 'jpeg' ? 0.95 : 1)

  // 2. 把 HSL 结果画到 canvas，再叠加 CSS filter
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = hslDataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!

  // 应用 CSS filter（brightness/contrast/saturate 等）
  const filter = imageFilter.value
  if (filter && filter !== 'none') ctx.filter = filter
  ctx.drawImage(img, 0, 0)

  // 3. 导出并下载
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  const quality  = format === 'jpeg' ? 0.95 : 1
  const dataUrl  = canvas.toDataURL(mimeType, quality)

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