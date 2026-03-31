import { ref, computed } from 'vue'
import type { ImageRecord, ImageDisplay, SortMode, QuickFilterMode } from '../types/gallery'
import { useGalleryDB } from './useGalleryDB'
import { batchUploadImages } from '@/views/workstation/utils/imageUploadHelper'

const images = ref<ImageRecord[]>([])
const currentImageId = ref<number | null>(null)
const sortMode = ref<SortMode>('uploadedAt-desc')
const quickFilter = ref<QuickFilterMode>('all')

/**
 * 图片状态管理
 */
export function useImageState() {
  const db = useGalleryDB()

  /**
   * 当前图片
   */
  const currentImage = computed(() => {
    if (!currentImageId.value) return null
    return images.value.find(img => img.id === currentImageId.value) || null
  })

  /**
   * 图片显示列表（转换为 URL）
   */
  const imageDisplays = computed<ImageDisplay[]>(() => {
    return images.value.map(img => {
      // 优先使用编辑后的图片（editedSrc），如果没有则使用原始 blob
      const url = img.editedSrc || URL.createObjectURL(img.blob)
      // 如果有缩略图 DataURL，直接使用；否则使用原图 URL
      const thumbnailUrl = img.thumbnail || url

      return {
        ...img,
        url,
        thumbnailUrl
      }
    })
  })

  /**
   * 筛选后的图片
   */
  const filteredImages = computed(() => {
    let result = imageDisplays.value.filter(img => !img.isDeleted)

    // 快速筛选
    if (quickFilter.value === 'favorites') {
      result = result.filter(img => img.isFavorite)
    } else if (quickFilter.value === 'recent') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      result = result.filter(img => img.uploadedAt >= oneDayAgo)
    }

    // 排序
    switch (sortMode.value) {
      case 'uploadedAt-asc':
        result.sort((a, b) => a.uploadedAt - b.uploadedAt)
        break
      case 'uploadedAt-desc':
        result.sort((a, b) => b.uploadedAt - a.uploadedAt)
        break
      case 'size-asc':
        result.sort((a, b) => a.size - b.size)
        break
      case 'size-desc':
        result.sort((a, b) => b.size - a.size)
        break
      case 'favorite-first':
        result.sort((a, b) => {
          if (a.isFavorite === b.isFavorite) {
            return b.uploadedAt - a.uploadedAt
          }
          return a.isFavorite ? -1 : 1
        })
        break
    }

    return result
  })

  /**
   * 加载相册图片
   */
  async function loadImagesByAlbum(albumId: number) {
    try {
      const data = await db.getImagesByAlbum(albumId)
      images.value = data
    } catch (error) {
      console.error('加载图片失败:', error)
      throw error
    }
  }

  /**
   * 加载收藏图片
   */
  async function loadFavoriteImages() {
    try {
      const data = await db.getFavoriteImages()
      images.value = data
    } catch (error) {
      console.error('加载收藏图片失败:', error)
      throw error
    }
  }

  /**
   * 加载回收站图片
   */
  async function loadDeletedImages() {
    try {
      const data = await db.getDeletedImages()
      images.value = data
    } catch (error) {
      console.error('加载回收站图片失败:', error)
      throw error
    }
  }

  /**
   * 上传图片（使用统一的上传逻辑）
   */
  async function uploadImages(albumId: number, files: File[]): Promise<{ successIds: number[]; failedCount: number; duplicateCount: number }> {
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const validFiles = files.filter(f => supportedFormats.includes(f.type))

    if (validFiles.length === 0) {
      throw new Error('没有支持的图片格式')
    }

    const skipped = files.length - validFiles.length

    try {
      // 使用统一的上传逻辑（包含缩略图生成、哈希检查等）
      const result = await batchUploadImages(validFiles, albumId)

      // 重新加载相册图片
      await loadImagesByAlbum(albumId)

      if (skipped > 0) {
        console.warn(`${skipped} 个文件格式不支持，已跳过`)
      }

      return result
    } catch (error) {
      console.error('上传图片失败:', error)
      throw error
    }
  }

  /**
   * 切换收藏状态
   */
  async function toggleFavorite(imageId: number) {
    try {
      const image = images.value.find(img => img.id === imageId)
      if (!image) throw new Error('图片不存在')

      image.isFavorite = !image.isFavorite
      image.favoritedAt = image.isFavorite ? Date.now() : undefined
      await db.updateImage(image)
    } catch (error) {
      console.error('切换收藏失败:', error)
      throw error
    }
  }

  /**
   * 批量收藏
   */
  async function batchFavorite(imageIds: number[]) {
    try {
      const toUpdate = images.value.filter(img => imageIds.includes(img.id) && !img.isFavorite)
      toUpdate.forEach(img => {
        img.isFavorite = true
        img.favoritedAt = Date.now()
      })
      await db.updateImages(toUpdate)
    } catch (error) {
      console.error('批量收藏失败:', error)
      throw error
    }
  }

  /**
   * 移至回收站
   */
  async function moveToTrash(imageId: number) {
    try {
      const image = images.value.find(img => img.id === imageId)
      if (!image) {
        throw new Error(`图片 ID ${imageId} 不存在于当前列表中`)
      }

      console.log('准备移至回收站:', imageId, image)

      image.isDeleted = true
      image.deletedAt = Date.now()

      await db.updateImage(image)

      console.log('成功移至回收站:', imageId)
    } catch (error) {
      console.error('移至回收站失败:', error)
      throw error
    }
  }

  /**
   * 批量移至回收站
   */
  async function batchMoveToTrash(imageIds: number[]) {
    try {
      const toUpdate = images.value.filter(img => imageIds.includes(img.id))
      toUpdate.forEach(img => {
        img.isDeleted = true
        img.deletedAt = Date.now()
      })
      await db.updateImages(toUpdate)
    } catch (error) {
      console.error('批量移至回收站失败:', error)
      throw error
    }
  }

  /**
   * 从回收站恢复
   */
  async function restoreFromTrash(imageId: number) {
    try {
      const image = images.value.find(img => img.id === imageId)
      if (!image) throw new Error('图片不存在')

      image.isDeleted = false
      image.deletedAt = undefined
      await db.updateImage(image)
    } catch (error) {
      console.error('恢复图片失败:', error)
      throw error
    }
  }

  /**
   * 永久删除
   */
  async function permanentDelete(imageId: number) {
    try {
      await db.deleteImage(imageId)
      images.value = images.value.filter(img => img.id !== imageId)
    } catch (error) {
      console.error('永久删除失败:', error)
      throw error
    }
  }

  /**
   * 批量永久删除
   */
  async function batchPermanentDelete(imageIds: number[]) {
    try {
      await db.deleteImages(imageIds)
      images.value = images.value.filter(img => !imageIds.includes(img.id))
    } catch (error) {
      console.error('批量永久删除失败:', error)
      throw error
    }
  }

  /**
   * 添加标签
   */
  async function addTag(imageId: number, tag: string) {
    try {
      const image = images.value.find(img => img.id === imageId)
      if (!image) throw new Error('图片不存在')

      if (!image.tags.includes(tag)) {
        image.tags.push(tag)
        await db.updateImage(image)
      }
    } catch (error) {
      console.error('添加标签失败:', error)
      throw error
    }
  }

  /**
   * 移除标签
   */
  async function removeTag(imageId: number, tag: string) {
    try {
      const image = images.value.find(img => img.id === imageId)
      if (!image) throw new Error('图片不存在')

      image.tags = image.tags.filter(t => t !== tag)
      await db.updateImage(image)
    } catch (error) {
      console.error('移除标签失败:', error)
      throw error
    }
  }

  /**
   * 批量移动到相册
   */
  async function batchMoveToAlbum(imageIds: number[], targetAlbumId: number) {
    try {
      const toUpdate = images.value.filter(img => imageIds.includes(img.id))
      toUpdate.forEach(img => {
        img.albumId = targetAlbumId
      })
      await db.updateImages(toUpdate)
    } catch (error) {
      console.error('批量移动失败:', error)
      throw error
    }
  }

  /**
   * 设置当前图片
   */
  function setCurrentImage(id: number | null) {
    currentImageId.value = id
  }

  /**
   * 设置排序模式
   */
  function setSortMode(mode: SortMode) {
    sortMode.value = mode
  }

  /**
   * 设置快速筛选
   */
  function setQuickFilter(filter: QuickFilterMode) {
    quickFilter.value = filter
  }

  return {
    images,
    currentImage,
    currentImageId,
    imageDisplays,
    filteredImages,
    sortMode,
    quickFilter,
    loadImagesByAlbum,
    loadFavoriteImages,
    loadDeletedImages,
    uploadImages,
    toggleFavorite,
    batchFavorite,
    moveToTrash,
    batchMoveToTrash,
    restoreFromTrash,
    permanentDelete,
    batchPermanentDelete,
    addTag,
    removeTag,
    batchMoveToAlbum,
    setCurrentImage,
    setSortMode,
    setQuickFilter
  }
}
