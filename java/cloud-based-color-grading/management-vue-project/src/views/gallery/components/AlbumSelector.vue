<script setup lang="ts">
import type { AlbumRecord } from '../types/gallery'

interface Props {
  albums: AlbumRecord[]
  currentAlbumId: number | null
}

interface Emits {
  (e: 'select', albumId: number): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 过滤掉当前相册
const availableAlbums = props.albums.filter(a => a.id !== props.currentAlbumId)

function handleSelect(albumId: number) {
  emit('select', albumId)
}

function handleCancel() {
  emit('cancel')
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="album-selector-overlay" @click.self="handleCancel">
    <div class="album-selector-modal">
      <div class="modal-header">
        <h3>选择目标相册</h3>
        <button class="close-btn" @click="handleCancel">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="availableAlbums.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>没有其他相册可以转移</p>
      </div>

      <div v-else class="album-list">
        <div
          v-for="album in availableAlbums"
          :key="album.id"
          class="album-item"
          @click="handleSelect(album.id)"
        >
          <div class="album-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div class="album-info">
            <h4>{{ album.name }}</h4>
            <span class="album-date">{{ formatDate(album.createdAt) }}</span>
          </div>
          <div class="album-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.album-selector-modal {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: #1c1e22;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e4e9;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state svg {
  width: 64px;
  height: 64px;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

.album-list {
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.album-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.album-item:hover {
  background: #2a2d35;
  border-color: rgba(91, 106, 240, 0.3);
  transform: translateX(4px);
}

.album-icon {
  width: 40px;
  height: 40px;
  background: rgba(91, 106, 240, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5b6af0;
  flex-shrink: 0;
}

.album-icon svg {
  width: 24px;
  height: 24px;
}

.album-info {
  flex: 1;
  min-width: 0;
}

.album-info h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-date {
  font-size: 0.85rem;
  color: #9ca3af;
}

.album-arrow {
  width: 20px;
  height: 20px;
  color: #6b7280;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.album-item:hover .album-arrow {
  transform: translateX(4px);
  color: #5b6af0;
}

.album-arrow svg {
  width: 100%;
  height: 100%;
}

.album-list::-webkit-scrollbar {
  width: 6px;
}

.album-list::-webkit-scrollbar-track {
  background: #16181c;
  border-radius: 3px;
}

.album-list::-webkit-scrollbar-thumb {
  background: #24272d;
  border-radius: 3px;
}

.album-list::-webkit-scrollbar-thumb:hover {
  background: #2d3139;
}
</style>
