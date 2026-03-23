/**
 * 蒙版合成 Web Worker（分片并行）
 * 接收原图分片 + 调整后分片 + 蒙版分片，输出 lerp 合成结果
 *
 * output[i] = lerp(original[i], adjusted[i], mask[i] / 255)
 * 蒙版白(255) = 完全显示调整效果，黑(0) = 完全保留原图
 */
export {}

self.onmessage = (e: MessageEvent) => {
  const { original, adjusted, mask } = e.data as {
    original: ArrayBuffer
    adjusted: ArrayBuffer
    mask: ArrayBuffer
  }

  const src = new Uint8ClampedArray(original)
  const adj = new Uint8ClampedArray(adjusted)
  const msk = new Uint8ClampedArray(mask)
  const out = new Uint8ClampedArray(src.length)

  for (let i = 0; i < src.length; i += 4) {
    // 蒙版取 R 通道（灰度图 R=G=B）
    const alpha = msk[i] / 255
    const inv   = 1 - alpha
    out[i]   = src[i]   * inv + adj[i]   * alpha
    out[i+1] = src[i+1] * inv + adj[i+1] * alpha
    out[i+2] = src[i+2] * inv + adj[i+2] * alpha
    out[i+3] = 255
  }

  self.postMessage({ buffer: out.buffer }, { transfer: [out.buffer] })
}
