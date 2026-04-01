<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ImageDisplay } from '@/views/gallery/types/gallery'

interface Props {
  images: ImageDisplay[]
  currentId: number | null
  selectedIds: number[]
}

interface Emits {
  (e: 'select', id: number, event: MouseEvent): void
  (e: 'contextmenu', id: number, event: MouseEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const containerRef = ref<HTMLElement>()

function handleClick(id: number, event: MouseEvent) {
  emit('select', id, event)

  // 滚动到选中的图片
  nextTick(() => {
    scrollToCurrentImage()
  })
}

function handleContextMenu(id: number, event: MouseEvent) {
  event.preventDefault()
  emit('contextmenu', id, event)
}

function isSelected(id: number) {
  return props.selectedIds.includes(id)
}

function isCurrent(id: number) {
  return props.currentId === id
}

// 滚动到当前选中的图片
function scrollToCurrentImage() {
  if (!containerRef.value || !props.currentId) return

  const currentIndex = props.images.findIndex(img => img.id === props.currentId)
  if (currentIndex === -1) return

  const items = containerRef.value.querySelectorAll('.thumbnail-item')
  const currentItem = items[currentIndex] as HTMLElement

  if (currentItem) {
    const containerHeight = containerRef.value.clientHeight
    const itemTop = currentItem.offsetTop
    const itemHeight = currentItem.clientHeight
    const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2)

    containerRef.value.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }
}

// 监听当前图片变化
watch(() => props.currentId, () => {
  nextTick(() => {
    scrollToCurrentImage()
  })
})

// 格式化文件大小
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div ref="containerRef" class="thumbnail-strip">
    <div
      v-for="image in images"
      :key="image.id"
      class="thumbnail-item"
      :class="{
        'is-current': isCurrent(image.id),
        'is-selected': isSelected(image.id),
        'is-favorite': image.isFavorite
      }"
      @click="handleClick(image.id, $event)"
      @contextmenu="handleContextMenu(image.id, $event)"
    >
      <div class="thumbnail-wrapper">
        <img :src="image.thumbnailUrl" :alt="image.filename" />
        <div class="thumbnail-overlay">
          <div class="overlay-gradient"></div>
          <div class="image-info">
            <span class="image-name">{{ image.filename }}</span>
            <span class="image-size">{{ formatSize(image.size) }}</span>
          </div>
        </div>
      </div>

      <div v-if="image.isFavorite" class="favorite-badge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>

      <div v-if="isSelected(image.id)" class="selection-badge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumbnail-strip {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem;
  background: #1c1e22;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.thumbnail-item {
  position: relative;
  width: 100%;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.thumbnail-item:hover {
  transform: translateX(4px);
}

.thumbnail-item.is-current {
  transform: translateX(8px);
}

.thumbnail-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.25s ease;
  background: #24272d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.thumbnail-item:hover .thumbnail-wrapper {
  border-color: rgba(91, 106, 240, 0.4);
  box-shadow: 0 4px 16px rgba(91, 106, 240, 0.2);
}

.thumbnail-item.is-current .thumbnail-wrapper {
  border-color: #5b6af0;
  box-shadow: 0 6px 20px rgba(91, 106, 240, 0.5);
}

.thumbnail-item.is-selected .thumbnail-wrapper {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.thumbnail-item.is-favorite .thumbnail-wrapper {
  border-color: rgba(239, 68, 68, 0.3);
}

.thumbnail-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.thumbnail-item:hover .thumbnail-wrapper img {
  transform: scale(1.05);
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.thumbnail-item:hover .thumbnail-overlay {
  opacity: 1;
}

.overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  z-index: 1;
}

.image-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #e2e4e9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.image-size {
  font-size: 0.65rem;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.favorite-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 22px;
  height: 22px;
  color: #ef4444;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8));
  z-index: 2;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.selection-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 24px;
  height: 24px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  border: 2px solid #3b82f6;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.thumbnail-strip::-webkit-scrollbar {
  width: 6px;
}

.thumbnail-strip::-webkit-scrollbar-track {
  background: #16181c;
  border-radius: 3px;
}

.thumbnail-strip::-webkit-scrollbar-thumb {
  background: #24272d;
  border-radius: 3px;
  transition: background 0.2s;
}

.thumbnail-strip::-webkit-scrollbar-thumb:hover {
  background: #2d3139;
}
</style>
