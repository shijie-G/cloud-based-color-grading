<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import type { Layer, CanvasConfig } from '../types'
import TransformControls from './TransformControls.vue'

interface Props {
  layers: Layer[]
  selectedLayerId: string | null
  config: CanvasConfig
  baseImageUrl: string
}

interface Emits {
  (e: 'selectLayer', id: string): void
  (e: 'updateLayer', id: string, updates: Partial<Layer>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragLayerId = ref<string | null>(null)
const dragStart = ref({ x: 0, y: 0 })
const layerStart = ref({ x: 0, y: 0 })
const editingTextLayerId = ref<string | null>(null)
const editingText = ref('')

// Canvas 实际显示尺寸（用于图层容器定位）
const canvasDisplayWidth = ref(0)
const canvasDisplayHeight = ref(0)

// 画布变换状态
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanningCanvas = ref(false)

const resetTransform = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

// 绘制底图到 canvas
function drawBaseImage() {
  console.log('drawBaseImage 调用:', { baseImageUrl: props.baseImageUrl, canvasRef: canvasRef.value })

  if (!props.baseImageUrl) {
    console.log('drawBaseImage 跳过: 没有 baseImageUrl')
    return
  }

  // 使用 nextTick 确保 canvas 元素已经渲染
  nextTick(() => {
    if (!canvasRef.value) {
      console.log('drawBaseImage 跳过: canvasRef 不存在')
      return
    }

    console.log('开始绘制底图:', props.baseImageUrl)
    const canvas = canvasRef.value
    const img = new Image()

    img.onload = () => {
      console.log('图片加载成功:', img.naturalWidth, 'x', img.naturalHeight)
      console.log('画布配置尺寸:', props.config.width, 'x', props.config.height)

      // 使用配置的画布尺寸，而不是图片原始尺寸
      canvas.width = props.config.width
      canvas.height = props.config.height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // 将图片绘制到整个画布，保持比例
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        console.log('Canvas 绘制完成')
      }

      // 计算 Canvas 实际显示尺寸（CSS 渲染尺寸）
      updateCanvasDisplaySize()
    }

    img.onerror = (e) => {
      console.error('图片加载失败:', props.baseImageUrl, e)
    }

    img.src = props.baseImageUrl
  })
}

// 更新 Canvas 实际显示尺寸
function updateCanvasDisplaySize() {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  canvasDisplayWidth.value = rect.width
  canvasDisplayHeight.value = rect.height

  console.log('📐 Canvas 显示尺寸更新:')
  console.log(`  实际尺寸: ${props.config.width} x ${props.config.height}`)
  console.log(`  显示尺寸: ${canvasDisplayWidth.value.toFixed(2)} x ${canvasDisplayHeight.value.toFixed(2)}`)
  console.log(`  缩放比例: ${(canvasDisplayWidth.value / props.config.width).toFixed(4)} x ${(canvasDisplayHeight.value / props.config.height).toFixed(4)}`)
}

// 监听底图变化
watch(() => props.baseImageUrl, (newUrl, oldUrl) => {
  console.log('CanvasArea: baseImageUrl 变化', { oldUrl, newUrl, config: props.config })
  if (newUrl) {
    drawBaseImage()
  }
}, { immediate: true })

// 监听画布配置变化
watch(() => [props.config.width, props.config.height], () => {
  console.log('CanvasArea: config 尺寸变化', props.config)
  if (props.baseImageUrl) {
    drawBaseImage()
  }
})

// 组件挂载后也尝试绘制
onMounted(() => {
  console.log('CanvasArea: 组件挂载', { baseImageUrl: props.baseImageUrl, config: props.config })
  if (props.baseImageUrl) {
    drawBaseImage()
  }

  // 监听窗口大小变化，更新 Canvas 显示尺寸
  window.addEventListener('resize', updateCanvasDisplaySize)

  // 使用 ResizeObserver 监听容器大小变化（更精确）
  if (wrapperRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDisplaySize()
    })
    resizeObserver.observe(wrapperRef.value)

    // 清理时断开观察
    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

// 处理图层点击
function handleLayerClick(layer: Layer, event: MouseEvent) {
  if (layer.locked) return
  event.stopPropagation()
  emit('selectLayer', layer.id)
}

// 处理画布点击（取消选择）
function handleCanvasClick(e: MouseEvent) {
  // 只有点击 canvas 本身才取消选择
  if (e.target === canvasRef.value) {
    emit('selectLayer', '')
  }
}

// 开始拖拽图层
function handleMouseDown(layer: Layer, event: MouseEvent) {
  if (layer.locked) return
  event.stopPropagation()
  event.preventDefault()

  isDragging.value = true
  dragLayerId.value = layer.id
  dragStart.value = { x: event.clientX, y: event.clientY }
  layerStart.value = { x: layer.x, y: layer.y }

  emit('selectLayer', layer.id)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.userSelect = 'none'
}

// 拖拽移动图层
function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !dragLayerId.value) return

