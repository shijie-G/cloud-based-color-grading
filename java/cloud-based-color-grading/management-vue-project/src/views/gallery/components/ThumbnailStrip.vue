<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ImageDisplay } from '../types/gallery'

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
      <img :src="image.url" :alt="image.filename" />
      <div v-if="image.isFavorite" class="favorite-badge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
  padding: 0.5rem;
  background: #1c1e22;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.thumbnail-item {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.thumbnail-item:hover {
  border-color: rgba(91, 106, 240, 0.5);
}

.thumbnail-item.is-current {
  transform: scale(1.05);
  border-color: #5b6af0;
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.4);
}

.thumbnail-item.is-selected {
  border-color: #3b82f6;
}

.thumbnail-item.is-favorite {
  border-color: #ef4444;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  color: #ef4444;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}

.thumbnail-strip::-webkit-scrollbar {
  width: 6px;
}

.thumbnail-strip::-webkit-scrollbar-track {
  background: #16181c;
}

.thumbnail-strip::-webkit-scrollbar-thumb {
  background: #24272d;
  border-radius: 3px;
}

.thumbnail-strip::-webkit-scrollbar-thumb:hover {
  background: #2d3139;
}
</style>
