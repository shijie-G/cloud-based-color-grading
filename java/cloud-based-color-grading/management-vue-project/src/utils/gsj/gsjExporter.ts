/**
 * .gsj 工程文件导出器
 * 从 IndexedDB 读取全部数据 → 序列化为 GsjProject → 下载为 .gsj 文件
 */

import { imageDB } from '../../views/workstation/utils/imageDB'
import type { ImageDBItem } from '../../views/workstation/utils/imageDB'
import type { HistorySnapshot } from '../../views/workstation/composables/useHistoryState'
import {
  GSJ_VERSION,
  GSJ_MAGIC,
  type GsjProject,
  type GsjImage,
  type GsjHistoryPack,
  type GsjHistorySnapshot,
} from './gsjTypes'

// ── 内部工具 ──────────────────────────────────────────────────

/** Blob → base64 dataUrl */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Blob to base64 failed'))
    reader.readAsDataURL(blob)
  })
}

/** 解析 history 整包 JSON → GsjHistoryPack（保持类型一致） */
function parseHistoryPack(packJson: string): GsjHistoryPack | undefined {
  try {
    const raw = JSON.parse(packJson) as {
      base: HistorySnapshot
      diffs: Partial<HistorySnapshot>[]
      cursor: number
    }

    // 重放 diffs → 完整快照数组
    const snapshots: GsjHistorySnapshot[] = [raw.base as GsjHistorySnapshot]
    for (const diff of raw.diffs) {
      snapshots.push({
        ...(snapshots[snapshots.length - 1]),
        ...diff,
      } as GsjHistorySnapshot)
    }

    return { cursorPos: raw.cursor, snapshots }
  } catch {
    return undefined
  }
}

/** ImageDBItem → GsjImage */
async function toGsjImage(item: ImageDBItem): Promise<GsjImage> {
  const srcBase64 = item.src || await blobToBase64(item.blob)

  // 读取历史包
  let history: GsjHistoryPack | undefined
  try {
    const packJson = await imageDB.loadHistoryPack(item.id)
    if (packJson) history = parseHistoryPack(packJson)
  } catch {
    // 历史记录读取失败不阻断导出
  }

  return {
    id: item.id,
    name: item.name,
    srcBase64,
    editedSrcBase64: item.editedSrc || undefined,
    cropStateJson: item.cropStateJson,
    adjustmentsJson: item.adjustmentsJson,
    filterConfigJson: item.filterConfigJson,
    personalizeLayersJson: item.personalizeLayersJson,
    thumbnail: item.thumbnail,
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

/**
 * 从 IndexedDB 收集全部数据，构建 GsjProject
 */
export async function buildGsjProject(projectName = '未命名工程'): Promise<GsjProject> {
  const [dbImages, dbAlbums] = await Promise.all([
    imageDB.getAllImages(),
    imageDB.getAllAlbums(),
  ])

  const images = await Promise.all(dbImages.map(toGsjImage))

  const now = Date.now()
  return {
    meta: {
      magic: GSJ_MAGIC,
      version: GSJ_VERSION,
      createdAt: now,
      modifiedAt: now,
      projectName,
    },
    albums: dbAlbums.map(a => ({
      id: a.id,
      name: a.name,
      createdAt: a.createdAt,
      sortOrder: a.sortOrder,
      coverImageId: a.coverImageId,
    })),
    images,
  }
}

/**
 * 将 GsjProject 序列化为 JSON 字符串
 * 可选压缩（去除空格）
 */
export function serializeGsjProject(project: GsjProject, pretty = false): string {
  return pretty
    ? JSON.stringify(project, null, 2)
    : JSON.stringify(project)
}

/**
 * 触发浏览器下载 .gsj 文件
 * @param projectName 工程名（同时作为文件名）
 */
export async function exportGsjFile(projectName = '未命名工程'): Promise<void> {
  const project = await buildGsjProject(projectName)
  const json = serializeGsjProject(project)

  const blob = new Blob([json], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.gsj`
  a.click()

  // 延迟释放，确保下载触发
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
