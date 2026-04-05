/**
 * .gsj 工程文件格式类型定义
 * GSJ = GaoSaoJi（高考志愿系统专属工程格式）
 *
 * 文件结构（JSON，UTF-8 编码）：
 * {
 *   meta:    工程元信息
 *   albums:  相册列表
 *   images:  图片列表（含所有编辑数据）
 * }
 */

import type { AdjustmentValues } from '../../views/workstation/component-interfaces'
import type { HSLAdjustments } from '../../views/workstation/composables/useHSLProcessor'
import type { CropState } from '../../views/workstation/types/cropTypes'
import type { SerializedMaskLayer } from '../../views/workstation/composables/useHistoryState'

// ── 当前格式版本 ──────────────────────────────────────────────
export const GSJ_VERSION = '1.0.0'
export const GSJ_MAGIC = 'GSJ'

// ── 元信息 ────────────────────────────────────────────────────
export interface GsjMeta {
  magic: typeof GSJ_MAGIC
  version: string
  createdAt: number    // Unix ms
  modifiedAt: number   // Unix ms
  projectName: string
}

// ── 相册 ──────────────────────────────────────────────────────
export interface GsjAlbum {
  id: number
  name: string
  createdAt: number
  sortOrder: number
  coverImageId?: number
}

// ── 历史快照（单步） ──────────────────────────────────────────
export interface GsjHistorySnapshot {
  adjustments: AdjustmentValues
  hslAdjustments: HSLAdjustments
  maskLayers: SerializedMaskLayer[]
  cropState: CropState
  imageSrc: string     // 该步骤对应的图片 dataUrl（可能是原图或编辑后）
}

// ── 历史包 ────────────────────────────────────────────────────
export interface GsjHistoryPack {
  cursorPos: number
  snapshots: GsjHistorySnapshot[]
}

// ── 图片条目（images 表完整数据） ─────────────────────────────
export interface GsjImage {
  id: number
  name: string
  /** 原始图片 base64（含 MIME 前缀，如 data:image/jpeg;base64,...） */
  srcBase64: string
  /** 裁切/编辑后的图片 base64（可选） */
  editedSrcBase64?: string
  cropStateJson?: string
  adjustmentsJson?: string
  filterConfigJson?: string
  personalizeLayersJson?: string
  thumbnail?: string
  uploadTime: number   // Unix ms
  lastModified: number // Unix ms
  fileHash?: string
  // Gallery 扩展
  albumId?: number
  isFavorite?: boolean
  favoritedAt?: number
  isDeleted?: boolean
  deletedAt?: number
  tags?: string[]
  sortOrder?: number
  // 历史记录（整包）
  history?: GsjHistoryPack
}

// ── 工程文件根结构 ────────────────────────────────────────────
export interface GsjProject {
  meta: GsjMeta
  albums: GsjAlbum[]
  images: GsjImage[]
}
