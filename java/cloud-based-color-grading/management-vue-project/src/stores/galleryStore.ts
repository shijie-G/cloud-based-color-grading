import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Gallery 全局状态管理
 * 用于在 Workstation 和 Gallery 之间共享当前选中的相册 ID
 */
export const useGalleryStore = defineStore('gallery', () => {
  // 当前选中的相册 ID（null 表示未选中任何相册）
  const currentAlbumId = ref<number | null>(null)

  // 设置当前相册 ID
  function setCurrentAlbumId(albumId: number | null) {
    currentAlbumId.value = albumId
  }

  // 清除当前相册选择
  function clearCurrentAlbum() {
    currentAlbumId.value = null
  }

  return {
    currentAlbumId,
    setCurrentAlbumId,
    clearCurrentAlbum
  }
})
