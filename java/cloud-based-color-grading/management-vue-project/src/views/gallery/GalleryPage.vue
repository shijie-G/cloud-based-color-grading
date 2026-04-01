<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAlbumState } from './composables/useAlbumState'
import { useImageState } from './composables/useImageState'
import { useSelection } from './composables/useSelection'
import AlbumList from './components/AlbumList.vue'
import ImageBrowser from './components/ImageBrowser.vue'
import AlbumSelector from './components/AlbumSelector.vue'
import type { ViewMode } from './types/gallery'
import { imageDB, UNASSIGNED_ALBUM_ID } from '@/views/workstation/utils/imageDB'

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

// 通知消息
const notification = ref<{ show: boolean; message: string; type: 'success' | 'error' }>({
  show: false,
  message: '',
  type: 'success'
})

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 非分配图片数量
const unassignedCount = ref(0)

// 相册封面 URL Map
const albumCovers = ref<Map<number, string>>(new Map())

// 相册选择器
const showAlbumSelector = ref(false)
const moveImageIds = ref<number[]>([])

// 计算属性
const showBrowser = computed(() => viewMode.value === 'browser' && albumState.currentAlbumId.value !== null)

// 加载非分配图片数量
async function loadUnassignedCount() {
  try {
    const images = await imageDB.getImagesByAlbum(UNASSIGNED_ALBUM_ID)
    unassignedCount.value = images.filter(img => !img.isDeleted).length
  } catch (error) {
    console.error('加载非分配图片数量失败:', error)
  }
}

// 加载所有相册的封面
async function loadAlbumCovers() {
  try {
    const covers = new Map<number, string>()

    for (const album of albumState.albums.value) {
      const images = await imageDB.getImagesByAlbum(album.id)
      const validImages = images.filter(img => !img.isDeleted)

      if (validImages.length > 0) {
        // 使用第一张图片的缩略图作为封面
        const firstImage = validImages[0]
        if (firstImage.thumbnail) {
          covers.set(album.id, firstImage.thumbnail)
        }
      }
    }

    albumCovers.value = covers
  } catch (error) {
    console.error('加载相册封面失败:', error)
  }
}

// 初始化
onMounted(async () => {
  try {
    await albumState.loadAlbums()
    await loadUnassignedCount()
    await loadAlbumCovers()
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
    showNotification('单次最多上传 50 张图片', 'error')
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = { current: 0, total: files.length }

    const result = await imageState.uploadImages(albumId, files)

    uploadProgress.value = { current: files.length, total: files.length }

    // 重新加载封面
    await loadAlbumCovers()

    // 显示成功提示
    setTimeout(() => {
      isUploading.value = false

      // 根据上传结果显示不同的提示
      const { successIds, failedCount, duplicateCount } = result
      if (successIds.length > 0 && failedCount === 0 && duplicateCount === 0) {
        showNotification(`成功上传 ${successIds.length} 张图片到相册`, 'success')
      } else if (successIds.length > 0) {
        let message = `成功上传 ${successIds.length} 张图片`
        if (duplicateCount > 0) message += `，${duplicateCount} 张重复`
        if (failedCount > 0) message += `，${failedCount} 张失败`
        showNotification(message, 'success')
      } else if (duplicateCount > 0) {
        showNotification(`${duplicateCount} 张图片已存在`, 'error')
      } else {
        showNotification('上传失败', 'error')
      }
    }, 500)
  } catch (error: any) {
    console.error('上传失败:', error)
    showNotification(error.message || '上传失败', 'error')
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
  if (!confirm('确定永久删除此图片？删除后无法恢复。')) return

  try {
    // 物理删除图片（包括 history 记录）
    await imageState.permanentDelete(id)

    // 重新加载当前相册
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }

    // 重新加载封面（如果删除的是第一张图片）
    await loadAlbumCovers()
  } catch (error) {
    console.error('删除图片失败:', error)
    alert('删除图片失败')
  }
}

// 转移图片到其他相册
async function handleMoveImage(id: number) {
  moveImageIds.value = [id]
  showAlbumSelector.value = true
}

// 批量转移
async function handleBatchMove(ids: number[]) {
  moveImageIds.value = ids
  showAlbumSelector.value = true
}

// 选择目标相册
async function handleAlbumSelect(targetAlbumId: number) {
  try {
    const count = moveImageIds.value.length
    const targetAlbum = albumState.albums.value.find(a => a.id === targetAlbumId)

    // 确认操作
    if (!confirm(`确定要将 ${count} 张图片转移到「${targetAlbum?.name || '目标相册'}」吗？`)) {
      return
    }

    await imageState.moveToAlbum(moveImageIds.value, targetAlbumId)

    // 重新加载当前相册
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }

    // 重新加载封面
    await loadAlbumCovers()

    // 关闭选择器
    showAlbumSelector.value = false
    moveImageIds.value = []

    // 清除选择
    selection.clearSelection()

    // 显示成功提示
    showNotification(`已转移 ${count} 张图片到 ${targetAlbum?.name || '目标相册'}`, 'success')
  } catch (error: any) {
    console.error('转移图片失败:', error)
    showNotification(error.message || '转移失败', 'error')
  }
}

