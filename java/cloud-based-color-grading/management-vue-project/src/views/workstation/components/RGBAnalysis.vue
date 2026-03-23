<template>
  <div class="rgb-analysis">
    <div class="analysis-header">
      <h3 class="analysis-title">图像分析</h3>
      <div class="analysis-tabs">
        <button :class="['tab-btn', { active: activeTab === 'histogram' }]" @click="switchTab('histogram')">直方图</button>
        <button :class="['tab-btn', { active: activeTab === 'waveform' }]" @click="switchTab('waveform')">波形图</button>
      </div>
    </div>

    <div class="analysis-content">
      <div v-show="activeTab === 'histogram'" class="chart-container">
        <div class="chart-wrapper">
          <canvas ref="histogramCanvas" class="chart-canvas"></canvas>
          <div v-if="showTooltip" class="chart-tooltip">{{ tooltipValue }}</div>
        </div>
        <div class="chart-legend">
          <div class="legend-item all" :class="{ active: allVisible }" @click="toggleChannel('all')"><span class="legend-label">全部</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.r && !allVisible, dim: !visibleChannels.r }" @click="toggleChannel('r')"><span class="legend-color red"></span><span class="legend-label">红色</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.g && !allVisible, dim: !visibleChannels.g }" @click="toggleChannel('g')"><span class="legend-color green"></span><span class="legend-label">绿色</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.b && !allVisible, dim: !visibleChannels.b }" @click="toggleChannel('b')"><span class="legend-color blue"></span><span class="legend-label">蓝色</span></div>
        </div>
      </div>

      <div v-show="activeTab === 'waveform'" class="chart-container">
        <div class="chart-wrapper">
          <canvas ref="waveformCanvas" class="chart-canvas"></canvas>
        </div>
        <div class="chart-legend">
          <div class="legend-item all" :class="{ active: allVisible }" @click="toggleChannel('all')"><span class="legend-label">全部</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.r && !allVisible, dim: !visibleChannels.r }" @click="toggleChannel('r')"><span class="legend-color red"></span><span class="legend-label">红色</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.g && !allVisible, dim: !visibleChannels.g }" @click="toggleChannel('g')"><span class="legend-color green"></span><span class="legend-label">绿色</span></div>
          <div class="legend-item" :class="{ active: visibleChannels.b && !allVisible, dim: !visibleChannels.b }" @click="toggleChannel('b')"><span class="legend-color blue"></span><span class="legend-label">蓝色</span></div>
        </div>
      </div>

      <div v-if="!imageSrc" class="no-image-tip">
        <svg class="tip-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>上传图片后显示分析数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

interface RGBAnalysisProps {
  imageSrc: string
  processedSrc?: string
}
const props = defineProps<RGBAnalysisProps>()

const activeTab       = ref<'histogram' | 'waveform'>('histogram')
const histogramCanvas = ref<HTMLCanvasElement | null>(null)
const waveformCanvas  = ref<HTMLCanvasElement | null>(null)
const showTooltip     = ref(false)
const tooltipValue    = ref('')

// 通道可见性（默认全开）
const visibleChannels = ref({ r: true, g: true, b: true })
const allVisible = computed(() => visibleChannels.value.r && visibleChannels.value.g && visibleChannels.value.b)

const toggleChannel = (ch: 'r' | 'g' | 'b' | 'all') => {
  if (ch === 'all') {
    visibleChannels.value = { r: true, g: true, b: true }
  } else {
    visibleChannels.value = { r: false, g: false, b: false, [ch]: true }
  }
  if (cachedResult) {
    drawHistogram(cachedResult)
    drawWaveform(cachedResult)
  }
}

// ── Worker（懒创建，整个组件生命周期复用一个）────────────
let worker: Worker | null = null
const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL('../workers/rgbWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = onWorkerMessage
  }
  return worker
}

// ── 缓存 Worker 计算结果，切换 tab 时直接重绘 ────────────
interface AnalysisResult {
  rHist: Uint32Array; gHist: Uint32Array; bHist: Uint32Array; histMax: number
  waveR: Uint8Array;  waveG: Uint8Array;  waveB: Uint8Array
  waveRows: number;   waveCols: number
}
let cachedResult: AnalysisResult | null = null

// 防抖 + 跳帧
let debounceTimer: number | null = null
let workerBusy = false
let pendingSrc: string | null = null

