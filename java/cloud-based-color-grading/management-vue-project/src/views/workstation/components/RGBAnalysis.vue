<template>
  <div class="rgb-analysis">
    <div class="analysis-header">
      <h3 class="analysis-title">
        图像分析
      </h3>
      <div class="analysis-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'histogram' }]"
          @click="switchTab('histogram')"
        >
          直方图
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'waveform' }]"
          @click="switchTab('waveform')"
        >
          波形图
        </button>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 直方图 -->
      <div v-show="activeTab === 'histogram'" class="chart-container">
        <div class="chart-wrapper">
          <canvas ref="histogramCanvas" class="chart-canvas"></canvas>
          <div v-if="isAnalyzing" class="analyzing-overlay">
            <div class="spinner"></div>
            <p>分析中...</p>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color red"></span>
            <span class="legend-label">红色</span>
          </div>
          <div class="legend-item">
            <span class="legend-color green"></span>
            <span class="legend-label">绿色</span>
          </div>
          <div class="legend-item">
            <span class="legend-color blue"></span>
            <span class="legend-label">蓝色</span>
          </div>
        </div>
      </div>

      <!-- 波形图 -->
      <div v-show="activeTab === 'waveform'" class="chart-container">
        <div class="chart-wrapper">
          <canvas ref="waveformCanvas" class="chart-canvas"></canvas>
          <div v-if="isAnalyzing" class="analyzing-overlay">
            <div class="spinner"></div>
            <p>分析中...</p>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color red"></span>
            <span class="legend-label">红色</span>
          </div>
          <div class="legend-item">
            <span class="legend-color green"></span>
            <span class="legend-label">绿色</span>
          </div>
          <div class="legend-item">
            <span class="legend-color blue"></span>
            <span class="legend-label">蓝色</span>
          </div>
        </div>
      </div>

      <!-- 无图片提示 -->
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
import { ref, watch, onMounted, nextTick } from 'vue'

interface RGBAnalysisProps {
  imageSrc: string
  imageFilter: string
}

const props = defineProps<RGBAnalysisProps>()

const activeTab = ref<'histogram' | 'waveform'>('histogram')
const histogramCanvas = ref<HTMLCanvasElement | null>(null)
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const isAnalyzing = ref(false)

let analysisTimeout: number | null = null

// 切换标签页
const switchTab = (tab: 'histogram' | 'waveform') => {
  activeTab.value = tab
  // 切换后重新绘制当前标签页的图表
  if (props.imageSrc && cachedImageData) {
    nextTick(() => {
      if (tab === 'histogram') {
        drawHistogram(cachedImageData!)
      } else {
        drawWaveform(cachedImageData!)
      }
    })
  }
}

// 缓存图片数据
let cachedImageData: ImageData | null = null

// 防抖分析
const debounceAnalyze = () => {
  if (analysisTimeout) {
    clearTimeout(analysisTimeout)
  }
  
  isAnalyzing.value = true
  analysisTimeout = window.setTimeout(() => {
    analyzeImage()
  }, 150)
}

// 监听图片变化，使用防抖
watch(() => [props.imageSrc, props.imageFilter], () => {
  if (props.imageSrc) {
    nextTick(() => {
      debounceAnalyze()
    })
  }
}, { immediate: true })

// 分析图片
const analyzeImage = async () => {
  if (!props.imageSrc) {
    isAnalyzing.value = false
    return
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  img.onload = () => {
    // 创建临时 canvas 获取图片数据
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) {
      isAnalyzing.value = false
      return
    }

    // 限制最大尺寸以提高性能
    const maxSize = 800
    let width = img.width
    let height = img.height
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    tempCanvas.width = width
    tempCanvas.height = height
    
    // 应用滤镜
    tempCtx.filter = props.imageFilter
    tempCtx.drawImage(img, 0, 0, width, height)
    
    const imageData = tempCtx.getImageData(0, 0, width, height)
    
    // 缓存图片数据
    cachedImageData = imageData
    
    // 使用 requestAnimationFrame 分帧绘制
    requestAnimationFrame(() => {
      drawHistogram(imageData)
      requestAnimationFrame(() => {
        drawWaveform(imageData)
        isAnalyzing.value = false
      })
    })
  }

  img.onerror = () => {
    isAnalyzing.value = false
  }

  img.src = props.imageSrc
}