// 取消选择相册
function handleAlbumSelectorCancel() {
  showAlbumSelector.value = false
  moveImageIds.value = []
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
  if (!confirm(`确定永久删除选中的 ${ids.length} 张图片？删除后无法恢复。`)) return

  try {
    // 物理删除图片（包括 history 记录）
    await imageState.batchPermanentDelete(ids)

    // 重新加载当前相册
    if (albumState.currentAlbumId.value) {
      await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)
    }

    // 重新加载封面
    await loadAlbumCovers()

    selection.clearSelection()
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败')
  }
}

// 拖拽上传
function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  // 只有在浏览相册时才允许拖拽
  if (viewMode.value === 'browser' && albumState.currentAlbumId.value !== null) {
    isDragging.value = true
  }
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

  // 只有在浏览相册时才允许上传
  if (viewMode.value !== 'browser' || !albumState.currentAlbumId.value) {
    return
  }

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return

  if (files.length > 50) {
    showNotification('单次最多上传 50 张图片', 'error')
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = { current: 0, total: files.length }

    const result = await imageState.uploadImages(albumState.currentAlbumId.value, files)

    uploadProgress.value = { current: files.length, total: files.length }

    // 重新加载当前相册
    await imageState.loadImagesByAlbum(albumState.currentAlbumId.value)

    // 重新加载封面
    await loadAlbumCovers()

    setTimeout(() => {
      isUploading.value = false

      // 根据上传结果显示不同的提示
      const { successIds, failedCount, duplicateCount } = result
      if (successIds.length > 0 && failedCount === 0 && duplicateCount === 0) {
        showNotification(`成功上传 ${successIds.length} 张图片`, 'success')
      } else if (successIds.length > 0) {
        let message = `成功上传 ${successIds.length} 张图片`
        if (duplicateCount > 0) message += `，${duplicateCount} 张重复`
        if (failedCount > 0) message += `，${failedCount} 张失败`
        showNotification(message, 'success')
      } else if (duplicateCount > 0) {
        showNotification(`${duplicateCount} 张图片已存在`, 'error')
      } else {
        showNotification('上传失败', 'error')
      }
    }, 500)
  } catch (error: any) {
    console.error('上传失败:', error)
    showNotification(error.message || '上传失败', 'error')
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
        :unassigned-count="unassignedCount"
        :album-covers="albumCovers"
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
        @move="handleMoveImage"
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

    <!-- 通知消息 -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ notification.message }}</span>
      </div>
    </div>

    <!-- 相册选择器 -->
    <AlbumSelector
      v-if="showAlbumSelector"
      :albums="albumState.albums.value"
      :current-album-id="albumState.currentAlbumId.value"
      @select="handleAlbumSelect"
      @cancel="handleAlbumSelectorCancel"
    />
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

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  min-width: 300px;
  background: #1c1e22;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

.notification.success {
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.notification.error {
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #e2e4e9;
  font-size: 0.95rem;
}

.notification.success .notification-content svg {
  width: 24px;
  height: 24px;
  color: #22c55e;
  flex-shrink: 0;
}

.notification.error .notification-content svg {
  width: 24px;
  height: 24px;
  color: #ef4444;
  flex-shrink: 0;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

