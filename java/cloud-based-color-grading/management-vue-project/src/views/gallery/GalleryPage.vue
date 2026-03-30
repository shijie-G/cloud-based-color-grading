<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAlbumState } from './composables/useAlbumState'
import { useImageState } from './composables/useImageState'
import { useSelection } from './composables/useSelection'
import AlbumList from './components/AlbumList.vue'
import ImageBrowser from './components/ImageBrowser.vue'
import type { ViewMode } from './types/gallery'

// 状态管理
const albumState = useAlbumState()
const imageState = useImageState()
const selection = useSelection()

// 视图模式
const viewMode = ref<ViewMode>('albums')

// 拖拽上传
const isDragging = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const isUploading = ref(false)

// 计算属性
const showBrowser = computed(() => viewMode.value === 'browser' && albumState.currentAlbumId.value !== null)

// 初始化
onMounted(async () => {
  try {
    await albumState.loadAlbums()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 相册操作
async function handleCreateAlbum() {
  const name = prompt('请输入相册名称:')
  if (!name) return

  try {
    await albumState.createAlbum(name)
  } catch (error: any) {
    alert(error.message || '创建相册失败')
  }
}

async function handleSelectAlbum(albumId: number) {
  try {
    albumState.setCurrentAlbum(albumId)
    await imageState.loadImagesByAlbum(albumId)
    viewMode.value = 'browser'
    selection.clearSelection()
  } catch (error) {
    console.error('加载相册失败:', error)
    alert('加载相册失败')
  }
}

async function handleRenameAlbum(albumId: number, newName: string) {
  try {
    await albumState.renameAlbum(albumId, newName)
  } catch (error: any) {
    alert(error.message || '重命名失败')
  }
}

async function handleDeleteAlbum(albumId: number) {
  if (!confirm('确定删除此相册？相册内的所有图片也将被删除。')) return

  try {
    await albumState.deleteAlbum(albumId)
  } catch (error) {
    console.error('删除相册失败:', error)
    alert('删除相册失败')
  }
}

// 相册拖拽上传
async function handleAlbumUpload(albumId: number, files: File[]) {
  if (files.length === 0) return

  if (files.length > 50) {
    alert('单次最多上传 50 张图片')
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = { current: 0, total: files.length }

    await imageState.uploadImages(albumId, files)

    uploadProgress.value = { current: files.length, total: files.length }

    // 显示成功提示
    setTimeout(() => {
      isUploading.value = false
      alert(`成功上传 ${files.length} 张图片到相册`)
    }, 500)
  } catch (error: any) {
    console.error('上传失败:', error)
    alert(error.message || '上传失败')
    isUploading.value = false
  }
}

// 图片选择
function handleImageSelect(id: number, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    selection.toggleSelect(id)
  } else if (event.shiftKey) {
    const allIds = imageState.filteredImages.value.map(img => img.id)
    selection.rangeSelect(id, allIds)
  } else {
    selection.clearSelection()
    imageState.setCurrentImage(id)
  }
}

// 图片操作
async function handleToggleFavorite(id: number) {
  try {
    await imageState.toggleFavorite(id)
  } catch (error) {
    console.error('切换收藏失败:', error)
  }
}

async function handleDeleteImage(id: number) {
  if (!confirm('确定将此图片移至回收站？')) return

  try {
    await imageState.moveToTrash(id)
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    alert('删除图片失败')
  }
}

// 批量操作
async function handleBatchFavorite(ids: number[]) {
  try {
    await imageState.batchFavorite(ids)
    selection.clearSelection()
  } catch (error) {
    console.error('批量收藏失败:', error)
    alert('批量收藏失败')
  }
}

async function handleBatchDelete(ids: number[]) {
  if (!confirm(`确定将选中的 ${ids.length} 张图片移至回收站？`)) return

  try {
    await imageState.batchMoveToTrash(ids)
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }
    selection.clearSelection()
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败')
  }
}

async function handleBatchMove(ids: number[]) {
  const targetId = prompt('请输入目标相册 ID:')
  if (!targetId) return

  try {
    await imageState.batchMoveToAlbum(ids, parseInt(targetId))
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }
    selection.clearSelection()
  } catch (error) {
    console.error('批量移动失败:', error)
    alert('批量移动失败')
  }
}

// 拖拽上传
function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  if (event.target === event.currentTarget) {
    isDragging.value = false
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (!albumState.currentAlbumId.value) {
    alert('请先选择相册')
    return
  }

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return

  if (files.length > 50) {
    alert('单次最多上传 50 张图片')
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = { current: 0, total: files.length }

    await imageState.uploadImages(albumState.currentAlbumId.value, files)

    uploadProgress.value = { current: files.length, total: files.length }
    setTimeout(() => {
      isUploading.value = false
    }, 1000)
  } catch (error: any) {
    console.error('上传失败:', error)
    alert(error.message || '上传失败')
    isUploading.value = false
  }
}
</script>

<template>
  <div
    class="gallery-page"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 主内容区 -->
    <div class="gallery-content">
      <!-- 相册列表视图 -->
      <AlbumList
        v-if="viewMode === 'albums'"
        :month-groups="albumState.monthGroups.value"
        @select="handleSelectAlbum"
        @rename="handleRenameAlbum"
        @delete="handleDeleteAlbum"
        @create="handleCreateAlbum"
        @upload="handleAlbumUpload"
      />

      <!-- 图片浏览视图 -->
      <ImageBrowser
        v-else-if="showBrowser"
        :images="imageState.filteredImages.value"
        :current-id="imageState.currentImageId.value"
        :selected-ids="selection.selectedArray.value"
        :quick-filter="imageState.quickFilter.value"
        @select="handleImageSelect"
        @favorite="handleToggleFavorite"
        @delete="handleDeleteImage"
        @batch-favorite="handleBatchFavorite"
        @batch-delete="handleBatchDelete"
        @batch-move="handleBatchMove"
        @clear-selection="selection.clearSelection"
        @filter-change="(mode) => imageState.setQuickFilter(mode as any)"
      />
    </div>

    <!-- 拖拽上传遮罩 -->
    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p>拖放图片到此处上传</p>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-content">
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>上传中 {{ uploadProgress.current }} / {{ uploadProgress.total }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #16181c;
  position: relative;
  overflow: hidden;
}

.gallery-content {
  flex: 1;
  overflow: hidden;
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 24, 28, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #5b6af0;
}

.drag-content svg {
  width: 80px;
  height: 80px;
}

.drag-content p {
  font-size: 1.25rem;
  font-weight: 500;
}

.upload-progress {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #1c1e22;
  border: 1px solid rgba(91, 106, 240, 0.3);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #e2e4e9;
  font-size: 0.95rem;
}

.spinner {
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

