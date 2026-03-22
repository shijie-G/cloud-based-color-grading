/**
 * RGB 分析 Web Worker
 * 接收像素 buffer，计算直方图数组 + 波形列数据，返回给主线程
 * 主线程只负责 canvas 绘制，不做任何像素遍历
 */

interface RGBWorkerInput {
  buffer: ArrayBuffer   // ImageData.data 的拷贝
  width: number
  height: number
  waveformCols: number  // 波形图列数（通常 256）
}

interface RGBWorkerOutput {
  // 直方图：每个通道 256 个桶
  rHist: Uint32Array
  gHist: Uint32Array
  bHist: Uint32Array
  histMax: number
  // 波形：每列每通道的像素值列表（压缩为 Uint8Array，每列最多 sampleRows 个值）
  // 格式：waveR[col * sampleRows + row] = value (0-255)
  waveR: Uint8Array
  waveG: Uint8Array
  waveB: Uint8Array
  waveRows: number      // 实际采样行数
  waveCols: number
}

self.onmessage = (e: MessageEvent<RGBWorkerInput>) => {
  const { buffer, width, height, waveformCols } = e.data
  const data = new Uint8ClampedArray(buffer)

  // ── 直方图 ──────────────────────────────────────────
  const rHist = new Uint32Array(256)
  const gHist = new Uint32Array(256)
  const bHist = new Uint32Array(256)

  for (let i = 0; i < data.length; i += 4) {
    rHist[data[i]]++
    gHist[data[i + 1]]++
    bHist[data[i + 2]]++
  }

  let histMax = 0
  for (let i = 0; i < 256; i++) {
    if (rHist[i] > histMax) histMax = rHist[i]
    if (gHist[i] > histMax) histMax = gHist[i]
    if (bHist[i] > histMax) histMax = bHist[i]
  }

  // ── 波形 ────────────────────────────────────────────
  // 每列采样行数：最多 120 行，避免数据量过大
  const sampleRows = Math.min(height, 120)
  const cols = waveformCols

  const waveR = new Uint8Array(cols * sampleRows)
  const waveG = new Uint8Array(cols * sampleRows)
  const waveB = new Uint8Array(cols * sampleRows)

  for (let col = 0; col < cols; col++) {
    const imgX = Math.floor((col / cols) * width)
    for (let row = 0; row < sampleRows; row++) {
      const imgY = Math.floor((row / sampleRows) * height)
      const idx  = (imgY * width + imgX) * 4
      waveR[col * sampleRows + row] = data[idx]
      waveG[col * sampleRows + row] = data[idx + 1]
      waveB[col * sampleRows + row] = data[idx + 2]
    }
  }

  const out: RGBWorkerOutput = {
    rHist, gHist, bHist, histMax,
    waveR, waveG, waveB,
    waveRows: sampleRows,
    waveCols: cols,
  }

  self.postMessage(out, {
    transfer: [
      rHist.buffer, gHist.buffer, bHist.buffer,
      waveR.buffer, waveG.buffer, waveB.buffer,
    ]
  })
}
