/**
 * HSL 像素处理 Web Worker（支持分片并行）
 * 接收图片的一个像素分片，处理后返回
 */

interface HSLRange {
  hue: number
  saturation: number
  lightness: number
}

interface HSLAdjustments {
  red:    HSLRange
  orange: HSLRange
  yellow: HSLRange
  green:  HSLRange
  cyan:   HSLRange
  blue:   HSLRange
  purple: HSLRange
}

const COLOR_KEYS: (keyof HSLAdjustments)[] = ['red','orange','yellow','green','cyan','blue','purple']
const CENTERS = [  0,  30,  60, 120, 180, 240, 300]
const HALF    = [ 40,  30,  35,  50,  40,  50,  50]
const SOFT    = [ 20,  15,  20,  30,  20,  30,  30]

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

function hueDiff(h: number, center: number): number {
  const diff = Math.abs(h - center)
  return diff > 180 ? 360 - diff : diff
}

function rangeWeight(hue: number, center: number, half: number, soft: number): number {
  const diff = hueDiff(hue, center)
  if (diff >= half) return 0
  if (diff <= soft) return 1
  return 1 - (diff - soft) / (half - soft)
}

self.onmessage = (e: MessageEvent) => {
  const { buffer, adj, chunkIndex, hires } = e.data as {
    buffer: ArrayBuffer
    adj: HSLAdjustments
    chunkIndex: number
    hires: boolean
  }

  const src = new Uint8ClampedArray(buffer)
  const out = new Uint8ClampedArray(src.length)
  const len = COLOR_KEYS.length

  const adjHue = COLOR_KEYS.map(k => adj[k].hue)
  const adjSat = COLOR_KEYS.map(k => adj[k].saturation / 100)
  const adjLit = COLOR_KEYS.map(k => adj[k].lightness  / 100)

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i+1], b = src[i+2], a = src[i+3]
    let [h, s, l] = rgbToHsl(r, g, b)

    let totalW = 0, dH = 0, dS = 0, dL = 0

    for (let k = 0; k < len; k++) {
      const w = rangeWeight(h, CENTERS[k], HALF[k], SOFT[k])
      if (w > 0) {
        totalW += w
        dH += adjHue[k] * w
        dS += adjSat[k] * w
        dL += adjLit[k] * w
      }
    }

    if (totalW > 1) { dH /= totalW; dS /= totalW; dL /= totalW }

    h = h + dH
    const ns = Math.max(0, Math.min(1, s + dS))
    const nl = Math.max(0, Math.min(1, l + dL))

    const [nr, ng, nb] = hslToRgb(h, ns, nl)
    out[i] = nr; out[i+1] = ng; out[i+2] = nb; out[i+3] = a
  }

  self.postMessage({ buffer: out.buffer, chunkIndex, hires }, { transfer: [out.buffer] })
}
