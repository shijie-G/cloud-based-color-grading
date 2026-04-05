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

/**
 * 压缩历史包：把每个快照里的 imageSrc（完整 dataUrl）替换为轻量标记
 *   "__src__"    → 原图（与 srcBase64 相同）
 *   "__edited__" → 裁切/旋转后的图（与 editedSrc 相同）
 *   其他值       → 保留原样（兜底，理论上不会出现）
 *
 * 这是历史包体积最大的来源：一张 5MB 图片 30 步历史 = 最多 150MB
 */
function compressHistoryPackImageSrc(packJson: string, srcBase64: string, editedSrc?: string): string {
  try {
    const pack = JSON.parse(packJson) as {
      base: { imageSrc?: string; [k: string]: unknown }
      diffs: Array<{ imageSrc?: string; [k: string]: unknown }>
      cursor: number
    }

    const compress = (src: string | undefined): string | undefined => {
      if (!src) return src
      if (src === srcBase64) return '__src__'
      if (editedSrc && src === editedSrc) return '__edited__'
      // 其他 dataUrl（中间裁切步骤）：用 editedSrc 标记兜底，导入时用 editedSrc 还原
      // 这些中间步骤的图片在撤销/重做时会重新渲染，不需要精确还原
      if (src.startsWith('data:')) return '__edited__'
      return src
    }

    pack.base.imageSrc = compress(pack.base.imageSrc as string)
    pack.diffs = pack.diffs.map(d => {
      if ('imageSrc' in d) d.imageSrc = compress(d.imageSrc as string)
      return d
    })

    return JSON.stringify(pack)
  } catch {
    return packJson  // 解析失败原样返回
  }
}

async function toGsjImage(item: ImageDBItem): Promise<GsjImage> {
  const srcBase64 = item.src || await blobToBase64(item.blob)

  let history: GsjHistoryPack | undefined
  try {
    const packJson = await imageDB.loadHistoryPack(item.id)
    if (packJson) {
      // 压缩 imageSrc：把完整 dataUrl 替换为轻量标记，大幅减小文件体积
      const compressed = compressHistoryPackImageSrc(packJson, srcBase64, item.editedSrc)
      history = { cursorPos: extractCursor(compressed), packJson: compressed }
    }
  } catch { /* 历史读取失败不阻断导出 */ }

  return {
    id: item.id,
    name: item.name,
    srcBase64,
    thumbnail: item.thumbnail,          // 封面显示依赖，必须保存
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
