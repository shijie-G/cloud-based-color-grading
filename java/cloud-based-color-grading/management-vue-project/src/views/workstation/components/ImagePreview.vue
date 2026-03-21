<template>
  <div 
    class="image-preview-area" 
    :style="{ height: `calc(100% - ${galleryHeight}vh - 8px)` }"
    :class="{ 'drag-over': isDragOver, 'has-image': !!imageSrc }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @wheel.prevent="handleWheel"
  >
    <!-- 文件拖拽遮罩 -->
    <div class="drag-backdrop" v-if="isDragOver"></div>

    <div class="image-wrapper">
      <img
        ref="previewImage"
        :src="imageSrc"
        alt="预览图片"
        :style="{
          display: imageSrc ? 'block' : 'none',
          filter: imageFilter,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          transition: isPanning ? 'none' : 'transform 0.2s ease'
        }"
        @dblclick="handleDoubleClick"
        @mousedown="handleMouseDown"
      />

      <!-- 缩放比例指示器 -->
      <div class="scale-indicator" v-if="imageSrc && scale !== 1">
        {{ Math.round(scale * 100) }}%
        <button class="reset-btn" @click="resetTransform" title="复位 (ESC)">复位</button>
      </div>

      <!-- 上传提示 -->
      <div class="upload-area" v-if="showUploadTips">
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <p class="primary-text">拖拽图片到此处</p>
            <p class="secondary-text">支持 JPG、PNG、GIF 格式</p>
          </div>
        </div>
      </div>

      <!-- 文件拖拽覆盖层 -->
      <div class="drag-overlay" v-if="isDragOver">
        <div class="drag-content">
          <p>释放以上传图片</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ImagePreview 组件 - 图片预览
interface ImagePreviewProps {
  imageSrc: string
  imageFilter: string
  showUploadTips: boolean
  galleryHeight: number
}

interface ImagePreviewEvents {
  'upload:image': [file: File]
}

const props = defineProps<ImagePreviewProps>()
const emit = defineEmits<ImagePreviewEvents>()

// ── DOM 引用 ─────────────────────────────
const previewImage = ref<HTMLImageElement | null>(null)

// ── 文件拖拽上传状态 ──────────────────────
const isDragOver = ref(false)
const dragCounter = ref(0)

// ── 图片变换状态 ──────────────────────────
const scale   = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// 是否正在拖动平移（用于切换 transition）
const isPanning = ref(false)

// 复位
const resetTransform = () => {
  scale.value   = 1
  offsetX.value = 0
  offsetY.value = 0
}

// ── 1. 双击放大 ───────────────────────────
// 原始状态双击放大到 150%；有任何移动或放大则双击复原
const handleDoubleClick = () => {
  if (!props.imageSrc) return
  const isTransformed = scale.value !== 1 || offsetX.value !== 0 || offsetY.value !== 0
  if (isTransformed) {
    resetTransform()
  } else {
    scale.value = 1.5
  }
}

// ── 2. 滚轮精细缩放（每次 ±0.1）─────────
const handleWheel = (event: WheelEvent) => {
  if (!props.imageSrc) return
  event.preventDefault()
  const delta = event.deltaY < 0 ? 0.1 : -0.1
  scale.value = Math.min(4, Math.max(0.2, parseFloat((scale.value + delta).toFixed(1))))
}

// ── 3. 拖拽平移（仅放大后生效）───────────
let panStartX = 0
let panStartY = 0
let panStartOffsetX = 0
let panStartOffsetY = 0
let hasMoved = false
const MOVE_THRESHOLD = 4

const handleMouseDown = (event: MouseEvent) => {
  if (!props.imageSrc || event.button !== 0) return
  // 只有放大后才允许平移
  if (scale.value <= 1) return

  event.preventDefault()
  panStartX = event.clientX
  panStartY = event.clientY
  panStartOffsetX = offsetX.value
  panStartOffsetY = offsetY.value
  hasMoved = false

  document.addEventListener('mousemove', onPanMove)
  document.addEventListener('mouseup', onPanEnd)
  document.body.style.userSelect = 'none'
}

const onPanMove = (event: MouseEvent) => {
  const dx = event.clientX - panStartX
  const dy = event.clientY - panStartY
  if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
    hasMoved = true
    isPanning.value = true
    document.body.style.cursor = 'grabbing'
  }
  if (hasMoved) {
    offsetX.value = panStartOffsetX + dx
    offsetY.value = panStartOffsetY + dy
  }
}

const onPanEnd = () => {
  isPanning.value = false
  hasMoved = false
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onPanEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ── 4. ESC 复位 ───────────────────────────
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') resetTransform()
}

// ── 生命周期 ──────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onPanEnd)
  window.removeEventListener('keydown', handleKeyDown)
})

// ── 文件上传拖拽 ──────────────────────────
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value++
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value--
  if (dragCounter.value <= 0) {
    dragCounter.value = 0
    isDragOver.value = false
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (!isDragOver.value) {
    isDragOver.value = true
    dragCounter.value = 1
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
  dragCounter.value = 0

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const maxFiles = 10
  const fileArray = Array.from(files)
  if (fileArray.length > maxFiles) {
    alert(`一次最多只能上传 ${maxFiles} 张图片，当前选择了 ${fileArray.length} 张`)
    return
  }
  fileArray.forEach(file => {
    if (isValidImageFile(file)) {
      emit('upload:image', file)
    } else {
      alert(`文件 ${file.name} 不是有效的图片格式（支持 JPG、PNG、GIF）`)
    }
  })
}

const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  return validTypes.includes(file.type)
}

defineExpose({ previewImage, resetTransform })
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
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 5;
  pointer-events: none;
}

.image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  transform-origin: center center;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}

/* 缩放比例指示器 */
.scale-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  padding: 4px 10px;
  border-radius: 20px;
  pointer-events: auto;
  z-index: 20;
  user-select: none;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
  outline: none;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.28);
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
  top: 50%; left: 50%;
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