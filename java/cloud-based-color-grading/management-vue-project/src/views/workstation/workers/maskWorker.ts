/**
 * 蒙版 Web Worker（分片并行，双模式）
 *
 * 模式 A — adjOnly（纯调色）：
 *   接收原图分片 + 蒙版调色参数，输出调色后的像素
 *   处理顺序（PS 蒙版局部调整顺序）：
 *     曝光 → 对比度 → 高光 → 阴影 → 白色色阶 → 黑色色阶 → 清晰度 → 去朦胧 → 饱和度 → 色相
 *
 * 模式 B — lerp 合成：
 *   接收当前结果分片 + 蒙版调色后分片 + 蒙版 alpha 分片
 *   output[i] = lerp(current[i], layerAdjusted[i], mask[i] / 255)
 *   蒙版白(255) = 完全显示蒙版调色效果，黑(0) = 完全保留当前结果
 *
 * 两个模式分开，保证调色和合成职责单一，顺序明确。
 */
export {}

interface MaskAdjustments {
  exposure:   number  // -5.0 ~ +5.0 EV
  contrast:   number  // -100 ~ +100
  highlights: number  // -100 ~ +100
  shadows:    number  // -100 ~ +100
  whites:     number  // -100 ~ +100
  blacks:     number  // -100 ~ +100
  clarity:    number  // -100 ~ +100
  dehaze:     number  // -100 ~ +100
  saturation: number  // -100 ~ +100
  hue:        number  // -180 ~ +180
}

// ── 工具 ──────────────────────────────────────────────────
function clamp(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v }

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  return [
    Math.round(hue2rgb(h + 1/3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1/3) * 255),
  ]
}

/**
 * 模式 A：对单像素应用蒙版局部调色（PS 顺序）
 * 从原图像素出发，不包含全局调色，保证蒙版调色完全独立
 */
function applyMaskAdj(r: number, g: number, b: number, a: MaskAdjustments): [number, number, number] {
  // Step 1: 曝光（EV，2^EV 乘数，线性光近似）
  if (a.exposure !== 0) {
    const factor = Math.pow(2, a.exposure)
    r = clamp(r * factor)
    g = clamp(g * factor)
    b = clamp(b * factor)
  }

  // Step 2: 对比度（PS 公式，以 128 为中心）
  if (a.contrast !== 0) {
    const cVal = a.contrast * 2.55
    const cf = (259 * (cVal + 255)) / (255 * (259 - cVal))
    r = clamp(cf * (r - 128) + 128)
    g = clamp(cf * (g - 128) + 128)
    b = clamp(cf * (b - 128) + 128)
  }

  // Step 3 & 4: 高光 / 阴影（感知亮度分区，平方权重平滑过渡）
  if (a.highlights !== 0 || a.shadows !== 0) {
    const lumN = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const hlShift = (a.highlights / 100) * 50 * (lumN * lumN)
    const shShift = (a.shadows    / 100) * 50 * ((1 - lumN) * (1 - lumN))
    r = clamp(r + hlShift + shShift)
    g = clamp(g + hlShift + shShift)
    b = clamp(b + hlShift + shShift)
  }

  // Step 5: 白色色阶（最亮区域，lumN^3 权重）
  if (a.whites !== 0) {
    const lumN = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const shift = (a.whites / 100) * 40 * (lumN * lumN * lumN)
    r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift)
  }

  // Step 6: 黑色色阶（最暗区域，(1-lumN)^3 权重）
  if (a.blacks !== 0) {
    const lumN = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const shift = (a.blacks / 100) * 40 * ((1 - lumN) * (1 - lumN) * (1 - lumN))
    r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift)
  }

  // Step 7: 清晰度（中间调对比度，S 曲线近似）
  if (a.clarity !== 0) {
    const cf = 1 + a.clarity / 200
    r = clamp((r - 128) * cf + 128)
    g = clamp((g - 128) * cf + 128)
    b = clamp((b - 128) * cf + 128)
  }

  // Step 8: 去朦胧（对比度 + 饱和度联动，模拟 Lightroom dehaze）
  if (a.dehaze !== 0) {
    const s = a.dehaze / 100
    const cf = 1 + s * 0.5
    r = clamp((r - 128) * cf + 128)
    g = clamp((g - 128) * cf + 128)
    b = clamp((b - 128) * cf + 128)
    const [h, sat, l] = rgbToHsl(r, g, b)
    const ns = Math.max(0, Math.min(1, sat + s * 0.3))
    ;[r, g, b] = hslToRgb(h, ns, l)
  }

  // Step 9 & 10: 饱和度 / 色相（转 HSL）
  if (a.saturation !== 0 || a.hue !== 0) {
    let [h, s, l] = rgbToHsl(r, g, b)
    if (a.hue !== 0) h = h + a.hue
    if (a.saturation !== 0) s = Math.max(0, Math.min(1, s + a.saturation / 100))
    ;[r, g, b] = hslToRgb(h, s, l)
  }

  return [r, g, b]
}

// ── 主逻辑 ────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const data = e.data as
    | { adjOnly: ArrayBuffer; maskAdj: MaskAdjustments }
    | { original: ArrayBuffer; adjusted: ArrayBuffer; mask: ArrayBuffer }

  // 模式 A：纯调色（从原图出发，输出蒙版调色后的像素）
  if ('adjOnly' in data) {
    const src = new Uint8ClampedArray(data.adjOnly)
    const out = new Uint8ClampedArray(src.length)
    const adj = data.maskAdj

    for (let i = 0; i < src.length; i += 4) {
      let [r, g, b] = applyMaskAdj(src[i], src[i+1], src[i+2], adj)
      out[i] = r; out[i+1] = g; out[i+2] = b; out[i+3] = src[i+3]
    }

    self.postMessage({ buffer: out.buffer }, { transfer: [out.buffer] })
    return
  }

  // 模式 B：lerp 合成（current + layerAdjusted + mask alpha）
  const cur = new Uint8ClampedArray(data.original)
  const adj = new Uint8ClampedArray(data.adjusted)
  const msk = new Uint8ClampedArray(data.mask)
  const out = new Uint8ClampedArray(cur.length)

  for (let i = 0; i < cur.length; i += 4) {
    const alpha = msk[i] / 255
    const inv   = 1 - alpha
    out[i]   = cur[i]   * inv + adj[i]   * alpha
    out[i+1] = cur[i+1] * inv + adj[i+1] * alpha
    out[i+2] = cur[i+2] * inv + adj[i+2] * alpha
    out[i+3] = cur[i+3]
  }

  self.postMessage({ buffer: out.buffer }, { transfer: [out.buffer] })
}
