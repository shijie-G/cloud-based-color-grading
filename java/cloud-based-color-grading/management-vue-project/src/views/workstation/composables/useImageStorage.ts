/**
 * 图片存储管理 Composable
 * 封装IndexedDB操作，提供简单的存储接口
 */

import { imageDB, type ImageDBItem } from '../utils/imageDB'
import type { ImageItem } from '../component-interfaces'
import type { CropState } from '../types/cropTypes'

export interface UseImageStorageReturn {
  saveImageToDB: (image: ImageItem) => Promise<void>
  loadImagesFromDB: () => Promise<ImageItem[]>
  deleteImageFromDB: (imageId: number) => Promise<void>
  clearAllImagesFromDB: () => Promise<void>
  getStoredImageCount: () => Promise<number>
  generateFileHash: (file: File) => string
  checkFileExists: (fileHash: string) => Promise<boolean>
  saveAdjustments: (imageId: number, adjustmentsJson: string) => Promise<void>
  loadAdjustments: (imageId: number) => Promise<string | null>
  /** 保存裁切数据（editedSrc + cropState），不覆盖原图 */
  saveCropData: (imageId: number, editedSrc: string, cropState: CropState) => Promise<void>
  /** 加载裁切数据 */
  loadCropData: (imageId: number) => Promise<{ editedSrc?: string; cropState?: CropState } | null>
  /** 读取原图 src（永不被裁切覆盖） */
  loadOriginalSrc: (imageId: number) => Promise<string | null>
}

export function useImageStorage(): UseImageStorageReturn {
  
  /**
   * 生成文件哈希（名称+大小+格式）
   */
  const generateFileHash = (file: File): string => {
    return `${file.name}_${file.size}_${file.type}`
  }
  
  /**
   * 检查文件是否已存在
   */
  const checkFileExists = async (fileHash: string): Promise<boolean> => {
    try {
      return await imageDB.existsByHash(fileHash)
    } catch (error) {
      console.error('检查文件是否存在失败:', error)
      return false
    }
  }
  
  /**
   * 将ImageItem转换为ImageDBItem并保存（仅保存原图，不覆盖 editedSrc）
   */
  const saveImageToDB = async (image: ImageItem): Promise<void> => {
    try {
      const blob = image.originalFile || await fetch(image.src).then(r => r.blob())

      // 先读取已有记录，保留 editedSrc / cropStateJson / adjustmentsJson
      const existing = await imageDB.getImage(image.id)

      const dbItem: ImageDBItem = {
        id: image.id,
        name: image.name,
        blob: blob,
        src: image.src,           // 原图永不覆盖
        editedSrc:     existing?.editedSrc,
        cropStateJson: existing?.cropStateJson,
        adjustmentsJson: existing?.adjustmentsJson,
        thumbnail: image.thumbnail,
        uploadTime: existing?.uploadTime ?? new Date(),
        lastModified: new Date(),
        fileHash: image.fileHash,
      }

      await imageDB.saveImage(dbItem)
    } catch (error) {
      console.error('保存图片到IndexedDB失败:', error)
      throw error
    }
  }

  /**
   * 从IndexedDB加载所有图片并转换为ImageItem
   * src 优先使用 editedSrc（裁切后），没有则用原图 src
   */
  const loadImagesFromDB = async (): Promise<ImageItem[]> => {
    try {
      const dbItems = await imageDB.getAllImages()

      const images: ImageItem[] = dbItems.map(item => ({
        id: item.id,
        name: item.name,
        src: item.editedSrc ?? item.src,  // 有裁切版本则用裁切版本
        thumbnail: item.thumbnail,
        originalFile: new File([item.blob], item.name, { type: item.blob.type }),
        fileHash: item.fileHash,
      }))

      console.log(`从IndexedDB加载了 ${images.length} 张图片`)
      return images
    } catch (error) {
      console.error('从IndexedDB加载图片失败:', error)
      return []
    }
  }

  /**
   * 从IndexedDB删除指定图片
   */
  const deleteImageFromDB = async (imageId: number): Promise<void> => {
    try {
      await imageDB.deleteImage(imageId)
      console.log(`图片已从IndexedDB删除: ID ${imageId}`)
    } catch (error) {
      console.error('从IndexedDB删除图片失败:', error)
      throw error
    }
  }

  /**
   * 清空IndexedDB中的所有图片
   */
  const clearAllImagesFromDB = async (): Promise<void> => {
    try {
      await imageDB.clearAll()
      console.log('已清空IndexedDB中的所有图片')
    } catch (error) {
      console.error('清空IndexedDB失败:', error)
      throw error
    }
  }

  /**
   * 获取IndexedDB中存储的图片数量
   */
  const getStoredImageCount = async (): Promise<number> => {
    try {
      const count = await imageDB.getCount()
      return count
    } catch (error) {
      console.error('获取图片数量失败:', error)
      return 0
    }
  }

  /**
   * 保存调色参数到 IndexedDB（JSON 格式）
   */
  const saveAdjustments = async (imageId: number, adjustmentsJson: string): Promise<void> => {
    try {
      await imageDB.updateAdjustments(imageId, adjustmentsJson)
    } catch (error) {
      console.error('保存调色参数失败:', error)
    }
  }

  /**
   * 从 IndexedDB 读取调色参数
   */
  const loadAdjustments = async (imageId: number): Promise<string | null> => {
    try {
      return await imageDB.getAdjustments(imageId)
    } catch (error) {
      console.error('读取调色参数失败:', error)
      return null
    }
  }

  /**
   * 保存裁切数据（editedSrc + cropState JSON），不覆盖原图
   */
  const saveCropData = async (imageId: number, editedSrc: string, cropState: CropState): Promise<void> => {
    try {
      await imageDB.updateCropData(imageId, editedSrc, JSON.stringify(cropState))
    } catch (error) {
      console.error('保存裁切数据失败:', error)
    }
  }

  /**
   * 加载裁切数据
   */
  const loadCropData = async (imageId: number): Promise<{ editedSrc?: string; cropState?: CropState } | null> => {
    try {
      const data = await imageDB.getCropData(imageId)
      if (!data) return null
      return {
        editedSrc: data.editedSrc,
        cropState: data.cropStateJson ? JSON.parse(data.cropStateJson) : undefined,
      }
    } catch (error) {
      console.error('加载裁切数据失败:', error)
      return null
    }
  }

  /** 读取原图 src（永不被裁切覆盖的原始 dataUrl） */
  const loadOriginalSrc = async (imageId: number): Promise<string | null> => {
    try {
      const item = await imageDB.getImage(imageId)
      return item?.src ?? null
    } catch {
      return null
    }
  }

  return {
    saveImageToDB,
    loadImagesFromDB,
    deleteImageFromDB,
    clearAllImagesFromDB,
    getStoredImageCount,
    generateFileHash,
    checkFileExists,
    saveAdjustments,
    loadAdjustments,
    saveCropData,
    loadCropData,
    loadOriginalSrc,
  }
}