// ── Worker 回调：只做 canvas 绘制 ────────────────────────
const onWorkerMessage = (e: MessageEvent<AnalysisResult>) => {
  workerBusy = false
  cachedResult = e.data
  requestAnimationFrame(() => {
    drawHistogram(cachedResult!)
    drawWaveform(cachedResult!)
  })
  if (pendingSrc) {
    const src = pendingSrc; pendingSrc = null
    sendToWorker(src)
  }
}

// ── 解码图片 → 发给 Worker（主线程只做 drawImage + getImageData）
const sendToWorker = (src: string) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const maxSize = 600
    let w = img.naturalWidth, h = img.naturalHeight
    if (w > maxSize || h > maxSize) {
      const r = Math.min(maxSize / w, maxSize / h)
      w = Math.floor(w * r); h = Math.floor(h * r)
    }
    const tmp = document.createElement('canvas')
    tmp.width = w; tmp.height = h
    const ctx = tmp.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, w, h)
    const imageData = ctx.getImageData(0, 0, w, h)
    const copy = new Uint8ClampedArray(imageData.data.length)
    copy.set(imageData.data)
    workerBusy = true
    getWorker().postMessage(
      { buffer: copy.buffer, width: w, height: h, waveformCols: 256 },
      { transfer: [copy.buffer] }
    )
  }
  img.onerror = () => { workerBusy = false }
  img.src = src
}

// ── 防抖调度：图片切换时稍微等一下，滑块变化立即触发 ──
const scheduleAnalyze = (immediate = false) => {
  if (!props.imageSrc) return
  if (debounceTimer) clearTimeout(debounceTimer)
  const run = () => {
    const src = props.processedSrc || props.imageSrc
    if (workerBusy) { pendingSrc = src } else { sendToWorker(src) }
  }
  if (immediate) { run() } else { debounceTimer = window.setTimeout(run, 80) }
}

watch(() => [props.imageSrc, props.processedSrc], (_, old) => {
  if (!props.imageSrc) return
  const imgChanged = old && props.imageSrc !== (old as string[])[0]
  nextTick(() => scheduleAnalyze(!imgChanged))
}, { immediate: true })

// ── 切换 tab 直接用缓存重绘 ──────────────────────────────
const switchTab = (tab: 'histogram' | 'waveform') => {
  activeTab.value = tab
  if (cachedResult) nextTick(() => {
    if (tab === 'histogram') drawHistogram(cachedResult!)
    else drawWaveform(cachedResult!)
  })
}

// ── 直方图绘制 ───────────────────────────────────────────
const drawHistogram = (r: AnalysisResult) => {
  const canvas = histogramCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: false })!
  const dpr = Math.min(window.devicePixelRatio, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const W = rect.width, H = rect.height

  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, H / 4 * i); ctx.lineTo(W, H / 4 * i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W / 4 * i, 0); ctx.lineTo(W / 4 * i, H); ctx.stroke()
  }

  const bw = W / 256
  // screen 混合：三通道像光叠加，亮度只增不减，彻底消除黑柱割裂
  ctx.globalCompositeOperation = 'screen'
  const drawCh = (hist: Uint32Array, color: string) => {
    ctx.fillStyle = color; ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const bh = (hist[i] / r.histMax) * H
      if (bh > 0) ctx.rect(i * bw, H - bh, bw, bh)
    }
    ctx.fill()
  }
  const v = visibleChannels.value
  if (v.r) drawCh(r.rHist, 'rgb(210,50,50)')
  if (v.g) drawCh(r.gHist, 'rgb(50,210,50)')
  if (v.b) drawCh(r.bHist, 'rgb(50,100,220)')
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
}

// ── 波形图绘制 ───────────────────────────────────────────
const drawWaveform = (r: AnalysisResult) => {
  const canvas = waveformCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: false })!
  const dpr = Math.min(window.devicePixelRatio, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const W = rect.width, H = rect.height

  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, H / 4 * i); ctx.lineTo(W, H / 4 * i); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W / 4 * i, 0); ctx.lineTo(W / 4 * i, H); ctx.stroke()
  }

  const { waveR, waveG, waveB, waveRows, waveCols } = r
  const colW = W / waveCols
  const drawWaveCh = (wave: Uint8Array, color: string) => {
    ctx.fillStyle = color
    for (let col = 0; col < waveCols; col++) {
      const base = col * waveRows; const cx = col * colW
      for (let row = 0; row < waveRows; row++) {
        const cy = H - (wave[base + row] / 255) * H
        ctx.fillRect(cx, cy, colW, 1)
      }
    }
  }
  const vw = visibleChannels.value
  if (vw.r) drawWaveCh(waveR, 'rgba(255,60,60,0.5)')
  if (vw.g) drawWaveCh(waveG, 'rgba(60,255,60,0.5)')
  if (vw.b) drawWaveCh(waveB, 'rgba(60,120,255,0.5)')
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
}

