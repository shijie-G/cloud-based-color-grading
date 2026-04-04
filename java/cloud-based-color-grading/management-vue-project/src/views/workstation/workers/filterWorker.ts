/**
 * 滤镜处理 Worker
 * 严格按照 PS 专业流程顺序执行：
 * 1. 全局模糊 → 2. 全局锐化 → 3. 风格化染色 → 4. 噪点颗粒 → 5. 暗角效果 → 6. 像素裁剪
 */

import type { FilterConfig } from '../types/filterTypes'

interface FilterMessage {
  buffer: ArrayBuffer
  config: FilterConfig
  width: number
  height: number
}

self.onmessage = (e: MessageEvent<FilterMessage>) => {
  const { buffer, config, width, height } = e.data
  const data = new Uint8ClampedArray(buffer)

  // 执行滤镜处理链
  processFilter(data, config, width, height)

  self.postMessage({ buffer: data.buffer }, { transfer: [data.buffer] })
}

/** 主处理函数 */
function processFilter(data: Uint8ClampedArray, config: FilterConfig, width: number, height: number) {

  // Step 1: 全局模糊
  if (config.blur_radius > 0) {
    applyGaussianBlur(data, width, height, config.blur_radius)
  }

  // Step 2: 全局锐化
  if (config.sharpen_amount > 0) {
    applyUSMSharpen(data, width, height, config.sharpen_amount, config.sharpen_radius)
  }

  // Step 3: 风格化染色
  if (config.style_type > 0) {
    applyStyleFilter(data, config)
  }

  // Step 4: 噪点颗粒
  if (config.grain_intensity > 0) {
    applyGrain(data, config.grain_intensity)
  }

  // Step 5: 暗角效果
  if (config.vignette_strength !== 0) {
    applyVignette(data, width, height, config.vignette_strength, config.vignette_size)
  }

  // Step 6: 最终像素裁剪
  clampPixels(data)
}

/** Step 1: 高斯模糊（优化版：Box Blur 近似） */
function applyGaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  if (radius < 1) return

  const r = Math.floor(radius)
  const temp = new Uint8ClampedArray(data)

  // 水平方向模糊
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0

      const xStart = Math.max(0, x - r)
      const xEnd = Math.min(width - 1, x + r)

      for (let nx = xStart; nx <= xEnd; nx++) {
        const idx = (y * width + nx) * 4
        rSum += temp[idx]
        gSum += temp[idx + 1]
        bSum += temp[idx + 2]
        count++
      }

      const idx = (y * width + x) * 4
      data[idx] = rSum / count
      data[idx + 1] = gSum / count
      data[idx + 2] = bSum / count
    }
  }

  // 垂直方向模糊
  temp.set(data)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0

      const yStart = Math.max(0, y - r)
      const yEnd = Math.min(height - 1, y + r)

      for (let ny = yStart; ny <= yEnd; ny++) {
        const idx = (ny * width + x) * 4
        rSum += temp[idx]
        gSum += temp[idx + 1]
        bSum += temp[idx + 2]
        count++
      }

      const idx = (y * width + x) * 4
      data[idx] = rSum / count
      data[idx + 1] = gSum / count
      data[idx + 2] = bSum / count
    }
  }
}

/** Step 2: USM 锐化（优化版：简化卷积核） */
function applyUSMSharpen(data: Uint8ClampedArray, width: number, height: number, amount: number, radius: number) {
  if (amount <= 0) return

  const temp = new Uint8ClampedArray(data)

  // 简化的锐化卷积核（3x3）
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const k = kernel[(ky + 1) * 3 + (kx + 1)]
          r += temp[idx] * k
          g += temp[idx + 1] * k
          b += temp[idx + 2] * k
        }
      }

      const idx = (y * width + x) * 4
      const originalR = temp[idx]
      const originalG = temp[idx + 1]
      const originalB = temp[idx + 2]

      // 混合原图和锐化结果
      data[idx] = originalR + (r - originalR) * amount * 0.2
      data[idx + 1] = originalG + (g - originalG) * amount * 0.2
      data[idx + 2] = originalB + (b - originalB) * amount * 0.2
    }
  }
}

