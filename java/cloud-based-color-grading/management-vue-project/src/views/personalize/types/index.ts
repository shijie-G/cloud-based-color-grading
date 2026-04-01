// 个性化模块类型定义

/**
 * 图层类型
 */
export type LayerType = 'image' | 'text' | 'shape'

/**
 * 图层数据
 */
export interface Layer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  opacity: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  // 图片图层特有属性
  imageUrl?: string
  imageBlob?: Blob
  // 文字图层特有属性
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  // 形状图层特有属性
  shapeType?: 'rectangle' | 'circle' | 'triangle'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
}

/**
 * 素材项
 */
export interface StickerItem {
  id: string
  name: string
  category: string
  thumbnailUrl: string
  imageUrl: string
  width: number
  height: number
  tags: string[]
}

/**
 * 素材分类
 */
export type StickerCategory = 'all' | 'text' | 'decoration' | 'border' | 'icon' | 'custom'