// 绘制直方图（优化版）
const drawHistogram = (imageData: ImageData) => {
  if (!histogramCanvas.value) return

  const canvas = histogramCanvas.value
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return

  // 设置 canvas 尺寸
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2) // 限制最大 DPR
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height

  // 初始化 RGB 直方图数据
  const rHistogram = new Uint32Array(256)
  const gHistogram = new Uint32Array(256)
  const bHistogram = new Uint32Array(256)

  // 统计像素值（优化：使用 Uint32Array）
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    rHistogram[data[i]]++
    gHistogram[data[i + 1]]++
    bHistogram[data[i + 2]]++
  }

  // 找到最大值用于归一化
  let maxValue = 0
  for (let i = 0; i < 256; i++) {
    maxValue = Math.max(maxValue, rHistogram[i], gHistogram[i], bHistogram[i])
  }

  // 清空画布
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, width, height)

  // 绘制网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // 绘制垂直网格
  for (let i = 1; i < 4; i++) {
    const x = (width / 4) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // 绘制直方图（使用路径优化性能）
  const barWidth = width / 256

  const drawChannel = (histogram: Uint32Array, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const barHeight = (histogram[i] / maxValue) * height
      if (barHeight > 0) {
        ctx.rect(i * barWidth, height - barHeight, barWidth, barHeight)
      }
    }
    ctx.fill()
  }

  // 绘制三个通道
  drawChannel(rHistogram, 'rgba(255, 60, 60, 0.6)')
  drawChannel(gHistogram, 'rgba(60, 255, 60, 0.6)')
  drawChannel(bHistogram, 'rgba(60, 120, 255, 0.6)')

  // 绘制边框
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
}

// 绘制波形图（优化版）
const drawWaveform = (imageData: ImageData) => {
  if (!waveformCanvas.value) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return

  // 设置 canvas 尺寸
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height

  // 清空画布
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, width, height)

  // 绘制网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  for (let i = 1; i < 4; i++) {
    const x = (width / 4) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  const imgWidth = imageData.width
  const imgHeight = imageData.height
  const data = imageData.data

  // 优化采样
  const sampleWidth = Math.min(width, 256)
  const sampleHeight = Math.min(imgHeight, 100)

  // 绘制波形
  const drawChannel = (channelIndex: number, color: string) => {
    ctx.fillStyle = color
    
    for (let x = 0; x < sampleWidth; x++) {
      const imgX = Math.floor((x / sampleWidth) * imgWidth)
      const canvasX = (x / sampleWidth) * width
      
      // 收集该列的像素值
      for (let y = 0; y < sampleHeight; y++) {
        const imgY = Math.floor((y / sampleHeight) * imgHeight)
        const index = (imgY * imgWidth + imgX) * 4 + channelIndex
        const value = data[index]
        const canvasY = height - (value / 255) * height
        
        ctx.fillRect(canvasX, canvasY, width / sampleWidth, 1)
      }
    }
  }

  // 绘制 RGB 三个通道
  drawChannel(0, 'rgba(255, 60, 60, 0.5)')
  drawChannel(1, 'rgba(60, 255, 60, 0.5)')
  drawChannel(2, 'rgba(60, 120, 255, 0.5)')

  // 绘制边框
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
}

// 组件挂载时初始化
onMounted(() => {
  if (props.imageSrc) {
    debounceAnalyze()
  }
})
</script>

<style scoped>
.rgb-analysis {
  margin: 0;
  background: transparent;
  border-radius: 0;
  padding: 0;
  border: none;
  box-shadow: none;
}

.rgb-analysis:hover {
  box-shadow: none;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.analysis-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.3px;
}

.title-icon {
  width: 16px;
  height: 16px;
  color: #6c757d;
}

.analysis-tabs {
  display: flex;
  gap: 4px;
  background-color: #f1f3f5;
  padding: 3px;
  border-radius: 8px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  padding: 6px 12px;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #6c757d;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #868e96 0%, #6c757d 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
}

.tab-btn:hover {
  color: #495057;
  background-color: rgba(108, 117, 125, 0.08);
}

.tab-btn.active {
  color: #ffffff;
  background-color: #6c757d;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.25);
}

.tab-btn.active::before {
  opacity: 1;
}

.tab-icon {
  width: 13px;
  height: 13px;
}

.analysis-content {
  position: relative;
  min-height: 252px;
}

.chart-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.chart-container[style*="display: none"] {
  opacity: 0;
  pointer-events: none;
}

.chart-wrapper {
  position: relative;
  background-color: #0a0a0a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #212529;
}

.chart-canvas {
  width: 100%;
  height: 200px;
  display: block;
}

.analyzing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #adb5bd;
  font-size: 13px;
  z-index: 10;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(173, 181, 189, 0.2);
  border-top-color: #6c757d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.legend-color.red {
  background: linear-gradient(135deg, #ff3c3c 0%, #ff6b6b 100%);
}

.legend-color.green {
  background: linear-gradient(135deg, #3cff3c 0%, #6bff6b 100%);
}

.legend-color.blue {
  background: linear-gradient(135deg, #3c78ff 0%, #6b9bff 100%);
}

.legend-label {
  font-size: 11px;
}

.no-image-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #adb5bd;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.tip-icon {
  width: 48px;
  height: 48px;
  color: #ced4da;
  opacity: 0.5;
}

.no-image-tip p {
  margin: 0;
  font-weight: 500;
}
</style>
