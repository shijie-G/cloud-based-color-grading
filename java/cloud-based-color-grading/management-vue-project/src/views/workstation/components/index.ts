// 组件导入和导出的基础配置
// 提供统一的组件导入入口

// 导入组件
import TopNavbar from './TopNavbar.vue'
import ImageDisplay from './ImageDisplay.vue'
import AdjustPanel from './AdjustPanel.vue'
import ImagePreview from './ImagePreview.vue'
import ImageGallery from './ImageGallery.vue'
import GalleryResizer from './GalleryResizer.vue'
import UploadSection from './UploadSection.vue'
import AdjustmentControls from './AdjustmentControls.vue'
import ActionButtons from './ActionButtons.vue'
import PanelResizer from './PanelResizer.vue'

// 主要组件导出
export { TopNavbar, ImageDisplay, AdjustPanel }

// 图片显示相关组件导出
export { ImagePreview, ImageGallery, GalleryResizer }

// 调整面板相关组件导出
export { UploadSection, AdjustmentControls, ActionButtons }

// 布局相关组件导出
export { PanelResizer }

// 组件分组导出，便于按功能导入
export const ImageComponents = {
  ImageDisplay,
  ImagePreview,
  ImageGallery,
  GalleryResizer
}

export const AdjustComponents = {
  AdjustPanel,
  UploadSection,
  AdjustmentControls,
  ActionButtons
}

export const LayoutComponents = {
  PanelResizer,
  GalleryResizer
}

// 所有组件的统一导出
export const AllComponents = {
  TopNavbar,
  ImageDisplay,
  ImagePreview,
  ImageGallery,
  GalleryResizer,
  PanelResizer,
  AdjustPanel,
  UploadSection,
  AdjustmentControls,
  ActionButtons
}