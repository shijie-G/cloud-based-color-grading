// 组件接口定义
// 为后续任务提供 TypeScript 接口参考

// 图片数据接口
export interface ImageItem {
  id: number
  name: string
  src: string
  thumbnail?: string // 压缩缩略图（用于全览区显示）
  originalFile: File
  fileHash?: string // 文件唯一标识：名称+大小+格式
}

// 调整参数接口（PS 风格，默认值均为 0，除 temperature/tint 外）
export interface AdjustmentValues {
  // 基础
  exposure: number      // 曝光度  -5 ~ +5 EV，默认 0
  brightness: number    // 亮度    -150 ~ +150，默认 0
  contrast: number      // 对比度  -50 ~ +100，默认 0
  // 色彩
  saturation: number    // 饱和度  -100 ~ +100，默认 0
  vibrance: number      // 自然饱和度 -100 ~ +100，默认 0
  hue: number           // 色相    -180 ~ +180，默认 0
  temperature: number   // 色温    -100(冷) ~ +100(暖)，默认 0
  // 细节
  clarity: number       // 清晰度  -100 ~ +100，默认 0
}

// 布局状态接口
export interface LayoutState {
  leftPanelWidth: number
  rightPanelWidth: number
  isResizing: boolean
  galleryHeight: number
  isGalleryResizing: boolean
  maxGalleryHeight: number
}

// 组件 Props 接口定义

export interface ImagePreviewProps {
  imageSrc: string
  imageFilter: string
  showUploadTips: boolean
}

export interface ImageGalleryProps {
  images: ImageItem[]
  selectedImageId: number | null
  galleryHeight: number
}

export interface AdjustmentControlsProps {
  adjustments: AdjustmentValues
}

export interface UploadSectionProps {
  acceptedFormats?: string
  maxFileSize?: number
}

export interface ActionButtonsProps {
  canSave: boolean
  canReset: boolean
}

export interface PanelResizerProps {
  minWidth?: number
  maxWidth?: number
  currentWidth: number
}

export interface GalleryResizerProps {
  minHeight?: number
  maxHeight?: number
  currentHeight: number
}

// 事件接口定义

export interface ImageGalleryEvents {
  'action:selectImage': [image: ImageItem]
  'layout:resetLayout': []
}

export interface AdjustmentControlsEvents {
  'update:adjustments': [adjustments: AdjustmentValues]
}

export interface UploadSectionEvents {
  'action:uploadImage': [file: File]
}

export interface ActionButtonsEvents {
  'action:save': []
  'action:reset': []
}

export interface PanelResizerEvents {
  'layout:updatePanelWidth': [width: number]
}

export interface GalleryResizerEvents {
  'layout:updateGalleryHeight': [height: number]
}