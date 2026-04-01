<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { imageDB } from '@/views/workstation/utils/imageDB'
import type { ImageDBItem } from '@/views/workstation/utils/imageDB'

interface Emits {
  (e: 'select', imageUrl: string, width: number, height: number): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const albums = ref<Array<{ id: number; name: string }>>([])
const selectedAlbumId = ref<number | null>(null)
const images = ref<ImageDBItem[]>([])
const loading = ref(false)

onMounted(async () => {
  try {
    albums.value = await imageDB.getAllAlbums()
    if (albums.value.length > 0) {
      selectedAlbumId.value = albums.value[0].id
      await loadImages(albums.value[0].id)
    }
  } catch (error) {
    console.error('加载相册失败:', error)
  }
})

async function loadImages(albumId: number) {
  loading.value = true
  try {
    const allImages = await imageDB.getImagesByAlbum(albumId)
    images.value = allImages.filter(img => !img.isDeleted)
  } catch (error) {
    console.error('加载图片失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleAlbumChange(albumId: number) {
  selectedAlbumId.value = albumId
  await loadImages(albumId)
}

function handleImageSelect(image: ImageDBItem) {
  const imageUrl = image.editedSrc || image.src
  console.log('ImageSelector: 选择图片', imageUrl)

  // 获取图片尺寸
  const img = new Image()
  img.onload = () => {
    console.log('ImageSelector: 图片加载完成', img.naturalWidth, img.naturalHeight)
    emit('select', imageUrl, img.naturalWidth, img.naturalHeight)
    emit('close')
  }
  img.onerror = (e) => {
    console.error('ImageSelector: 图片加载失败', imageUrl, e)
  }
  img.src = imageUrl
}
</script>

<template>
  <div class="image-selector-overlay" @click.self="emit('close')">
    <div class="image-selector-modal">
      <div class="modal-header">
        <h3>从相册选择图片</h3>
        <button class="close-btn" @click="emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 相册选择 -->
        <div class="album-selector">
          <label>选择相册：</label>
          <select v-model="selectedAlbumId" @change="handleAlbumChange(selectedAlbumId!)">
            <option v-for="album in albums" :key="album.id" :value="album.id">
              {{ album.name }}
            </option>
          </select>
        </div>

        <!-- 图片网格 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="images.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          <p>该相册暂无图片</p>
        </div>

        <div v-else class="image-grid">
          <div
            v-for="image in images"
            :key="image.id"
            class="image-item"
            @click="handleImageSelect(image)"
          >
            <img :src="image.thumbnail || image.src" :alt="image.name" />
            <div class="image-overlay">
              <span class="image-name">{{ image.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
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

.image-selector-modal {
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: #1c1e22;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e4e9;
}

.close-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.album-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.album-selector label {
  color: #9ca3af;
  font-size: 0.9rem;
  white-space: nowrap;
}

.album-selector select {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e4e9;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.album-selector select:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.album-selector select:focus {
  outline: none;
  border-color: #5b6af0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #5b6af0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #24272d;
  transition: all 0.2s ease;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.3);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-name {
  color: white;
  font-size: 0.85rem;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