// ── 鼠标悬停 tooltip ─────────────────────────────────────
const handleMouseMove = (e: MouseEvent) => {
  if (!histogramCanvas.value || !cachedResult || activeTab.value !== 'histogram') return
  const rect = histogramCanvas.value.getBoundingClientRect()
  const pv = Math.floor(((e.clientX - rect.left) / rect.width) * 256)
  if (pv < 0 || pv > 255) return
  const { rHist, gHist, bHist, histMax } = cachedResult
  const yRatio = 1 - (e.clientY - rect.top) / rect.height
  showTooltip.value = true
  tooltipValue.value = `像素值: ${pv} | 计数: ${Math.floor(yRatio * histMax)} | R:${rHist[pv]} G:${gHist[pv]} B:${bHist[pv]}`
}
const handleMouseLeave = () => { showTooltip.value = false }

onMounted(() => {
  histogramCanvas.value?.addEventListener('mousemove', handleMouseMove)
  histogramCanvas.value?.addEventListener('mouseleave', handleMouseLeave)
  if (props.imageSrc) scheduleAnalyze(false)
})

onUnmounted(() => {
  histogramCanvas.value?.removeEventListener('mousemove', handleMouseMove)
  histogramCanvas.value?.removeEventListener('mouseleave', handleMouseLeave)
  if (debounceTimer) clearTimeout(debounceTimer)
  worker?.terminate(); worker = null
})
</script>

<style scoped>
.rgb-analysis { margin: 0; background: transparent; padding: 0; border: none; }
.analysis-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.analysis-title { font-size: 13px; font-weight: 600; color: #d1d5db; margin: 0; letter-spacing: 0.3px; }
.analysis-tabs { display: flex; gap: 4px; background-color: rgba(0,0,0,0.2); padding: 3px; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.3); }
.tab-btn { padding: 5px 10px; background-color: transparent; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; color: #9ca3af; transition: all 0.2s ease; font-weight: 500; outline: none; }
.tab-btn:hover { color: #d1d5db; background-color: rgba(255,255,255,0.05); }
.tab-btn.active { color: #fff; background-color: #4b5563; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.analysis-content { position: relative; min-height: 252px; }
.chart-container { position: absolute; top: 0; left: 0; right: 0; }
.chart-wrapper { position: relative; background-color: #0a0a0a; border-radius: 6px; overflow: hidden; box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); }
.chart-canvas { width: 100%; height: 200px; display: block; cursor: crosshair; }
.chart-tooltip { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.85); color: #e5e7eb; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-family: 'Courier New', monospace; pointer-events: none; z-index: 20; border: 1px solid rgba(255,255,255,0.15); white-space: nowrap; }
.chart-legend { display: flex; justify-content: center; gap: 14px; margin-top: 10px; padding: 7px; background-color: rgba(0,0,0,0.2); border-radius: 5px; border: 1px solid rgba(255,255,255,0.05); }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #9ca3af; font-weight: 500; cursor: pointer; padding: 3px 6px; border-radius: 4px; border: 1px solid transparent; transition: all 0.15s; user-select: none; }
.legend-item:hover { background: rgba(255,255,255,0.06); }
.legend-item.active { color: #e2e4e9; border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.07); }
.legend-item.dim { opacity: 0.35; }
.legend-item.all { color: #6b7280; }
.legend-item.all.active { color: #e2e4e9; border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.07); }
.legend-color { width: 11px; height: 11px; border-radius: 2px; display: inline-block; }
.legend-color.red { background: linear-gradient(135deg, #ff3c3c, #ff6b6b); }
.legend-color.green { background: linear-gradient(135deg, #3cff3c, #6bff6b); }
.legend-color.blue { background: linear-gradient(135deg, #3c78ff, #6b9bff); }
.no-image-tip { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; color: #6b7280; font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.tip-icon { width: 40px; height: 40px; color: #4b5563; opacity: 0.5; }
.no-image-tip p { margin: 0; font-weight: 500; }
</style>
