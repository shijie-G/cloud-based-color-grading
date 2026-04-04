/**
 * 滤镜配置类型定义
 * 严格按照 PS 专业流程顺序执行
 */

/** 风格化类型 */
export type StyleType = 0 | 1 | 2 | 3 | 4 | 5
// 0: 关闭, 1: 复古, 2: 胶片, 3: 港风, 4: 青橙, 5: 冷调

/** 滤镜配置接口 */
export interface FilterConfig {
  /** 图片 ID */
  image_id?: string

  /** 模糊半径 (0~50, 0=关闭) */
  blur_radius: number

  /** 锐化强度 (0~3, 0=关闭) */
  sharpen_amount: number

  /** 锐化半径 (0.5~3) */
  sharpen_radius: number

  /** 风格化类型 */
  style_type: StyleType

  /** 风格化强度 (0~2) */
  style_strength: number

  /** 高光染色 (hex color) */
  style_highlight_color: string

  /** 阴影染色 (hex color) */
  style_shadow_color: string

  /** 风格混合强度 (0~1) */
  style_blend: number

  /** 颗粒强度 (0~100, 0=关闭) */
  grain_intensity: number

  /** 暗角强度 (-1~1, 0=关闭) */
  vignette_strength: number

  /** 暗角范围 (0~2) */
  vignette_size: number
}

/** 默认滤镜配置 */
export const defaultFilterConfig = (): FilterConfig => ({
  blur_radius: 0,
  sharpen_amount: 0,
  sharpen_radius: 1.0,
  style_type: 0,
  style_strength: 0,
  style_highlight_color: '#f8e9d6',
  style_shadow_color: '#2a3d55',
  style_blend: 0.3,
  grain_intensity: 0,
  vignette_strength: 0,
  vignette_size: 1.2
})

