// 个性化模块类型定义

/**
 * 图层类型
 */
export type LayerType = 'image' | 'text' | 'shape'

/**
 * 图层运行时数据（内存中使用，像素坐标）
 * 仅用于渲染和交互，不直接存储
 */
export interface Layer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  opacity: number
  x: number          // 像素坐标（相对于图片左上角）
  y: number          // 像素坐标（相对于图片左上角）
  width: number      // 像素宽度
  height: number     // 像素高度
  rotation: number
  zIndex: number
  imageUrl?: string
  imageBlob?: Blob
  // 文字图层特有属性
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  // 形状图层特有属性
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow' | 'pentagon' | 'hexagon'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
}

/**
 * 图层存储数据（IndexedDB 持久化，百分比坐标）
 * 所有坐标和尺寸都是相对于图片的百分比（0-100）
 * 定位原点：图片左上角 (0, 0)
 */
export interface LayerStorageData {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  opacity: number

  // 核心百分比数据（相对于图片尺寸）
  xPercent: number      // X 坐标百分比，0 = 图片左边缘，100 = 图片右边缘
  yPercent: number      // Y 坐标百分比，0 = 图片上边缘，100 = 图片下边缘
  widthPercent: number  // 宽度百分比（相对于图片宽度）
  heightPercent: number // 高度百分比（相对于图片高度）

  rotation: number
  zIndex: number
  imageUrl?: string

  // 文字图层特有属性
  text?: string
  fontSizePercent?: number  // 字体大小百分比（相对于图片高度）
  fontFamily?: string
  color?: string

  // 形状图层特有属性
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow' | 'pentagon' | 'hexagon'
  fillColor?: string
  strokeColor?: string
  strokeWidthPercent?: number  // 边框宽度百分比（相对于图片宽度）
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