  // 安全检查：确保显示尺寸已初始化
  if (!canvasDisplayWidth.value || !canvasDisplayHeight.value || !props.config.width || !props.config.height) {
    console.warn('画布尺寸未初始化，无法拖拽')
    return
  }

  // 计算缩放比例
  const scaleX = canvasDisplayWidth.value / props.config.width
  const scaleY = canvasDisplayHeight.value / props.config.height

  // 鼠标移动的像素距离需要除以两个缩放：
  // 1. scaleX/scaleY: canvas 显示尺寸到实际尺寸的缩放
  // 2. scale.value: 用户手动缩放的倍数（canvas-layer-wrapper 的 transform scale）
  const dx = (event.clientX - dragStart.value.x) / scaleX / scale.value
  const dy = (event.clientY - dragStart.value.y) / scaleY / scale.value

  const newX = layerStart.value.x + dx
  const newY = layerStart.value.y + dy

  console.log(`🖱️ 拖拽图层:`)
  console.log(`  鼠标移动: (${(event.clientX - dragStart.value.x).toFixed(2)}, ${(event.clientY - dragStart.value.y).toFixed(2)}) 屏幕像素`)
  console.log(`  缩放比例: scaleX=${scaleX.toFixed(4)}, scaleY=${scaleY.toFixed(4)}, scale=${scale.value}`)
  console.log(`  实际移动: (${dx.toFixed(2)}, ${dy.toFixed(2)}) 图片像素`)
  console.log(`  新坐标: (${newX.toFixed(2)}, ${newY.toFixed(2)})`)

  emit('updateLayer', dragLayerId.value, {
    x: newX,
    y: newY
  })
}

// 结束拖拽图层
function handleMouseUp() {
  isDragging.value = false
  dragLayerId.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.userSelect = ''
}

// 双击编辑文字
function handleDoubleClick(layer: Layer, event: MouseEvent) {
  if (layer.type === 'text' && !layer.locked) {
    event.stopPropagation()
    editingTextLayerId.value = layer.id
    editingText.value = layer.text || ''

    // 自动聚焦到输入框
    nextTick(() => {
      const textarea = document.querySelector('.layer-text-edit') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        textarea.select()
      }
    })
  }
}

// 完成文字编辑
function finishTextEdit() {
  if (editingTextLayerId.value) {
    emit('updateLayer', editingTextLayerId.value, {
      text: editingText.value
    })
    editingTextLayerId.value = null
    editingText.value = ''
  }
}

// 取消文字编辑
function cancelTextEdit() {
  editingTextLayerId.value = null
  editingText.value = ''
}

// 处理图层缩放
function handleLayerResize(layerId: string, data: { width: number; height: number }) {
  emit('updateLayer', layerId, data)
}

// 处理图层旋转
function handleLayerRotate(layerId: string, rotation: number) {
  emit('updateLayer', layerId, { rotation })
}

// 画布双击事件
function handleCanvasDoubleClick() {
  if (scale.value !== 1 || offsetX.value !== 0 || offsetY.value !== 0) {
    resetTransform()
  } else {
    scale.value = 1.5
  }
}

// 画布滚轮缩放
function handleCanvasWheel(e: WheelEvent) {
  e.preventDefault()

  const oldScale = scale.value
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  const newScale = Math.min(8, Math.max(0.2, parseFloat((oldScale + delta).toFixed(1))))
  if (newScale === oldScale) return

  console.log(`🔍 画布缩放: ${oldScale.toFixed(1)}x → ${newScale.toFixed(1)}x`)

  // 鼠标相对于容器的位置
  const wrapper = wrapperRef.value
  if (!wrapper) {
    scale.value = newScale
    return
  }

  const rect = wrapper.getBoundingClientRect()
  const mouseX = e.clientX - rect.left - rect.width / 2
  const mouseY = e.clientY - rect.top - rect.height / 2

  // 缩放后调整偏移，使鼠标指向的点保持不动
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / oldScale)
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / oldScale)
  scale.value = newScale

  console.log(`  偏移: (${offsetX.value.toFixed(2)}, ${offsetY.value.toFixed(2)})`)
}

