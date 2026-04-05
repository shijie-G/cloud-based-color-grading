/**
 * .gsj 工程文件导入器
 * 读取二进制 .gsj → 两轮解密 → 解析 JSON → 还原到 IndexedDB
 *
 * editedSrc 重建策略：
 *   不存储 editedSrc，导入时从 srcBase64 + cropStateJson 重新渲染：
 *   原图 → rotate（旋转）→ flipH/flipV（翻转）→ rect（裁切）→ editedSrc
 *   与 WorkstationPage 的 handleCropRotate / handleCropFlip / handleCropCommit 逻辑完全一致
 */

import { imageDB, type ImageDBItem, type AlbumRecord } from '../../views/workstation/utils/imageDB'
import { GSJ_MAGIC, type GsjProject, type GsjImage } from './gsjTypes'
import type { CropState } from '../../views/workstation/types/cropTypes'
import { decrypt } from './gsjCrypto'
import { generateThumbnail } from '../../views/workstation/utils/imageUploadHelper'

// ── canvas 重建工具 ───────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/**
 * 用原图 + CropState 重建 editedSrc
 * 执行顺序与 WorkstationPage 完全一致：rotate → flipH/V → rect 裁切
 * 如果 cropState 是初始状态（无任何变换），返回 undefined（不需要 editedSrc）
 */
async function rebuildEditedSrc(srcBase64: string, cropState: CropState): Promise<string | undefined> {
  const { rotate, flipH, flipV, rect } = cropState

  // 初始状态：无任何变换，不需要 editedSrc
  if (rotate === 0 && !flipH && !flipV && !rect) return undefined

  const img = await loadImage(srcBase64)
  let current: HTMLCanvasElement

  // Step 1: 旋转（与 handleCropRotate 一致）
  if (rotate !== 0) {
    const rad = (rotate * Math.PI) / 180
    const sw = rotate === 90 || rotate === 270 ? img.naturalHeight : img.naturalWidth
    const sh = rotate === 90 || rotate === 270 ? img.naturalWidth  : img.naturalHeight
    const c = document.createElement('canvas')
    c.width = sw; c.height = sh
    const ctx = c.getContext('2d')!
    ctx.translate(sw / 2, sh / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    current = c
  } else {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    c.getContext('2d')!.drawImage(img, 0, 0)
    current = c
  }

  // Step 2: 翻转（与 handleCropFlip 一致）
  if (flipH || flipV) {
    const c = document.createElement('canvas')
    c.width = current.width; c.height = current.height
    const ctx = c.getContext('2d')!
    if (flipH) { ctx.translate(c.width, 0); ctx.scale(-1, 1) }
    if (flipV) { ctx.translate(0, c.height); ctx.scale(1, -1) }
    ctx.drawImage(current, 0, 0)
    current = c
  }

  // Step 3: 裁切（与 handleCropCommit 一致）
  if (rect) {
    const c = document.createElement('canvas')
    c.width = rect.w; c.height = rect.h
    c.getContext('2d')!.drawImage(current, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
    current = c
  }

  return current.toDataURL('image/png')
}

// ── 内部工具 ──────────────────────────────────────────────────

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/**
 * 还原历史包里的轻量标记为真实 dataUrl
 *   "__src__"    → srcBase64（原图）
 *   "__edited__" → editedSrc（裁切/旋转后），没有则降级到 srcBase64
 */
function restoreHistoryPackImageSrc(packJson: string, srcBase64: string, editedSrc?: string): string {
  try {
    const restore = (v: string | undefined): string | undefined => {
      if (v === '__src__') return srcBase64
      if (v === '__edited__') return editedSrc ?? srcBase64
      return v
    }
    const pack = JSON.parse(packJson) as {
      base: { imageSrc?: string; [k: string]: unknown }
      diffs: Array<{ imageSrc?: string; [k: string]: unknown }>
      cursor: number
    }
    if (pack.base.imageSrc) pack.base.imageSrc = restore(pack.base.imageSrc)
    pack.diffs = pack.diffs.map(d => {
      if ('imageSrc' in d) d.imageSrc = restore(d.imageSrc)
      return d
    })
    return JSON.stringify(pack)
  } catch {
    return packJson
  }
}

async function toImageDBItem(img: GsjImage): Promise<{ dbItem: ImageDBItem; restoredPackJson?: string }> {
  // 重建 editedSrc（如果有裁切/旋转/翻转）
  let editedSrc: string | undefined
  if (img.cropStateJson) {
    try {
      const cropState: CropState = JSON.parse(img.cropStateJson)
      editedSrc = await rebuildEditedSrc(img.srcBase64, cropState)
    } catch (e) {
      console.warn(`[GSJ] 重建 editedSrc 失败 (id=${img.id}):`, e)
    }
  }

  // thumbnail：优先用 gsj 里保存的，旧版 gsj 没有则从原图重建
  const thumbnail = img.thumbnail ?? await generateThumbnail(img.srcBase64)

  // 历史包：把轻量标记还原为真实 dataUrl
  let restoredPackJson: string | undefined
  if (img.history?.packJson) {
    restoredPackJson = restoreHistoryPackImageSrc(img.history.packJson, img.srcBase64, editedSrc)
  }

  return {
    dbItem: {
      id: img.id,
      name: img.name,
      blob: base64ToBlob(img.srcBase64),
      src: img.srcBase64,
      editedSrc,
      thumbnail,
      adjustmentsJson: img.adjustmentsJson,
      cropStateJson: img.cropStateJson,
      filterConfigJson: img.filterConfigJson,
      personalizeLayersJson: img.personalizeLayersJson,
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
    },
    restoredPackJson,
  }
}

// ── 解析入口 ──────────────────────────────────────────────────

export async function parseGsjFile(file: File): Promise<GsjProject> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  let json: string
  // magic bytes 0x47 0x53 0x4a = "GSJ" → 加密格式
  if (bytes[0] === 0x47 && bytes[1] === 0x53 && bytes[2] === 0x4a) {
    json = await decrypt(bytes)
  } else {
    // 兼容旧版明文 JSON
    json = new TextDecoder().decode(bytes)
  }

  const project = JSON.parse(json) as GsjProject
  if (project?.meta?.magic !== GSJ_MAGIC) {
    throw new Error('无效的 .gsj 文件：magic 校验失败')
  }
  return project
}

// ── 还原入口 ──────────────────────────────────────────────────

export interface ImportResult {
  albumCount: number
  imageCount: number
  historyCount: number
  projectName: string
}

export async function restoreGsjProject(project: GsjProject, clearExisting = false): Promise<ImportResult> {
  if (project.meta.version !== '1.1.0') {
    console.warn(`[GSJ] 文件版本 ${project.meta.version} 与当前版本不同，可能存在兼容性问题`)
  }

  if (clearExisting) await imageDB.clearAll()

  // 还原相册
  for (const album of project.albums) {
    await imageDB.updateAlbum(album as AlbumRecord)
  }

  // 还原图片（含 editedSrc 重建）+ 历史
  let historyCount = 0
  for (const gsjImg of project.images) {
    const { dbItem, restoredPackJson } = await toImageDBItem(gsjImg)
    await imageDB.saveImage(dbItem)

    if (restoredPackJson) {
      await imageDB.saveHistoryPack(gsjImg.id, restoredPackJson)
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

export async function importGsjFile(file: File, clearExisting = false): Promise<ImportResult> {
  const project = await parseGsjFile(file)
  return restoreGsjProject(project, clearExisting)
}

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