/** 预设滤镜配置 */
export const filterPresets: Record<string, Partial<FilterConfig>> = {
  // 1. 自然柔和（无颗粒）
  natural_soft: {
    blur_radius: 0,
    sharpen_amount: 0.2,
    sharpen_radius: 1.0,
    style_type: 0,
    style_strength: 0.3,
    style_highlight_color: '#fdfbf7',
    style_shadow_color: '#ebedee',
    style_blend: 0.15,
    grain_intensity: 0,
    vignette_strength: 0.05,
    vignette_size: 1.5
  },

  // 2. 温暖光晕（无颗粒）
  warm_glow: {
    blur_radius: 0,
    sharpen_amount: 0.15,
    sharpen_radius: 0.9,
    style_type: 1,
    style_strength: 0.5,
    style_highlight_color: '#fff5e6',
    style_shadow_color: '#ffe0b2',
    style_blend: 0.2,
    grain_intensity: 0,
    vignette_strength: 0.1,
    vignette_size: 1.4
  },

  // 3. 清凉微风（无颗粒）
  cool_breeze: {
    blur_radius: 0,
    sharpen_amount: 0.25,
    sharpen_radius: 1.0,
    style_type: 5,
    style_strength: 0.4,
    style_highlight_color: '#e3f2fd',
    style_shadow_color: '#bbdefb',
    style_blend: 0.2,
    grain_intensity: 0,
    vignette_strength: 0.08,
    vignette_size: 1.5
  },

  // 4. 柔光人像（无颗粒）
  soft_portrait: {
    blur_radius: 0.5,
    sharpen_amount: 0.1,
    sharpen_radius: 0.8,
    style_type: 1,
    style_strength: 0.4,
    style_highlight_color: '#fff3e0',
    style_shadow_color: '#ffccbc',
    style_blend: 0.15,
    grain_intensity: 0,
    vignette_strength: 0.05,
    vignette_size: 1.6
  },

  // 5. 清透日系
  fresh_japanese: {
    blur_radius: 0,
    sharpen_amount: 0.4,
    sharpen_radius: 1.0,
    style_type: 5,
    style_strength: 0.7,
    style_highlight_color: '#f0f5ff',
    style_shadow_color: '#adc4e6',
    style_blend: 0.4,
    grain_intensity: 5,
    vignette_strength: 0.15,
    vignette_size: 1.3
  },

  // 6. 复古胶片
  vintage_film: {
    blur_radius: 0,
    sharpen_amount: 0.2,
    sharpen_radius: 0.8,
    style_type: 2,
    style_strength: 1.1,
    style_highlight_color: '#fae0c8',
    style_shadow_color: '#3a4a5f',
    style_blend: 0.5,
    grain_intensity: 25,
    vignette_strength: 0.4,
    vignette_size: 1.1
  },

  // 7. 港风青橙
  hongkong_teal: {
    blur_radius: 0,
    sharpen_amount: 0.6,
    sharpen_radius: 1.2,
    style_type: 3,
    style_strength: 1.2,
    style_highlight_color: '#ffaa55',
    style_shadow_color: '#226699',
    style_blend: 0.6,
    grain_intensity: 12,
    vignette_strength: 0.35,
    vignette_size: 1.0
  },

  // 8. 温柔暖调
  soft_warm: {
    blur_radius: 0,
    sharpen_amount: 0.3,
    sharpen_radius: 1.0,
    style_type: 1,
    style_strength: 0.8,
    style_highlight_color: '#fff0d9',
    style_shadow_color: '#5a4a44',
    style_blend: 0.3,
    grain_intensity: 8,
    vignette_strength: 0.2,
    vignette_size: 1.4
  },

  // 9. 高级冷灰电影感
  cinematic_cool: {
    blur_radius: 0,
    sharpen_amount: 0.7,
    sharpen_radius: 1.1,
    style_type: 5,
    style_strength: 1.0,
    style_highlight_color: '#e6edf7',
    style_shadow_color: '#2d3748',
    style_blend: 0.7,
    grain_intensity: 18,
    vignette_strength: 0.3,
    vignette_size: 1.2
  },

  // 10. 黑白质感
  bw_texture: {
    blur_radius: 0,
    sharpen_amount: 0.8,
    sharpen_radius: 1.0,
    style_type: 0,
    style_strength: 1.0,
    style_highlight_color: '#ffffff',
    style_shadow_color: '#000000',
    style_blend: 0.0,
    grain_intensity: 20,
    vignette_strength: 0.45,
    vignette_size: 1.1
  },

  // 11. 清新奶油肌（人像柔光）
  creamy_portrait: {
    blur_radius: 1,
    sharpen_amount: 0.2,
    sharpen_radius: 0.7,
    style_type: 1,
    style_strength: 0.6,
    style_highlight_color: '#ffe8d6',
    style_shadow_color: '#6b7280',
    style_blend: 0.25,
    grain_intensity: 3,
    vignette_strength: 0.1,
    vignette_size: 1.5
  },

  // 12. 赛博朋克霓虹
  cyberpunk_neon: {
    blur_radius: 0,
    sharpen_amount: 0.9,
    sharpen_radius: 1.3,
    style_type: 4,
    style_strength: 1.4,
    style_highlight_color: '#ff2299',
    style_shadow_color: '#00ccff',
    style_blend: 0.8,
    grain_intensity: 10,
    vignette_strength: 0.25,
    vignette_size: 0.9
  },

  // 13. 风景自然高清
  landscape_hd: {
    blur_radius: 0,
    sharpen_amount: 1.0,
    sharpen_radius: 1.4,
    style_type: 0,
    style_strength: 1.0,
    style_highlight_color: '#f9fbf5',
    style_shadow_color: '#1e3a2a',
    style_blend: 0.2,
    grain_intensity: 0,
    vignette_strength: 0.05,
    vignette_size: 1.6
  },

  // 14. 复古柯达金
  kodak_gold: {
    blur_radius: 0,
    sharpen_amount: 0.3,
    sharpen_radius: 0.9,
    style_type: 2,
    style_strength: 1.2,
    style_highlight_color: '#ffddaa',
    style_shadow_color: '#2a3344',
    style_blend: 0.5,
    grain_intensity: 22,
    vignette_strength: 0.4,
    vignette_size: 1.0
  }
}