// 画布拖拽平移（只在空白区域触发）
let panStartX = 0, panStartY = 0, panOffsetX = 0, panOffsetY = 0, panMoved = false
const PAN_THRESHOLD = 4

function handleCanvasMouseDown(e: MouseEvent) {
  // 只有直接点击 canvas 时才触发拖拽
  if (e.target !== canvasRef.value) return
  if (e.button !== 0) return
  e.preventDefault()

  panStartX = e.clientX
  panStartY = e.clientY
  panOffsetX = offsetX.value
  panOffsetY = offsetY.value
  panMoved = false

  document.addEventListener('mousemove', onCanvasPanMove)
  document.addEventListener('mouseup', onCanvasPanUp)
  document.body.style.userSelect = 'none'
}

function onCanvasPanMove(e: MouseEvent) {
  const dx = e.clientX - panStartX
  const dy = e.clientY - panStartY

  if (!panMoved && Math.hypot(dx, dy) > PAN_THRESHOLD) {
    panMoved = true
    isPanningCanvas.value = true
    document.body.style.cursor = 'grabbing'
  }

  if (panMoved) {
    offsetX.value = panOffsetX + dx
    offsetY.value = panOffsetY + dy
  }
}

function onCanvasPanUp() {
  isPanningCanvas.value = false
  panMoved = false
  document.removeEventListener('mousemove', onCanvasPanMove)
  document.removeEventListener('mouseup', onCanvasPanUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 获取图层样式
function getLayerStyle(layer: Layer) {
  // 如果显示尺寸还未初始化，返回隐藏样式
  if (!canvasDisplayWidth.value || !canvasDisplayHeight.value || !props.config.width || !props.config.height) {
    console.warn(`⚠️ 图层 "${layer.name}" 渲染时画布尺寸未初始化`)
    return {
      display: 'none'
    }
  }

  // 计算 Canvas 的缩放比例（显示尺寸 / 实际尺寸）
  // 注意：这里不需要考虑 scale.value，因为图层容器已经被 canvas-layer-wrapper 的 transform scale 缩放了
  const scaleX = canvasDisplayWidth.value / props.config.width
  const scaleY = canvasDisplayHeight.value / props.config.height

  console.log(`🎨 渲染图层 "${layer.name}":`)
  console.log(`  像素坐标: (${layer.x.toFixed(2)}, ${layer.y.toFixed(2)})`)
  console.log(`  像素尺寸: ${layer.width.toFixed(2)} x ${layer.height.toFixed(2)}`)
  console.log(`  显示坐标: (${(layer.x * scaleX).toFixed(2)}, ${(layer.y * scaleY).toFixed(2)})`)
  console.log(`  显示尺寸: ${(layer.width * scaleX).toFixed(2)} x ${(layer.height * scaleY).toFixed(2)}`)
  console.log(`  画布缩放: ${scale.value}x (已由容器处理，不影响图层坐标)`)

  const style: any = {
    position: 'absolute',
    left: `${layer.x * scaleX}px`,
    top: `${layer.y * scaleY}px`,
    width: `${layer.width * scaleX}px`,
    height: `${layer.height * scaleY}px`,
    opacity: layer.opacity,
    transform: `rotate(${layer.rotation}deg)`,
    cursor: layer.locked ? 'not-allowed' : 'move',
    display: layer.visible ? 'block' : 'none',
    zIndex: layer.zIndex,
    pointerEvents: layer.locked ? 'none' : 'auto'
  }

  // 添加边框样式（图片和形状）
  if (layer.strokeWidth && layer.strokeWidth > 0) {
    style.border = `${layer.strokeWidth * scaleX}px solid ${layer.strokeColor || '#000000'}`
    style.boxSizing = 'border-box'
  }

  return style
}

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mousemove', onCanvasPanMove)
  document.removeEventListener('mouseup', onCanvasPanUp)
  window.removeEventListener('resize', updateCanvasDisplaySize)
})
</script>

