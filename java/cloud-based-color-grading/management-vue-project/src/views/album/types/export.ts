/**
 * 图片导出相关类型定义
 */

export type ExportFormat = 'jpeg' | 'png' | 'webp'

export type BackgroundType = 'transparent' | 'white' | 'black'

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

export interface WatermarkConfig {
  enabled: boolean
  text: string
  scale: number // 水印缩放比例（0.5 - 3.0，1.0 为基准大小）
  color: string
  opacity: number
  bold: boolean
  position: WatermarkPosition
  // 自定义位置（百分比）
  customX?: number
  customY?: number
}

export interface ExportSettings {
  format: ExportFormat
  quality: number
  scale: number
  dpi: number
  background: BackgroundType
  watermark: WatermarkConfig
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'jpeg',
  quality: 90,
  scale: 1,
  dpi: 300,
  background: 'white',
  watermark: {
    enabled: false,
    text: '',
    scale: 1.0, // 默认 1.0 倍（基准大小）
    color: '#ffffff',
    opacity: 0.8,
    bold: false,
    position: 'bottom-right',
    customX: undefined,
    customY: undefined
  }
}
