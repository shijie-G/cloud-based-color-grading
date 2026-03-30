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

function startEdit() {
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
      <div v-if="!isEditing" class="album-title" @dblclick.stop="startEdit">
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
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
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

.album-cover {
  width: 100%;
  height: 180px;
  background: #24272d;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
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
  cursor: text;
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

