/**
 * 图片上传辅助工具
 * 提供统一的图片上传逻辑，供 Workstation 和 Gallery 共用
 */

import { imageDB, type ImageDBItem, UNASSIGNED_ALBUM_ID } from './imageDB'

/**
 * 生成文件哈希（名称+大小+格式）
 */
export function generateFileHash(file: File): string {
  return `${file.name}_${file.size}_${file.type}`
}

/**
 * 生成缩略图（压缩到最大 1280px，保持比例，接近 720p 清晰度）
 */
export function generateThumbnail(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1280  // 提升到 1280px，接近 720p (1280x720)
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))  // 提升质量到 85%
    }
    img.onerror = () => resolve(src) // 失败时降级用原图
    img.src = src
  })
}

/**
 * 将 File 转换为 DataURL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as DataURL'))
      }
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

/**
 * 上传图片到数据库的通用接口
 * @param file 要上传的文件
 * @param albumId 可选的相册 ID（Gallery 专用）。如果不传，Workstation 上传的图片会自动分配到"非分配图片"相册
 * @returns 返回保存后的图片 ID 和相关数据
 */
export async function uploadImageToDB(
  file: File,
  albumId?: number
): Promise<{
  id: number
  name: string
  src: string
  thumbnail: string
  fileHash: string
  blob: Blob
}> {
  // 生成文件哈希
  const fileHash = generateFileHash(file)

  // 检查文件是否已存在
  const exists = await imageDB.existsByHash(fileHash)
  if (exists) {
    throw new Error(`图片 "${file.name}" 已存在，无法重复添加`)
  }

  // 读取文件为 DataURL
  const src = await fileToDataURL(file)

  // 生成缩略图
  const thumbnail = await generateThumbnail(src)

  // 生成唯一 ID
  const id = Date.now() + Math.random()

  // 如果没有指定 albumId，默认分配到"非分配图片"相册
  const finalAlbumId = albumId !== undefined ? albumId : UNASSIGNED_ALBUM_ID

  // 构建数据库记录
  const dbItem: ImageDBItem = {
    id,
    name: file.name,
    blob: file,
    src,
    thumbnail,
    uploadTime: new Date(),
    lastModified: new Date(),
    fileHash,
    // Gallery 扩展字段（可选）
    albumId: finalAlbumId,
    isFavorite: false,
    isDeleted: false,
    tags: [],
    sortOrder: 0,
  }

  // 保存到数据库
  await imageDB.saveImage(dbItem)

  return {
    id,
    name: file.name,
    src,
    thumbnail,
    fileHash,
    blob: file,
  }
}

/**
 * 批量上传图片
 * @param files 要上传的文件数组
 * @param albumId 可选的相册 ID（Gallery 专用）
 * @param onProgress 进度回调
 * @returns 返回成功上传的图片 ID 数组
 */
export async function batchUploadImages(
  files: File[],
  albumId?: number,
  onProgress?: (current: number, total: number) => void
): Promise<number[]> {
  const ids: number[] = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImageToDB(files[i], albumId)
      ids.push(result.id)
      onProgress?.(i + 1, total)
    } catch (error) {
      console.error(`上传 ${files[i].name} 失败:`, error)
      // 继续上传其他文件
    }
  }

  return ids
}
