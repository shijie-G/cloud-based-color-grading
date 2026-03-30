<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageDisplay } from '../types/gallery'

interface Props {
  image: ImageDisplay | null
}

interface Emits {
  (e: 'favorite'): void
  (e: 'delete'): void
  (e: 'rotate'): void
  (e: 'fullscreen'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotation.value}deg) translate(${translateX.value}px, ${translateY.value}px)`
}))

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  scale.value = Math.max(0.1, Math.min(10, scale.value * delta))
}

function handleRotate() {
  rotation.value = (rotation.value + 90) % 360
  emit('rotate')
}

function handleDoubleClick() {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

function handleMouseDown(event: MouseEvent) {
  if (scale.value > 1) {
    isDragging.value = true
    dragStart.value = { x: event.clientX - translateX.value, y: event.clientY - translateY.value }
  }
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    translateX.value = event.clientX - dragStart.value.x
    translateY.value = event.clientY - dragStart.value.y
  }
}

function handleMouseUp() {
  isDragging.value = false
}

function formatSize(bytes: number) {
  return (bytes / 1024).toFixed(1) + ' KB'
}

function formatDimensions(width: number, height: number) {
  return `${width} × ${height} px`
}
</script>

<template>
  <div class="image-viewer" @wheel="handleWheel" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
    <div v-if="image" class="viewer-content">
      <div class="image-container">
        <img
          :src="image.url"
          :alt="image.filename"
          :style="imageStyle"
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

        <button class="action-btn" @click="emit('fullscreen')" title="全屏">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
  transition: transform 0.1s ease-out;
  user-select: none;
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
