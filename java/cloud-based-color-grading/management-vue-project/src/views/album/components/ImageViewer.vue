<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ImageDisplay } from '@/views/gallery/types/gallery'

interface Props {
  image: ImageDisplay | null
}

interface Emits {
  (e: 'favorite'): void
  (e: 'delete'): void
  (e: 'rotate'): void
  (e: 'setCover'): void
  (e: 'move'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const scale = ref(1)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanning = ref(false)
const imageContainer = ref<HTMLElement | null>(null)

// 重置变换
const resetTransform = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

// 监听图片变化，重置变换
watch(() => props.image?.id, () => {
  resetTransform()
  rotation.value = 0
})

// 移除 computed，直接在模板中使用内联样式以提升性能

// 滚轮缩放（参考 ImagePreview 的实现）
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  if (!props.image) return

  const oldScale = scale.value
  const delta = event.deltaY < 0 ? 0.1 : -0.1
  const newScale = Math.min(8, Math.max(0.2, parseFloat((oldScale + delta).toFixed(1))))
  if (newScale === oldScale) return

  // 鼠标相对于容器的位置
  const container = imageContainer.value
  if (!container) {
    scale.value = newScale
    return
  }

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left - rect.width / 2   // 相对于容器中心
  const mouseY = event.clientY - rect.top - rect.height / 2

  // 缩放后调整偏移，使鼠标指向的点保持不动
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / oldScale)
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / oldScale)
  scale.value = newScale
}

function handleRotate() {
  rotation.value = rotation.value + 90  // 持续累加，不重置
  emit('rotate')
}

function handleDoubleClick() {
  if (!props.image) return
  if (scale.value !== 1 || offsetX.value !== 0 || offsetY.value !== 0) {
    resetTransform()
  } else {
    scale.value = 1.5
  }
}

// 拖拽平移（参考 ImagePreview 的实现）
let px = 0, py = 0, pox = 0, poy = 0, moved = false
const THRESHOLD = 4

function handleMouseDown(event: MouseEvent) {
  if (!props.image || event.button !== 0) return
  event.preventDefault()

  px = event.clientX
  py = event.clientY
  pox = offsetX.value
  poy = offsetY.value
  moved = false

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}

const onMove = (event: MouseEvent) => {
  const dx = event.clientX - px
  const dy = event.clientY - py

  if (!moved && Math.hypot(dx, dy) > THRESHOLD) {
    moved = true
    isPanning.value = true
    document.body.style.cursor = 'grabbing'
  }

  if (moved) {
    offsetX.value = pox + dx
    offsetY.value = poy + dy
  }
}

const onUp = () => {
  isPanning.value = false
  moved = false
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function formatSize(bytes: number) {
  return (bytes / 1024).toFixed(1) + ' KB'
}

function formatDimensions(width: number, height: number) {
  return `${width} × ${height} px`
}
</script>

<template>
  <div class="image-viewer" @wheel="handleWheel">
    <div v-if="image" class="viewer-content">
      <div class="image-container" ref="imageContainer">
        <img
          :src="image.url"
          :alt="image.filename"
          :style="{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg)`,
            cursor: isPanning ? 'grabbing' : (scale > 1 ? 'grab' : 'default')
          }"
          @dblclick="handleDoubleClick"
          @mousedown="handleMouseDown"
        />
      </div>

      <div class="action-bar">
        <button class="action-btn" @click="emit('favorite')" :title="image.isFavorite ? '取消收藏' : '收藏'">
          <svg xmlns="http://www.w3.org/2000/svg" :fill="image.isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        <button class="action-btn" @click="handleRotate" title="旋转">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button class="action-btn" @click="emit('move')" title="转移到其他相册">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        <button class="action-btn" @click="emit('setCover')" title="设为相册封面">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button class="action-btn delete-btn" @click="emit('delete')" title="删除">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div class="info-panel">
        <div class="info-item">
          <span class="info-label">文件名:</span>
          <span class="info-value">{{ image.filename }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">尺寸:</span>
          <span class="info-value">{{ formatDimensions(image.width, image.height) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">大小:</span>
          <span class="info-value">{{ formatSize(image.size) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">格式:</span>
          <span class="info-value">{{ image.format.toUpperCase() }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">缩放:</span>
          <span class="info-value">{{ Math.round(scale * 100) }}%</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p>选择图片以查看</p>
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  width: 100%;
  height: 100%;
  background: #16181c;
  display: flex;
  flex-direction: column;
  position: relative;
}

.viewer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
}

.image-container:active {
  cursor: grabbing;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  will-change: transform;
  transform-origin: center center;
}

.action-bar {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #1c1e22;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  justify-content: center;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #24272d;
  color: #e2e4e9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.action-btn:hover {
  background: #5b6af0;
}

.delete-btn:hover {
  background: #ef4444;
}

.info-panel {
  padding: 1rem;
  background: #1c1e22;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.info-label {
  color: #9ca3af;
}

.info-value {
  color: #e2e4e9;
  font-weight: 500;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #4b5563;
}

.empty-state svg {
  width: 64px;
  height: 64px;
}

.empty-state p {
  font-size: 1rem;
}
</style>
