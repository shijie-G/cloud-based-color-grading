<template>
  <div 
    class="image-preview-area" 
    :style="{ height: `calc(100% - ${galleryHeight}vh - 4px)` }"
    :class="{ 'drag-over': isDragOver, 'has-image': !!imageSrc }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <!-- 全屏磨砂遮罩层 -->
    <div class="drag-backdrop" v-if="isDragOver"></div>
    
    <div class="image-wrapper">
      <img
        ref="previewImage"
        :src="imageSrc"
        alt="预览图片"
        :style="{ display: imageSrc ? 'block' : 'none', filter: imageFilter }"
      />
      
      <!-- 上传提示区域 -->
      <div class="upload-area" v-if="showUploadTips">
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <p class="primary-text">拖拽图片到此处或点击选择</p>
            <p class="secondary-text">支持 JPG、PNG、GIF 格式</p>
          </div>
        </div>
      </div>
      
      <!-- 拖拽覆盖层 -->
      <div class="drag-overlay" v-if="isDragOver">
        <div class="drag-content">
          <p>释放以上传图片</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ImagePreview 组件 - 图片预览
interface ImagePreviewProps {
  imageSrc: string
  imageFilter: string
  showUploadTips: boolean
  galleryHeight: number
}

// 事件定义
interface ImagePreviewEvents {
  'upload:image': [file: File]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ImagePreviewProps>()
const emit = defineEmits<ImagePreviewEvents>()

// 图片DOM引用
const previewImage = ref<HTMLImageElement | null>(null)
// 拖拽状态
const isDragOver = ref(false)
// 拖拽计数器（用于处理嵌套元素的dragenter/dragleave）
const dragCounter = ref(0)

// 处理文件选择（保留用于拖拽功能）
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && isValidImageFile(file)) {
    emit('upload:image', file)
  }
  // 清空input值，允许重复选择同一文件
  if (target) {
    target.value = ''
  }
}

// 处理拖拽进入
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value++
  isDragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value--
  // 只有当计数器归零时才隐藏效果
  if (dragCounter.value <= 0) {
    dragCounter.value = 0
    isDragOver.value = false
  }
}

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  // 确保拖拽状态保持激活
  if (!isDragOver.value) {
    isDragOver.value = true
    dragCounter.value = 1
  }
}

// 处理文件拖拽放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
  dragCounter.value = 0
  
  // 移除showUploadTips限制，始终允许拖拽上传
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    // 限制最多10张图片
    const maxFiles = 10
    const fileArray = Array.from(files)
    
    if (fileArray.length > maxFiles) {
      alert(`一次最多只能上传 ${maxFiles} 张图片，当前选择了 ${fileArray.length} 张`)
      return
    }
    
    // 遍历所有文件，支持多张图片上传
    fileArray.forEach(file => {
      if (isValidImageFile(file)) {
        emit('upload:image', file)
      } else {
        alert(`文件 ${file.name} 不是有效的图片格式（支持 JPG、PNG、GIF）`)
      }
    })
  }
}

// 验证是否为有效的图片文件
const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  return validTypes.includes(file.type)
}

// 暴露previewImage引用供父组件使用（用于保存功能）
defineExpose({
  previewImage
})
</script>

<style scoped>
.image-preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 2vw;
  position: relative;
  border: 2px dashed transparent;
  border-radius: 8px;
}

.image-preview-area:not(.has-image):hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.image-preview-area.drag-over {
  background-color: rgba(0, 0, 0, 0.3);
}

.drag-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 5;
  pointer-events: none;
  will-change: opacity;
  transition: opacity 0.1s ease;
}

.image-wrapper {
  max-width: 100%;
  max-height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #aaa;
  user-select: none;
  width: 100%;
  height: 100%;
}

.upload-content {
  padding: 40px 60px;
  border: 2px dashed transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.upload-area:hover .upload-content {
  border-color: rgba(255, 255, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.03);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.upload-text .primary-text {
  font-size: 18px;
  margin-bottom: 8px;
  color: #ccc;
}

.upload-text .secondary-text {
  font-size: 14px;
  color: #888;
}

.drag-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 200px;
  background-color: rgba(80, 80, 80, 0.85);
  border: 2px dashed rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  will-change: transform, opacity;
  transition: opacity 0.1s ease;
}

.drag-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
}

.drag-content p {
  font-size: 16px;
  margin: 0;
}
</style>