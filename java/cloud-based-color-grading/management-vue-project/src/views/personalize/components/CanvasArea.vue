<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import type { Layer, CanvasConfig } from '../types'

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
const layerContainerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragLayerId = ref<string | null>(null)
const dragStart = ref({ x: 0, y: 0 })
const layerStart = ref({ x: 0, y: 0 })
const editingTextLayerId = ref<string | null>(null)
const editingText = ref('')

// 画布变换状态
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanningCanvas = ref(false)

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
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        console.log('Canvas 绘制完成')
      }
    }

    img.onerror = (e) => {
      console.error('图片加载失败:', props.baseImageUrl, e)
    }

    img.src = props.baseImageUrl
  })
}

// 监听底图变化
watch(() => props.baseImageUrl, (newUrl, oldUrl) => {
  console.log('CanvasArea: baseImageUrl 变化', { oldUrl, newUrl, config: props.config })
  if (newUrl) {
    drawBaseImage()
  }
}, { immediate: true })

// 组件挂载后也尝试绘制
onMounted(() => {
  console.log('CanvasArea: 组件挂载', { baseImageUrl: props.baseImageUrl, config: props.config })
  if (props.baseImageUrl) {
    drawBaseImage()
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

  const dx = (event.clientX - dragStart.value.x) / scale.value
  const dy = (event.clientY - dragStart.value.y) / scale.value

  emit('updateLayer', dragLayerId.value, {
    x: layerStart.value.x + dx,
    y: layerStart.value.y + dy
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

// 重置画布变换
function resetTransform() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
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
  const style: any = {
    position: 'absolute',
    left: `${layer.x}px`,
    top: `${layer.y}px`,
    width: `${layer.width}px`,
    height: `${layer.height}px`,
    opacity: layer.opacity,
    transform: `rotate(${layer.rotation}deg)`,
    cursor: layer.locked ? 'not-allowed' : 'move',
    display: layer.visible ? 'block' : 'none',
    zIndex: layer.zIndex,
    pointerEvents: layer.locked ? 'none' : 'auto'
  }

  // 添加边框样式（图片和形状）
  if (layer.strokeWidth && layer.strokeWidth > 0) {
    style.border = `${layer.strokeWidth}px solid ${layer.strokeColor || '#000000'}`
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
})
</script>

<template>
  <div class="canvas-area" ref="wrapperRef" @wheel.prevent="handleCanvasWheel">
    <div class="image-wrapper">
      <!-- 底图 canvas -->
      <canvas
        ref="canvasRef"
        v-show="!!baseImageUrl"
        :style="{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          cursor: isPanningCanvas ? 'grabbing' : 'grab',
          marginLeft: `-${config.width / 2}px`,
          marginTop: `-${config.height / 2}px`
        }"
        @click="handleCanvasClick"
        @dblclick="handleCanvasDoubleClick"
        @mousedown="handleCanvasMouseDown"
      />

      <!-- 图层容器 -->
      <div
        ref="layerContainerRef"
        class="layer-container"
        v-show="!!baseImageUrl"
        :style="{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          width: `${config.width}px`,
          height: `${config.height}px`,
          marginLeft: `-${config.width / 2}px`,
          marginTop: `-${config.height / 2}px`
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
            backgroundColor: layer.fillColor
          }"
        ></div>

        <!-- 选中边框 -->
        <div v-if="layer.id === selectedLayerId && editingTextLayerId !== layer.id" class="selection-border">
          <!-- 四个角的控制点 -->
          <div class="corner-handle top-left"></div>
          <div class="corner-handle top-right"></div>
          <div class="corner-handle bottom-left"></div>
          <div class="corner-handle bottom-right"></div>
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

.image-wrapper canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transform-origin: center center;
  user-select: none;
  display: block;
  will-change: transform;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.layer-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  will-change: transform;
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
}

.layer-shape.circle {
  border-radius: 50%;
}

.layer-shape.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid currentColor;
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

.corner-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #5b6af0;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.corner-handle.top-left {
  top: -4px;
  left: -4px;
}

.corner-handle.top-right {
  top: -4px;
  right: -4px;
}

.corner-handle.bottom-left {
  bottom: -4px;
  left: -4px;
}

.corner-handle.bottom-right {
  bottom: -4px;
  right: -4px;
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
