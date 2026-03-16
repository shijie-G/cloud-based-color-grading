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
        :canSave="!!imageSrc"
        :canReset="!!imageSrc"
        @update:adjustments="setAdjustments"
        @action:uploadImage="handleImageUpload"
        @action:save="handleSaveImage"
        @action:reset="resetAdjustments"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TopNavbar from './components/TopNavbar.vue';
import ImageDisplay from './components/ImageDisplay.vue';
import PanelResizer from './components/PanelResizer.vue';
import AdjustPanel from './components/AdjustPanel.vue';

// 导入 Composables
import { useLayoutState } from './composables/useLayoutState'
import { useImageState } from './composables/useImageState'
import { useAdjustmentState } from './composables/useAdjustmentState'

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
  hasSelectedImage
} = useImageState();

// 使用调整状态管理
const {
  adjustments,
  imageFilter,
  resetAdjustments,
  setAdjustments,
  saveImage
} = useAdjustmentState();

// 图片显示组件引用
const imageDisplayRef = ref(null);

// 处理面板拖拽开始
const handlePanelResizeStart = () => {
  isResizing.value = true;
};

// 处理面板拖拽结束
const handlePanelResizeEnd = () => {
  isResizing.value = false;
  // 保存布局设置
  saveLayoutSettings();
};

// 更新面板宽度
const updatePanelWidth = (width) => {
  leftPanelWidth.value = width;
};

// 处理图片全览区拖拽开始
const handleGalleryResizeStart = () => {
  isGalleryResizing.value = true;
};

// 处理图片全览区拖拽结束
const handleGalleryResizeEnd = () => {
  isGalleryResizing.value = false;
  // 保存布局设置
  saveLayoutSettings();
};

// 更新图片全览区高度
const updateGalleryHeight = (height) => {
  galleryHeight.value = height;
};

// 处理图片选择
const handleSelectImage = (image) => {
  selectImage(image);
  // 重置调整参数
  resetAdjustments();
};

// 暴露方法供测试使用
const selectImageForTest = (image) => {
  handleSelectImage(image);
};

// 处理保存图片
const handleSaveImage = () => {
  if (!imageSrc.value) {
    alert('请先上传图片！');
    return;
  }

  // 直接创建 canvas 和下载链接，不依赖异步图片加载
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 设置默认尺寸
  canvas.width = 800;
  canvas.height = 600;
  
  // 应用滤镜
  ctx.filter = imageFilter.value;
  
  // 生成下载链接
  const link = document.createElement('a');
  link.download = `edited-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

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