<template>
  <div class="image-display" :style="{ width: leftPanelWidth + '%' }">
    <!-- 上方图片预览区 -->
    <ImagePreview
      :imageSrc="imageSrc"
      :processedSrc="processedSrc"
      :imageFilter="imageFilter"
      :showUploadTips="showUploadTips"
      :galleryHeight="galleryHeight"
      @upload:image="handleImageUpload"
      ref="imagePreviewRef"
    />
    
    <!-- 图片全览区的上边框拖拽线 -->
    <GalleryResizer
      :currentHeight="galleryHeight"
      :minHeight="16"
      :maxHeight="35"
      @layout:updateGalleryHeight="handleUpdateGalleryHeight"
      @resize:start="handleResizeStart"
      @resize:end="handleResizeEnd"
    />
    
    <!-- 下方图片全览区 -->
    <ImageGallery
      :images="images"
      :selectedImageId="selectedImageId"
      :galleryHeight="galleryHeight"
      @action:selectImage="handleSelectImage"
      @action:addImage="handleImageUpload"
      @layout:resetLayout="handleResetLayout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ImageItem } from '../component-interfaces'
import ImagePreview from './ImagePreview.vue'
import ImageGallery from './ImageGallery.vue'
import GalleryResizer from './GalleryResizer.vue'

// ImageDisplay 组件 - 左侧图片显示区容器
interface ImageDisplayProps {
  leftPanelWidth: number
  images: ImageItem[]
  selectedImageId: number | null
  imageSrc: string
  processedSrc: string
  imageFilter: string
  showUploadTips: boolean
  galleryHeight: number
}

// 事件定义
interface ImageDisplayEvents {
  'action:selectImage': [image: ImageItem]
  'action:uploadImage': [file: File]
  'layout:resetLayout': []
  'layout:updateGalleryHeight': [height: number]
  'resize:start': []
  'resize:end': []
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ImageDisplayProps>()
const emit = defineEmits<ImageDisplayEvents>()

// 图片预览组件引用
const imagePreviewRef = ref<InstanceType<typeof ImagePreview> | null>(null)

// 处理图片选择
const handleSelectImage = (image: ImageItem) => {
  emit('action:selectImage', image)
}

// 处理图片上传
const handleImageUpload = (file: File) => {
  emit('action:uploadImage', file)
}

// 处理重置布局
const handleResetLayout = () => {
  emit('layout:resetLayout')
}

// 处理更新图片全览区高度
const handleUpdateGalleryHeight = (height: number) => {
  emit('layout:updateGalleryHeight', height)
}

// 处理拖拽开始
const handleResizeStart = () => {
  emit('resize:start')
}

// 处理拖拽结束
const handleResizeEnd = () => {
  emit('resize:end')
}

// 暴露图片预览引用供父组件使用（用于保存功能）
defineExpose({
  imagePreviewRef
})
</script>

<style scoped>
.image-display {
  height: 100%;
  background-color: #222;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.1s ease;
}
</style>