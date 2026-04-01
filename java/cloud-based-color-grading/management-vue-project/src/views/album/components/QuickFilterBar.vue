<script setup lang="ts">
import type { QuickFilterMode } from '@/views/gallery/types/gallery'

interface Props {
  mode: QuickFilterMode
  counts: {
    all: number
    favorites: number
    recent: number
  }
}

interface Emits {
  (e: 'change', mode: QuickFilterMode): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="quick-filter-bar">
    <button
      class="filter-btn"
      :class="{ active: mode === 'all' }"
      @click="emit('change', 'all')"
    >
      全部 ({{ counts.all }})
    </button>
    <button
      class="filter-btn"
      :class="{ active: mode === 'favorites' }"
      @click="emit('change', 'favorites')"
    >
      仅收藏 ({{ counts.favorites }})
    </button>
    <button
      class="filter-btn"
      :class="{ active: mode === 'recent' }"
      @click="emit('change', 'recent')"
    >
      最新上传 ({{ counts.recent }})
    </button>
  </div>
</template>

<style scoped>
.quick-filter-bar {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #9ca3af;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-btn:hover {
  border-color: rgba(91, 106, 240, 0.5);
  color: #e2e4e9;
}

.filter-btn.active {
  background: #5b6af0;
  border-color: #5b6af0;
  color: #fff;
}
</style>
