/**
 * .gsj 工程文件格式类型定义
 *
 * 文件结构（JSON，UTF-8 编码）：
 * {
 *   meta:    工程元信息
 *   albums:  相册列表
 *   images:  图片列表（仅保存不可再生的原始数据）
 * }
 *
 * 有意省略的字段（可在导入后重新计算/生成）：
 *   - editedSrc    → 由原图 + cropStateJson 在导入时重新渲染（rotate → flipH/V → rect 裁切）
 *   - history 快照中的 imageSrc → 回放时直接使用原图
 *
 * 注意：thumbnail 必须保存，Gallery 封面显示强依赖此字段，无法在导入时实时重建
 */

// ── 当前格式版本 ──────────────────────────────────────────────
export const GSJ_VERSION = '1.1.0'
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

// ── 历史包（直接保存 IndexedDB 中的原始 packJson，base+diff 压缩格式） ──
export interface GsjHistoryPack {
  cursorPos: number   // 冗余存一份游标，方便快速读取
  packJson: string    // 原始 base+diff JSON，不展开
}

// ── 图片条目（仅保存不可再生的原始数据） ─────────────────────
export interface GsjImage {
  id: number
  name: string
  /** 原始图片 base64（含 MIME 前缀） — 唯一不可再生的大字段 */
  srcBase64: string
  /** 缩略图 base64（1280px 压缩，Gallery 封面显示依赖此字段） */
  thumbnail?: string
  /** 编辑参数 JSON（adjustments + hsl + mask） */
  adjustmentsJson?: string
  /** 裁切/旋转/翻转状态 JSON */
  cropStateJson?: string
  /** 滤镜配置 JSON */
  filterConfigJson?: string
  /** 个性化图层 JSON */
  personalizeLayersJson?: string
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
  // 历史记录（保留原始压缩包，不展开）
  history?: GsjHistoryPack
}

// ── 工程文件根结构 ────────────────────────────────────────────
export interface GsjProject {
  meta: GsjMeta
  albums: GsjAlbum[]
  images: GsjImage[]
}
