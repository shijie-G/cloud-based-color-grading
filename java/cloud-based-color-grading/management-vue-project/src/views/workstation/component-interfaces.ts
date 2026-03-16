// 组件接口定义
// 为后续任务提供 TypeScript 接口参考

// 图片数据接口
export interface ImageItem {
  id: number
  name: string
  src: string
  originalFile: File
}

// 调整参数接口
export interface AdjustmentValues {
  brightness: number
  contrast: number
  saturation: number
  temperature: number
  exposure: number
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