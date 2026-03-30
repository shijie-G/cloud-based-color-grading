<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ImageDisplay } from '../types/gallery'
import ThumbnailStrip from './ThumbnailStrip.vue'
import ImageViewer from './ImageViewer.vue'
import QuickFilterBar from './QuickFilterBar.vue'
import BatchActionBar from './BatchActionBar.vue'

interface Props {
  images: ImageDisplay[]
  currentId: number | null
  selectedIds: number[]
  quickFilter: string
}

interface Emits {
  (e: 'select', id: number, event: MouseEvent): void
  (e: 'favorite', id: number): void
  (e: 'delete', id: number): void
  (e: 'batchFavorite', ids: number[]): void
  (e: 'batchDelete', ids: number[]): void
  (e: 'batchMove', ids: number[]): void
  (e: 'clearSelection'): void
  (e: 'filterChange', mode: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentImage = computed(() => {
  if (!props.currentId) return null
  return props.images.find(img => img.id === props.currentId) || null
})

const filterCounts = computed(() => {
  const all = props.images.length
  const favorites = props.images.filter(img => img.isFavorite).length
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recent = props.images.filter(img => img.uploadedAt >= oneDayAgo).length
  return { all, favorites, recent }
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('clearSelection')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="image-browser">
    <QuickFilterBar
      :mode="quickFilter as any"
      :counts="filterCounts"
      @change="(mode) => emit('filterChange', mode)"
    />

    <BatchActionBar
      v-if="selectedIds.length > 0"
      :count="selectedIds.length"
      @favorite="emit('batchFavorite', selectedIds)"
      @delete="emit('batchDelete', selectedIds)"
      @move="emit('batchMove', selectedIds)"
      @clear="emit('clearSelection')"
    />

    <div class="browser-content">
      <div class="thumbnail-section">
        <ThumbnailStrip
          :images="images"
          :current-id="currentId"
          :selected-ids="selectedIds"
          @select="(id, event) => emit('select', id, event)"
        />
      </div>

      <div class="viewer-section">
        <ImageViewer
          :image="currentImage"
          @favorite="currentId && emit('favorite', currentId)"
          @delete="currentId && emit('delete', currentId)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-browser {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #16181c;
}

.browser-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.thumbnail-section {
  width: 12%;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.viewer-section {
  width: 88%;
  height: 100%;
}
</style>
