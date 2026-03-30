<template>
  <div class="image-display" :style="{ width: leftPanelWidth + '%' }">
    <!-- 上方图片预览区 -->
    <ImagePreview
      :imageSrc="imageSrc"
      :processedSrc="processedSrc"
      :showUploadTips="showUploadTips"
      :galleryHeight="galleryHeight"
      :maskActive="maskActive"
      :maskActiveLayer="maskActiveLayer"
      :maskShowOverlay="maskShowOverlay"
      :cropActive="cropActive"
      :cropRatio="cropRatio"
      :cropInitialRect="cropInitialRect"
      :transformPending="transformPending"
      :gridSettings="gridSettings"
      :applyGridPreset="applyGridPreset"
      @upload:image="handleImageUpload"
      @mask:commit="emit('mask:commit')"
      @mask:updateLayer="emit('mask:updateLayer', $event)"
      @crop:commit="emit('crop:commit', $event)"
      @crop:cancel="emit('crop:cancel')"
      @transform:confirm="emit('transform:confirm')"
      @transform:cancel="emit('transform:cancel')"
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
      :compareActive="compareActive"
      @action:selectImage="handleSelectImage"
      @action:addImage="handleImageUpload"
      @action:toggleCompare="emit('action:toggleCompare')"
      @layout:resetLayout="handleResetLayout"
      @album:change="emit('album:change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ImageItem } from '../component-interfaces'
import type { MaskLayer } from '../composables/useMaskState'
import ImagePreview from './ImagePreview.vue'
import ImageGallery from './ImageGallery.vue'
import GalleryResizer from './GalleryResizer.vue'

interface ImageDisplayProps {
  leftPanelWidth: number
  images: ImageItem[]
  selectedImageId: number | null
  imageSrc: string
  processedSrc: string
  showUploadTips: boolean
  galleryHeight: number
  maskActive: boolean
  maskActiveLayer: MaskLayer | null
  maskShowOverlay: boolean
  cropActive: boolean
  cropRatio: number | null
  cropInitialRect: { x: number; y: number; w: number; h: number } | null
  transformPending: boolean
  gridSettings: import('../composables/useGridState').GridSettings
  applyGridPreset: (p: 'thirds' | 'ninths' | 'golden') => void
  compareActive?: boolean
}

interface ImageDisplayEvents {
  'action:selectImage':        [image: ImageItem]
  'action:uploadImage':        [file: File]
  'layout:resetLayout':        []
  'layout:updateGalleryHeight':[height: number]
  'resize:start':              []
  'resize:end':                []
  'mask:commit':               []
  'mask:updateLayer':          [layer: import('../composables/useMaskState').MaskLayer]
  'crop:commit':               [rect: { x: number; y: number; w: number; h: number }]
  'crop:cancel':               []
  'transform:confirm':         []
  'transform:cancel':          []
  'action:toggleCompare':      []
  'album:change':              [albumId: number | null]
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