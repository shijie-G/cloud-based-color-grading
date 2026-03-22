/**
 * HSL 颜色范围类型定义
 * 按颜色范围（红/橙/黄/绿/青/蓝/紫）单独调整 H/S/L
 */

export interface HSLRange {
  hue: number        // 色相偏移 -180 ~ +180
  saturation: number // 饱和度偏移 -100 ~ +100
  lightness: number  // 明度偏移 -100 ~ +100
}

export interface HSLAdjustments {
  red:    HSLRange
  orange: HSLRange
  yellow: HSLRange
  green:  HSLRange
  cyan:   HSLRange
  blue:   HSLRange
  purple: HSLRange
}

export const defaultHSLRange = (): HSLRange => ({ hue: 0, saturation: 0, lightness: 0 })

export const defaultHSLAdjustments = (): HSLAdjustments => ({
  red:    defaultHSLRange(),
  orange: defaultHSLRange(),
  yellow: defaultHSLRange(),
  green:  defaultHSLRange(),
  cyan:   defaultHSLRange(),
  blue:   defaultHSLRange(),
  purple: defaultHSLRange(),
})
