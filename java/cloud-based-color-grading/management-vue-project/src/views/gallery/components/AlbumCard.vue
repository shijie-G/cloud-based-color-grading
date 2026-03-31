<script setup lang="ts">
import { ref } from 'vue'
import type { AlbumRecord } from '../types/gallery'

interface Props {
  album: AlbumRecord
  coverUrl?: string
}

interface Emits {
  (e: 'click'): void
  (e: 'rename', newName: string): void
  (e: 'delete'): void
  (e: 'upload', files: File[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditing = ref(false)
const editName = ref('')
const isDragging = ref(false)
const showMenu = ref(false)

function toggleMenu(event: MouseEvent) {
  event.stopPropagation()
  showMenu.value = !showMenu.value
}

function startEdit(event: MouseEvent) {
  event.stopPropagation()
  showMenu.value = false
  isEditing.value = true
  editName.value = props.album.name
}

function confirmEdit() {
  if (editName.value.trim()) {
    emit('rename', editName.value.trim())
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
}

function handleDelete(event: MouseEvent) {
  event.stopPropagation()
  showMenu.value = false
  emit('delete')
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.target === event.currentTarget) {
    isDragging.value = false
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (imageFiles.length > 0) {
    emit('upload', imageFiles)
  }
}

function handleCardClick(event: MouseEvent) {
  if (!isDragging.value) {
    emit('click')
  }
}
</script>

<template>
  <div
    class="album-card"
    :class="{ 'is-dragging': isDragging }"
    @click="handleCardClick"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 操作按钮 -->
    <div class="album-actions">
      <button class="action-menu-btn" @click="toggleMenu" title="操作">
        <span class="dots">···</span>
      </button>

      <!-- 下拉菜单 -->
      <div v-if="showMenu" class="action-menu" @click.stop>
        <button class="menu-item" @click="startEdit">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          重命名
        </button>
        <button class="menu-item delete" @click="handleDelete">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除相册
        </button>
      </div>
    </div>

    <div class="album-cover">
      <img v-if="coverUrl" :src="coverUrl" alt="封面" />
      <div v-else class="empty-cover">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div v-if="isDragging" class="drag-indicator">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>拖放图片到此相册</span>
      </div>
    </div>
    <div class="album-info">
      <div v-if="!isEditing" class="album-title">
        {{ album.name }}
      </div>
      <input
        v-else
        v-model="editName"
        class="album-title-input"
        @click.stop
        @blur="confirmEdit"
        @keyup.enter="confirmEdit"
        @keyup.esc="cancelEdit"
        autofocus
      />
      <div class="album-date">{{ formatDate(album.createdAt) }}</div>
    </div>
  </div>
</template>

<style scoped>
.album-card {
  background: #1c1e22;
  border-radius: 8px;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.album-card:hover {
  border-color: rgba(91, 106, 240, 0.3);
  transform: translateY(-4px);
}

.album-card.is-dragging {
  border-color: #5b6af0;
  border-width: 2px;
  transform: scale(1.02);
}

.album-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
}

.action-menu-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.action-menu-btn:hover {
  background: rgba(91, 106, 240, 0.9);
  border-color: #5b6af0;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.4);
}

.action-menu-btn .dots {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  letter-spacing: 2px;
  user-select: none;
}

.action-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 150px;
  background: #2a2d35;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 30;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #e2e4e9;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background: rgba(91, 106, 240, 0.15);
}

.menu-item.delete {
  color: #ef4444;
}

.menu-item.delete:hover {
  background: rgba(239, 68, 68, 0.15);
}

.menu-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.album-cover {
  width: 100%;
  height: 180px;
  background: #24272d;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border-radius: 8px 8px 0 0;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-cover {
  width: 64px;
  height: 64px;
  color: #4b5563;
}

.empty-cover svg {
  width: 100%;
  height: 100%;
}

.drag-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(91, 106, 240, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #fff;
  z-index: 10;
}

.drag-indicator svg {
  width: 48px;
  height: 48px;
}

.drag-indicator span {
  font-size: 0.9rem;
  font-weight: 500;
}

.album-info {
  padding: 1rem;
}

.album-title {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin-bottom: 0.5rem;
}

.album-title-input {
  width: 100%;
  background: #24272d;
  border: 1px solid #5b6af0;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  color: #e2e4e9;
  font-size: 1rem;
  outline: none;
  margin-bottom: 0.5rem;
}

.album-date {
  font-size: 0.85rem;
  color: #9ca3af;
}
</style>

