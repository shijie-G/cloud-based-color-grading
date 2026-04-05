/**
 * .gsj 工程文件导入器
 * 读取 .gsj 文件 → 解析 GsjProject → 还原到 IndexedDB
 *
 * 还原策略：
 *   - 相册：按 id 覆盖写入（已存在则更新，不存在则创建）
 *   - 图片：按 id 覆盖写入（保留原图 blob，重建 editedSrc / 调色 / 历史等）
 *   - 历史：整包写回 history store
 */

import { imageDB, type ImageDBItem } from '../../views/workstation/utils/imageDB'
import type { AlbumRecord } from '../../views/workstation/utils/imageDB'
import { GSJ_MAGIC, type GsjProject, type GsjImage } from './gsjTypes'

// ── 内部工具 ──────────────────────────────────────────────────

/** base64 dataUrl → Blob */
function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** 将 GsjImage 还原为 ImageDBItem */
function toImageDBItem(img: GsjImage): ImageDBItem {
  const blob = base64ToBlob(img.srcBase64)
  return {
    id: img.id,
    name: img.name,
    blob,
    src: img.srcBase64,
    editedSrc: img.editedSrcBase64,
    cropStateJson: img.cropStateJson,
    adjustmentsJson: img.adjustmentsJson,
    filterConfigJson: img.filterConfigJson,
    personalizeLayersJson: img.personalizeLayersJson,
    thumbnail: img.thumbnail,
    uploadTime: new Date(img.uploadTime),
    lastModified: new Date(img.lastModified),
    fileHash: img.fileHash,
    albumId: img.albumId,
    isFavorite: img.isFavorite,
    favoritedAt: img.favoritedAt,
    isDeleted: img.isDeleted,
    deletedAt: img.deletedAt,
    tags: img.tags,
    sortOrder: img.sortOrder,
  }
}

/**
 * 将 GsjHistoryPack 重新序列化为 imageDB 期望的整包格式
 * （base + diffs + cursor）
 */
function reserializeHistoryPack(img: GsjImage): string | null {
  if (!img.history || img.history.snapshots.length === 0) return null

  const { snapshots, cursorPos } = img.history
  const base = snapshots[0]
  const diffs = snapshots.slice(1).map((snap, i) => {
    const prev = snapshots[i]
    const diff: Record<string, unknown> = {}
    for (const key of Object.keys(snap) as (keyof typeof snap)[]) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(snap[key])) {
        diff[key] = snap[key]
      }
    }
    return diff
  })

  return JSON.stringify({ base, diffs, cursor: cursorPos })
}

// ── 解析入口 ──────────────────────────────────────────────────

/**
 * 从 File 对象解析 .gsj 工程
 */
export async function parseGsjFile(file: File): Promise<GsjProject> {
  const text = await file.text()
  const project = JSON.parse(text) as GsjProject

  // 基本校验
  if (project?.meta?.magic !== GSJ_MAGIC) {
    throw new Error('无效的 .gsj 文件：magic 校验失败')
  }

  return project
}

/**
 * 版本兼容检查（预留，当前仅打 warn）
 */
function checkVersion(version: string): void {
  if (version !== '1.0.0') {
    console.warn(`[GSJ] 文件版本 ${version} 与当前版本不同，可能存在兼容性问题`)
  }
}

// ── 还原入口 ──────────────────────────────────────────────────

export interface ImportResult {
  albumCount: number
  imageCount: number
  historyCount: number
  projectName: string
}

/**
 * 将解析后的 GsjProject 还原到 IndexedDB
 * @param project 已解析的工程对象
 * @param clearExisting 是否先清空现有数据（默认 false，按 id 覆盖）
 */
export async function restoreGsjProject(
  project: GsjProject,
  clearExisting = false,
): Promise<ImportResult> {
  checkVersion(project.meta.version)

  if (clearExisting) {
    await imageDB.clearAll()
  }

  // 1. 还原相册
  for (const album of project.albums) {
    const existing = await imageDB.getAlbumById(album.id)
    if (existing) {
      await imageDB.updateAlbum(album as AlbumRecord)
    } else {
      // 手动写入（保留原 id，不走 autoIncrement）
      await imageDB.updateAlbum(album as AlbumRecord)
    }
  }

  // 2. 还原图片 + 历史
  let historyCount = 0
  for (const gsjImg of project.images) {
    const dbItem = toImageDBItem(gsjImg)
    await imageDB.saveImage(dbItem)

    // 还原历史包
    const packJson = reserializeHistoryPack(gsjImg)
    if (packJson) {
      await imageDB.saveHistoryPack(gsjImg.id, packJson)
      historyCount++
    }
  }

  return {
    albumCount: project.albums.length,
    imageCount: project.images.length,
    historyCount,
    projectName: project.meta.projectName,
  }
}

/**
 * 一步完成：读取文件 → 解析 → 还原
 */
export async function importGsjFile(
  file: File,
  clearExisting = false,
): Promise<ImportResult> {
  const project = await parseGsjFile(file)
  return restoreGsjProject(project, clearExisting)
}

/**
 * 触发浏览器文件选择框，返回用户选择的 .gsj 文件
 */
export function pickGsjFile(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.gsj'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}