/** Step 3: 风格化染色 */
function applyStyleFilter(data: Uint8ClampedArray, config: FilterConfig) {
  const { style_type, style_strength, style_highlight_color, style_shadow_color, style_blend } = config

  const highlightRGB = hexToRgb(style_highlight_color)
  const shadowRGB = hexToRgb(style_shadow_color)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // 计算亮度
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    const lumaRatio = luma / 255

    let newR = r, newG = g, newB = b

    switch (style_type) {
      case 1: // 复古
        newR = r * 0.9 + highlightRGB.r * lumaRatio * style_blend + shadowRGB.r * (1 - lumaRatio) * style_blend
        newG = g * 0.9 + highlightRGB.g * lumaRatio * style_blend + shadowRGB.g * (1 - lumaRatio) * style_blend
        newB = b * 0.9 + highlightRGB.b * lumaRatio * style_blend + shadowRGB.b * (1 - lumaRatio) * style_blend
        // 降低对比度
        newR = newR * 0.85 + 128 * 0.15
        newG = newG * 0.85 + 128 * 0.15
        newB = newB * 0.85 + 128 * 0.15
        break

      case 2: // 胶片
        // 褪色 + 降饱和
        const avg = (r + g + b) / 3
        newR = r * 0.7 + avg * 0.3 + highlightRGB.r * lumaRatio * style_blend * 0.5
        newG = g * 0.7 + avg * 0.3 + highlightRGB.g * lumaRatio * style_blend * 0.5
        newB = b * 0.7 + avg * 0.3 + shadowRGB.b * (1 - lumaRatio) * style_blend * 0.5
        // 提中间调亮度
        if (luma > 64 && luma < 192) {
          newR += 10
          newG += 10
          newB += 10
        }
        break

      case 3: // 港风
      case 4: // 青橙
        // 红色偏橙，青蓝偏青
        if (r > g && r > b) {
          newR = r * 1.1
          newG = g * 1.05
        }
        if (b > r && b > g) {
          newB = b * 1.1
          newG = g * 0.95
        }
        // 提高对比度
        newR = (newR - 128) * 1.2 + 128
        newG = (newG - 128) * 1.2 + 128
        newB = (newB - 128) * 1.2 + 128
        break

      case 5: // 冷调
        newR = r * 0.9 + shadowRGB.r * style_blend * 0.3
        newG = g * 0.95 + shadowRGB.g * style_blend * 0.3
        newB = b * 1.1 + shadowRGB.b * style_blend * 0.3
        break
    }

    // 应用强度
    data[i] = r + (newR - r) * style_strength
    data[i + 1] = g + (newG - g) * style_strength
    data[i + 2] = b + (newB - b) * style_strength
    // A 通道保持不变
  }
}

/** Step 4: 噪点颗粒 */
function applyGrain(data: Uint8ClampedArray, intensity: number) {
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 2 * intensity
    data[i] += noise
    data[i + 1] += noise
    data[i + 2] += noise
    // A 通道保持不变
  }
}

/** Step 5: 暗角效果 */
function applyVignette(data: Uint8ClampedArray, width: number, height: number, strength: number, size: number) {
  const cx = width / 2
  const cy = height / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / maxDist

      // 暗角系数
      const factor = 1 - Math.pow(ratio / size, 2) * Math.abs(strength)
      const finalFactor = strength > 0 ? factor : 1 + (1 - factor)

      const idx = (y * width + x) * 4
      data[idx] *= finalFactor
      data[idx + 1] *= finalFactor
      data[idx + 2] *= finalFactor
      // A 通道保持不变
    }
  }
}

/** Step 6: 像素裁剪 */
function clampPixels(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.max(0, Math.min(255, data[i]))
  }
}

/** 辅助函数：hex 转 RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}