<template>
  <div class="canvas-area" ref="wrapperRef" @wheel.prevent="handleCanvasWheel">
    <div class="image-wrapper">
      <!-- 画布和图层的统一容器 -->
      <div
        class="canvas-layer-wrapper"
        :style="{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
        }"
      >
        <!-- 底图 canvas -->
        <canvas
          ref="canvasRef"
          v-show="!!baseImageUrl"
          :style="{
            cursor: isPanningCanvas ? 'grabbing' : 'grab'
          }"
          @click="handleCanvasClick"
          @dblclick="handleCanvasDoubleClick"
          @mousedown="handleCanvasMouseDown"
        />

        <!-- 图层容器 -->
        <div
          class="layer-container"
          v-show="!!baseImageUrl"
          :style="{
            width: `${canvasDisplayWidth}px`,
            height: `${canvasDisplayHeight}px`
          }"
        >
          <!-- 渲染所有图层 -->
          <div
            v-for="layer in layers"
            :key="layer.id"
            :class="['layer', { selected: layer.id === selectedLayerId }]"
            :style="getLayerStyle(layer)"
            @click="handleLayerClick(layer, $event)"
            @mousedown="handleMouseDown(layer, $event)"
            @dblclick="handleDoubleClick(layer, $event)"
          >
            <!-- 图片图层 -->
            <img
              v-if="layer.type === 'image' && layer.imageUrl"
              :src="layer.imageUrl"
              :alt="layer.name"
              class="layer-image"
              draggable="false"
            />

            <!-- 文字图层 - 编辑模式 -->
            <textarea
              v-if="layer.type === 'text' && editingTextLayerId === layer.id"
              v-model="editingText"
              class="layer-text-edit"
              :style="{
                fontSize: `${layer.fontSize}px`,
                fontFamily: layer.fontFamily,
                color: layer.color
              }"
              @blur="finishTextEdit"
              @keydown.enter.exact="finishTextEdit"
              @keydown.esc="cancelTextEdit"
            ></textarea>

            <!-- 文字图层 - 显示模式 -->
            <div
              v-else-if="layer.type === 'text'"
              class="layer-text"
              :style="{
                fontSize: `${layer.fontSize}px`,
                fontFamily: layer.fontFamily,
                color: layer.color
              }"
            >
              {{ layer.text }}
            </div>

            <!-- 形状图层 -->
            <div
              v-else-if="layer.type === 'shape'"
              class="layer-shape"
              :class="layer.shapeType"
              :style="{
                backgroundColor: layer.fillColor,
                color: layer.fillColor
              }"
            ></div>

            <!-- 选中边框和变换控制 -->
            <div v-if="layer.id === selectedLayerId && editingTextLayerId !== layer.id" class="selection-border">
              <TransformControls
                :x="layer.x"
                :y="layer.y"
                :width="layer.width"
                :height="layer.height"
                :rotation="layer.rotation"
                @resize="handleLayerResize(layer.id, $event)"
                @rotate="handleLayerRotate(layer.id, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 缩放指示器 -->
    <div class="scale-indicator" v-if="scale !== 1">
      {{ Math.round(scale * 100) }}%
      <button class="reset-btn" @click="resetTransform">复位</button>
    </div>
  </div>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2d35;
  overflow: hidden;
  padding: 2rem;
  position: relative;
}

.image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.canvas-layer-wrapper {
  position: relative;
  transform-origin: center center;
  will-change: transform;
  display: inline-block;
}

.image-wrapper canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  user-select: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.layer-container {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.layer {
  position: absolute;
  user-select: none;
  cursor: move;
  pointer-events: auto;
}

.layer.selected {
  outline: none;
}

.layer-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.layer-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: pre-wrap;
  word-break: break-word;
}

.layer-text-edit {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  text-align: center;
  padding: 4px;
  box-sizing: border-box;
}

.layer-shape {
  width: 100%;
  height: 100%;
  position: relative;
}

.layer-shape.circle {
  border-radius: 50%;
}

.layer-shape.triangle {
  width: 0;
  height: 0;
  border-left: 50% solid transparent;
  border-right: 50% solid transparent;
  border-bottom: 100% solid currentColor;
  background: transparent !important;
}

.layer-shape.star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.layer-shape.heart {
  position: relative;
  background: transparent !important;
}

.layer-shape.heart::before,
.layer-shape.heart::after {
  content: "";
  position: absolute;
  top: 0;
  width: 52%;
  height: 80%;
  border-radius: 50% 50% 0 0;
  background: currentColor;
}

.layer-shape.heart::before {
  left: 0;
  transform: rotate(-45deg);
  transform-origin: 100% 100%;
}

.layer-shape.heart::after {
  right: 0;
  transform: rotate(45deg);
  transform-origin: 0 100%;
}

.layer-shape.arrow {
  clip-path: polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%);
}

.layer-shape.pentagon {
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

.layer-shape.hexagon {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

.selection-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #5b6af0;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.scale-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  padding: 4px 10px;
  border-radius: 20px;
  pointer-events: auto;
  z-index: 20;
  user-select: none;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}
</style>
