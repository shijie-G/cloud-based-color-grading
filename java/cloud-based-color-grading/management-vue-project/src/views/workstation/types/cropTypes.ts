/**
 * 裁切状态类型定义
 * 独立文件，与图片存储和调色模块解耦
 */

/** 单次裁切操作的参数（原图像素坐标） */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

/** 非破坏性裁切状态 */
export interface CropState {
  /** 累计旋转角度（0 / 90 / 180 / 270） */
  rotate: number
  /** 水平翻转 */
  flipH: boolean
  /** 垂直翻转 */
  flipV: boolean
  /** 裁切区域（相对旋转/翻转后的图片，原图像素坐标；null 表示未裁切） */
  rect: CropRect | null
}

export const DEFAULT_CROP_STATE: CropState = {
  rotate: 0,
  flipH: false,
  flipV: false,
  rect: null,
}
