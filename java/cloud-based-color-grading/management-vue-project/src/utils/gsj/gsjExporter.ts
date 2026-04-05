/**
 * .gsj 工程文件导出器
 * 从 IndexedDB 读取全部数据 → 序列化 → 两轮加密 → 下载为 .gsj 文件
 */

import { imageDB } from '../../views/workstation/utils/imageDB'
import type { ImageDBItem } from '../../views/workstation/utils/imageDB'
import { GSJ_VERSION, GSJ_MAGIC, type GsjProject, type GsjImage, type GsjHistoryPack } from './gsjTypes'
import { encrypt } from './gsjCrypto'

// ── 内部工具 ──────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Blob to base64 failed'))
    reader.readAsDataURL(blob)
  })
}

function extractCursor(packJson: string): number {
  try { return (JSON.parse(packJson) as { cursor: number }).cursor ?? 0 } catch { return 0 }
}

async function toGsjImage(item: ImageDBItem): Promise<GsjImage> {
  const srcBase64 = item.src || await blobToBase64(item.blob)

  let history: GsjHistoryPack | undefined
  try {
    const packJson = await imageDB.loadHistoryPack(item.id)
    if (packJson) history = { cursorPos: extractCursor(packJson), packJson }
  } catch { /* 历史读取失败不阻断导出 */ }

  return {
    id: item.id,
    name: item.name,
    srcBase64,
    adjustmentsJson: item.adjustmentsJson,
    cropStateJson: item.cropStateJson,
    filterConfigJson: item.filterConfigJson,
    personalizeLayersJson: item.personalizeLayersJson,
    uploadTime: new Date(item.uploadTime).getTime(),
    lastModified: new Date(item.lastModified).getTime(),
    fileHash: item.fileHash,
    albumId: item.albumId,
    isFavorite: item.isFavorite,
    favoritedAt: item.favoritedAt,
    isDeleted: item.isDeleted,
    deletedAt: item.deletedAt,
    tags: item.tags,
    sortOrder: item.sortOrder,
    history,
  }
}

// ── 公开 API ──────────────────────────────────────────────────

export async function buildGsjProject(projectName = '未命名工程'): Promise<GsjProject> {
  const [dbImages, dbAlbums] = await Promise.all([
    imageDB.getAllImages(),
    imageDB.getAllAlbums(),
  ])
  const images = await Promise.all(dbImages.map(toGsjImage))
  const now = Date.now()
  return {
    meta: { magic: GSJ_MAGIC, version: GSJ_VERSION, createdAt: now, modifiedAt: now, projectName },
    albums: dbAlbums.map(a => ({ id: a.id, name: a.name, createdAt: a.createdAt, sortOrder: a.sortOrder, coverImageId: a.coverImageId })),
    images,
  }
}

/**
 * 导出 .gsj 文件（JSON → 两轮加密 → 二进制下载）
 */
export async function exportGsjFile(projectName = '未命名工程'): Promise<void> {
  const project = await buildGsjProject(projectName)
  const json = JSON.stringify(project)

  // 两轮加密
  const encrypted = await encrypt(json)

  const blob = new Blob([encrypted.buffer as ArrayBuffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.gsj`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
