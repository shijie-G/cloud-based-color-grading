<script setup lang="ts">
interface Props {
  count: number
}

interface Emits {
  (e: 'favorite'): void
  (e: 'delete'): void
  (e: 'move'): void
  (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="batch-action-bar">
    <div class="selection-info">
      已选中 {{ count }} 张图片
    </div>
    <div class="actions">
      <button class="batch-btn" @click="emit('favorite')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        批量收藏
      </button>
      <button class="batch-btn" @click="emit('move')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        移动相册
      </button>
      <button class="batch-btn delete-btn" @click="emit('delete')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        批量删除
      </button>
      <button class="batch-btn" @click="emit('clear')">
        取消选择
      </button>
    </div>
  </div>
</template>

<style scoped>
.batch-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.selection-info {
  font-size: 0.95rem;
  color: #e2e4e9;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #e2e4e9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.batch-btn svg {
  width: 16px;
  height: 16px;
}

.batch-btn:hover {
  background: #5b6af0;
  border-color: #5b6af0;
}

.delete-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
}
</style>
