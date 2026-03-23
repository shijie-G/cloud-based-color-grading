/**
 * 基础调色 Web Worker（像素级，支持分片并行）
 * 处理顺序（与 PS/Lightroom 一致）：
 *   色温 → 亮度 → 对比度 → 清晰度（局部对比度近似）→ 饱和度 → 自然饱和度 → 色相旋转
 *
 * 接收一个像素分片 buffer，处理后返回
 */
export {}

interface BasicAdjustments {
  brightness:  number  // -150 ~ +150
  contrast:    number  // -100 ~ +100
  saturation:  number  // -100 ~ +100
  vibrance:    number  // -100 ~ +100
  hue:         number  // -180 ~ +180 (deg)
  temperature: number  // -100(冷) ~ +100(暖)
  clarity:     number  // -100 ~ +100
}

// ── 工具函数 ──────────────────────────────────────────────

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

/** RGB → HSL，返回 [h(0~360), s(0~1), l(0~1)] */
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

/** HSL → RGB */
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

// ── 主处理逻辑 ────────────────────────────────────────────

self.onmessage = (e: MessageEvent) => {
  const { buffer, adj } = e.data as { buffer: ArrayBuffer; adj: BasicAdjustments }

  const src = new Uint8ClampedArray(buffer)
  const out = new Uint8ClampedArray(src.length)

  // 预计算各参数的乘数/偏移，避免循环内重复计算
  // 1. 色温：暖色偏移 R+/B-，冷色偏移 R-/B+
  const tempShift = adj.temperature * 0.8  // 每单位偏移量

  // 2. 亮度：-150~+150 → 像素偏移 -150~+150（直接加到 RGB）
  const brightShift = adj.brightness

  // 3. 对比度：-100~+100 → 乘数，以 128 为中心
  //    factor = (259 * (contrast + 255)) / (255 * (259 - contrast))  PS 公式
  const cVal = adj.contrast * 2.55  // 映射到 -255~+255
  const contrastFactor = (259 * (cVal + 255)) / (255 * (259 - cVal))

  // 4. 清晰度：用轻微 S 曲线模拟局部对比度（简化版）
  //    clarity > 0：增强中间调对比，clarity < 0：柔化
  const clarityFactor = 1 + adj.clarity / 200

  // 5. 饱和度：-100~+100 → HSL s 偏移
  const satDelta = adj.saturation / 100

  // 6. 自然饱和度：对已饱和颜色影响更小（保护肤色）
  const vibranceDelta = adj.vibrance / 100

  // 7. 色相旋转（度）
  const hueDeg = adj.hue

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i], g = src[i+1], b = src[i+2]
    const a = src[i+3]

    // Step 1: 色温（先调，影响后续所有感知）
    if (adj.temperature !== 0) {
      r = clamp(r + tempShift)
      b = clamp(b - tempShift)
    }

    // Step 2: 亮度
    if (adj.brightness !== 0) {
      r = clamp(r + brightShift)
      g = clamp(g + brightShift)
      b = clamp(b + brightShift)
    }

    // Step 3: 对比度（PS 公式，以 128 为中心）
    if (adj.contrast !== 0) {
      r = clamp(contrastFactor * (r - 128) + 128)
      g = clamp(contrastFactor * (g - 128) + 128)
      b = clamp(contrastFactor * (b - 128) + 128)
    }

    // Step 4: 清晰度（中间调对比度增强，简化为 S 曲线）
    if (adj.clarity !== 0) {
      r = clamp((r - 128) * clarityFactor + 128)
      g = clamp((g - 128) * clarityFactor + 128)
      b = clamp((b - 128) * clarityFactor + 128)
    }

    // Step 5 & 6 & 7: 饱和度 / 自然饱和度 / 色相 → 转 HSL 处理
    if (adj.saturation !== 0 || adj.vibrance !== 0 || adj.hue !== 0) {
      let [h, s, l] = rgbToHsl(r, g, b)

      // 色相旋转
      if (hueDeg !== 0) h = h + hueDeg

      // 饱和度
      if (satDelta !== 0) s = Math.max(0, Math.min(1, s + satDelta))

      // 自然饱和度：已饱和的颜色受影响更小（1-s 权重）
      if (vibranceDelta !== 0) {
        const vibranceEffect = vibranceDelta * (1 - s)
        s = Math.max(0, Math.min(1, s + vibranceEffect))
      }

      ;[r, g, b] = hslToRgb(h, s, l)
    }

    out[i] = r; out[i+1] = g; out[i+2] = b; out[i+3] = a
  }

  self.postMessage({ buffer: out.buffer }, { transfer: [out.buffer] })
}
