import type { AlbumRecord, ImageRecord } from '../types/gallery'
import { imageDB, type ImageDBItem } from '@/views/workstation/utils/imageDB'

/**
 * Gallery 数据库适配器
 * 将 Gallery 的 ImageRecord 映射到 WorkstationDB 的 ImageDBItem
 */

/**
 * 从 Blob 中提取图片元数据
 */
async function extractImageMetadata(blob: Blob): Promise<{
  width: number
  height: number
  format: string
}> {
  const img = await createImageBitmap(blob)
  const format = blob.type.split('/')[1] || 'jpeg'
  const result = {
    width: img.width,
    height: img.height,
    format
  }
  img.close()
  return result
}

/**
 * 将 ImageDBItem 转换为 ImageRecord
 */
async function toImageRecord(item: ImageDBItem): Promise<ImageRecord> {
  const metadata = await extractImageMetadata(item.blob)

  return {
    id: item.id,
    albumId: item.albumId || 0,
    filename: item.name,
    blob: item.blob,
    thumbnail: item.thumbnail,
    editedSrc: item.editedSrc,  // 传递编辑后的图片
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    size: item.blob.size,
    isFavorite: item.isFavorite || false,
    favoritedAt: item.favoritedAt,
    isDeleted: item.isDeleted || false,
    deletedAt: item.deletedAt,
    tags: item.tags || [],
    sortOrder: item.sortOrder || 0,
    uploadedAt: new Date(item.uploadTime).getTime()
  }
}

/**
 * 将 ImageRecord 转换为 ImageDBItem（用于更新操作）
 */
function imageRecordToDBItem(record: ImageRecord, existing: ImageDBItem): ImageDBItem {
  // 创建纯对象，避免 Vue 响应式代理问题
  return {
    id: existing.id,
    name: record.filename,
    blob: existing.blob,  // 保持原有的 blob
    src: existing.src,    // 保持原有的 src
    editedSrc: existing.editedSrc,  // 保持原有的 editedSrc
    cropStateJson: existing.cropStateJson,
    thumbnail: existing.thumbnail,
    uploadTime: existing.uploadTime,
    lastModified: new Date(),
    fileHash: existing.fileHash,
    adjustmentsJson: existing.adjustmentsJson,
    albumId: Number(record.albumId),  // 确保是纯数字
    isFavorite: Boolean(record.isFavorite),  // 确保是纯布尔值
    favoritedAt: record.favoritedAt ? Number(record.favoritedAt) : undefined,
    isDeleted: Boolean(record.isDeleted),
    deletedAt: record.deletedAt ? Number(record.deletedAt) : undefined,
    tags: record.tags ? Array.from(record.tags) : [],  // 创建新数组
    sortOrder: Number(record.sortOrder)
  }
}

/**
 * IndexedDB 操作封装（适配到 WorkstationDB）
 */
export function useGalleryDB() {
  // ==================== 相册操作 ====================

  /**
   * 获取所有相册
   */
  async function getAllAlbums(): Promise<AlbumRecord[]> {
    return await imageDB.getAllAlbums()
  }

  /**
   * 根据 ID 获取相册
   */
  async function getAlbumById(id: number): Promise<AlbumRecord | undefined> {
    return await imageDB.getAlbumById(id)
  }

  /**
   * 创建相册
   */
  async function createAlbum(album: Omit<AlbumRecord, 'id'>): Promise<number> {
    return await imageDB.createAlbum(album)
  }

  /**
   * 更新相册
   */
  async function updateAlbum(album: AlbumRecord): Promise<void> {
    return await imageDB.updateAlbum(album)
  }

  /**
   * 删除相册（同时删除相册内所有图片）
   */
  async function deleteAlbum(id: number): Promise<void> {
    return await imageDB.deleteAlbum(id)
  }

  // ==================== 图片操作 ====================

  /**
   * 获取相册内所有图片
   */
  async function getImagesByAlbum(albumId: number): Promise<ImageRecord[]> {
    const items = await imageDB.getImagesByAlbum(albumId)
    return Promise.all(items.map(toImageRecord))
  }

  /**
   * 根据 ID 获取图片
   */
  async function getImageById(id: number): Promise<ImageRecord | undefined> {
    const item = await imageDB.getImage(id)
    return item ? await toImageRecord(item) : undefined
  }

  /**
   * 更新图片
   */
  async function updateImage(image: ImageRecord): Promise<void> {
    try {
      const item = await imageDB.getImage(image.id)
      if (!item) {
        throw new Error(`图片 ID ${image.id} 不存在`)
      }

      const updated = imageRecordToDBItem(image, item)
      await imageDB.saveImage(updated)
    } catch (error) {
      console.error('更新图片失败:', error, '图片数据:', image)
      throw error
    }
  }

  /**
   * 批量更新图片
   */
  async function updateImages(images: ImageRecord[]): Promise<void> {
    const items: ImageDBItem[] = []

    for (const image of images) {
      const item = await imageDB.getImage(image.id)
      if (item) {
        items.push(imageRecordToDBItem(image, item))
      }
    }

    await imageDB.updateImages(items)
  }

  /**
   * 永久删除图片
   */
  async function deleteImage(id: number): Promise<void> {
    await imageDB.deleteImage(id)
  }

  /**
   * 批量永久删除图片
   */
  async function deleteImages(ids: number[]): Promise<void> {
    for (const id of ids) {
      await imageDB.deleteImage(id)
    }
  }

  /**
   * 获取所有收藏图片
   */
  async function getFavoriteImages(): Promise<ImageRecord[]> {
    const items = await imageDB.getFavoriteImages()
    return Promise.all(items.map(toImageRecord))
  }

  /**
   * 获取回收站图片
   */
  async function getDeletedImages(): Promise<ImageRecord[]> {
    const items = await imageDB.getDeletedImages()
    return Promise.all(items.map(toImageRecord))
  }

  return {
    // 相册操作
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    // 图片操作
    getImagesByAlbum,
    getImageById,
    updateImage,
    updateImages,
    deleteImage,
    deleteImages,
    getFavoriteImages,
    getDeletedImages
  }
}
