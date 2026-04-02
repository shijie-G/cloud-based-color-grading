<template>
  <div
    class="image-preview-area"
    :style="{ height: `calc(100% - ${galleryHeight}vh - 8px)` }"
    :class="{ 'drag-over': isDragOver, 'has-image': !!imageSrc }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @wheel.prevent="handleWheel"
  >
    <div class="drag-backdrop" v-if="isDragOver"></div>

    <div class="image-wrapper" ref="wrapperRef">
      <canvas
        ref="previewCanvas"
        v-show="!!imageSrc"
        :style="{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          cursor: cropActive ? 'default' : (isPanning ? 'grabbing' : 'grab'),
        }"
        @dblclick="handleDoubleClick"
        @mousedown="handleMouseDown"
      />

      <!-- 蒙版交互层 -->
      <MaskCanvas
        v-if="!!imageSrc && !cropActive"
        :active="maskActive"
        :layer="maskActiveLayer"
        :showOverlay="maskShowOverlay"
        :imageCanvas="previewCanvas"
        :clipContainer="wrapperRef"
        :imgScale="scale"
        :imgOffsetX="offsetX"
        :imgOffsetY="offsetY"
        @update:layer="emit('mask:updateLayer', $event)"
        @commit="emit('mask:commit')"
      />

      <!-- 网格线控制悬浮面板（右上角，visible 时展开） -->
      <div
        v-if="imageReady && gridSettings.visible"
        class="grid-float-panel"
        :class="{ 'open-upward': gridOpenUpward }"
        :style="gridPanelStyle"
      >
        <div class="grid-float-header" @mousedown="onGridHeaderMouseDown" @click="onGridHeaderClick">
          <span class="grid-float-title">网格设置</span>
          <svg class="grid-float-arrow" :class="{ collapsed: !gridExpanded }" viewBox="0 0 24 24" fill="none" width="12" height="12">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div v-if="gridExpanded" class="grid-float-content">
          <GridPanel :settings="gridSettings" @preset="applyGridPreset" />
        </div>
      </div>

      <!-- 网格线叠加层 -->
      <GridOverlay
        v-if="imageReady"
        :settings="gridSettings"
        :imageCanvas="previewCanvas"
        :imgScale="scale"
        :imgOffsetX="offsetX"
        :imgOffsetY="offsetY"
      />

      <!-- 裁切工具层 -->
      <CropTool
        ref="cropToolRef"
        :show="cropActive && !!imageSrc"
        :canvas="previewCanvas"
        :ratio="cropRatio"
        :initialRect="cropInitialRect"
        @commit="onCropCommit"
        @cancel="emit('crop:cancel')"
      />

      <!-- 裁切操作栏：悬浮在 image-wrapper 底部，不受 crop-root overflow:hidden 限制 -->
      <div v-if="cropActive && !!imageSrc" class="crop-toolbar">
        <span class="crop-size">{{ cropToolRef?.pixelW ?? 0 }} × {{ cropToolRef?.pixelH ?? 0 }}</span>
        <button class="crop-btn-cancel" @click="emit('crop:cancel')">取消</button>
        <button class="crop-btn-apply" @click="cropToolRef?.doCommit()">应用</button>
      </div>

      <!-- 旋转/翻转待确认操作栏 -->
      <div v-else-if="transformPending && !!imageSrc" class="crop-toolbar">
        <span class="crop-size">旋转 / 翻转</span>
        <button class="crop-btn-cancel" @click="emit('transform:cancel')">取消</button>
        <button class="crop-btn-apply" @click="emit('transform:confirm')">确认</button>
      </div>

      <div class="scale-indicator" v-if="imageSrc && scale !== 1">
        {{ Math.round(scale * 100) }}%
        <button class="reset-btn" @click="resetTransform">复位</button>
      </div>

      <div class="upload-area" v-if="showUploadTips">
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <p class="primary-text">拖拽图片到此处</p>
            <p class="secondary-text">支持 JPG、PNG、GIF 格式</p>
          </div>
        </div>
      </div>

      <div class="drag-overlay" v-if="isDragOver">
        <div class="drag-content"><p>释放以上传图片</p></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MaskCanvas from './MaskCanvas.vue'
import CropTool from './CropTool.vue'
import GridOverlay from './GridOverlay.vue'
import GridPanel from './GridPanel.vue'
import type { MaskLayer } from '../composables/useMaskState'
import type { GridSettings } from '../composables/useGridState'

interface ImagePreviewProps {
  imageSrc: string
  processedSrc: string
  showUploadTips: boolean
  galleryHeight: number
  maskActive: boolean
  maskActiveLayer: MaskLayer | null
  maskShowOverlay: boolean
  cropActive: boolean
  cropRatio: number | null
  cropInitialRect: { x: number; y: number; w: number; h: number } | null
  transformPending: boolean
  gridSettings: GridSettings
  applyGridPreset: (p: 'thirds' | 'ninths' | 'golden') => void
}
interface ImagePreviewEvents {
  'upload:image':      [file: File]
  'mask:commit':       []
  'mask:updateLayer':  [layer: MaskLayer]
  'crop:commit':       [rect: { x: number; y: number; w: number; h: number }]
  'crop:cancel':       []
  'transform:confirm': []
  'transform:cancel':  []
}

const props = defineProps<ImagePreviewProps>()
const emit  = defineEmits<ImagePreviewEvents>()

const previewCanvas  = ref<HTMLCanvasElement | null>(null)
const wrapperRef     = ref<HTMLElement | null>(null)
const cropToolRef    = ref<InstanceType<typeof CropTool> | null>(null)
const gridExpanded   = ref(true)
// 图片是否已绘制到 canvas（用于控制网格线渲染时机）
const imageReady = ref(false)

// 网格面板拖拽位置（相对 image-wrapper）
const gridPanelX = ref<number | null>(null)  // null = 默认右上角
const gridPanelY = ref<number | null>(null)
const gridOpenUpward = ref(false)  // 是否向上展开

const PANEL_CONTENT_HEIGHT = 280  // 展开内容的估算高度 px
const HEADER_HEIGHT = 36

const gridPanelStyle = computed(() => {
  const base = gridPanelX.value === null
    ? { top: '10px', right: '10px' }
    : { top: `${gridPanelY.value}px`, left: `${gridPanelX.value}px`, right: 'auto' }
  // 向上展开时整体上移，让 header 保持在原位，内容向上生长
  if (gridOpenUpward.value && gridExpanded.value) {
    return { ...base, transform: `translateY(calc(-100% + ${HEADER_HEIGHT}px))` }
  }
  return base
})

let dragStartX = 0, dragStartY = 0, dragStartPX = 0, dragStartPY = 0
let isDragging = false

const onGridHeaderMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  const wrapper = wrapperRef.value
  if (!wrapper) return
  const wRect = wrapper.getBoundingClientRect()
  const panelEl = (e.currentTarget as HTMLElement).parentElement!
  const pRect = panelEl.getBoundingClientRect()
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartPX = pRect.left - wRect.left
  dragStartPY = pRect.top  - wRect.top
  isDragging = false

  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - dragStartX
    const dy = ev.clientY - dragStartY
    if (!isDragging && Math.hypot(dx, dy) > 3) isDragging = true
    if (!isDragging) return
    const wR = wrapper.getBoundingClientRect()
    const maxX = wR.width  - panelEl.offsetWidth
    const maxY = wR.height - HEADER_HEIGHT
    const newX = Math.max(0, Math.min(maxX, dragStartPX + dx))
    const newY = Math.max(0, Math.min(maxY, dragStartPY + dy))
    gridPanelX.value = newX
    gridPanelY.value = newY
    // 判断底部空间是否足够展开
    const spaceBelow = wR.height - (newY + HEADER_HEIGHT)
    gridOpenUpward.value = spaceBelow < PANEL_CONTENT_HEIGHT
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.userSelect = ''
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}

const onGridHeaderClick = () => {
  if (isDragging) return  // 拖拽结束不触发折叠
  gridExpanded.value = !gridExpanded.value
}

// 记录原图尺寸（第一次加载时确定，后续保持不变）
let canvasFixedWidth = 0
let canvasFixedHeight = 0

const drawSrc = (src: string) => {
  if (!src || !previewCanvas.value) return
  const canvas = previewCanvas.value
  const img = new Image()
  img.onload = () => {
    // 第一次加载时，记录原图尺寸作为 canvas 固定尺寸
    if (canvasFixedWidth === 0 || canvasFixedHeight === 0) {
      canvasFixedWidth = img.naturalWidth
      canvasFixedHeight = img.naturalHeight
    }

    // Canvas 内部尺寸始终使用固定的原图尺寸
    canvas.width  = canvasFixedWidth
    canvas.height = canvasFixedHeight

    // 将图片绘制到 canvas，如果是预览图（尺寸小于固定尺寸），会被拉伸填充
    // 这样预览图和原图的 canvas 尺寸完全一致，不会跳动
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvasFixedWidth, canvasFixedHeight)
    imageReady.value = true
    // 绘制完成后通知外部（用于裁切模式下重置缩放）
    onDrawComplete?.()
  }
  img.src = src
}

// imageSrc 变化时重置 imageReady 和固定尺寸，等新图绘制完成再置 true
watch(() => props.imageSrc, () => {
  imageReady.value = false
  canvasFixedWidth = 0
  canvasFixedHeight = 0
})

// 外部可注入的绘制完成回调（用一次后自动清除）
let onDrawComplete: (() => void) | null = null
const onceDrawComplete = (cb: () => void) => { onDrawComplete = () => { onDrawComplete = null; cb() } }

watch(
  [() => props.processedSrc, () => props.imageSrc],
  ([processed, original]) => { drawSrc(processed || original) },
  { immediate: true }
)

// ── 变换状态 ──────────────────────────────
const scale    = ref(1)
const offsetX  = ref(0)
const offsetY  = ref(0)
const isPanning = ref(false)

const resetTransform = () => { scale.value = 1; offsetX.value = 0; offsetY.value = 0 }

const handleDoubleClick = () => {
  if (!props.imageSrc || props.cropActive) return
  if (scale.value !== 1 || offsetX.value !== 0 || offsetY.value !== 0) resetTransform()
  else scale.value = 1.5
}

const handleWheel = (e: WheelEvent) => {
  if (!props.imageSrc) return

  const oldScale = scale.value
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  const newScale = Math.min(8, Math.max(0.2, parseFloat((oldScale + delta).toFixed(1))))
  if (newScale === oldScale) return

  // 鼠标相对于 image-wrapper 的位置
  const wrapper = wrapperRef.value
  if (!wrapper) { scale.value = newScale; return }
  const rect = wrapper.getBoundingClientRect()
  const mouseX = e.clientX - rect.left - rect.width  / 2  // 相对于容器中心
  const mouseY = e.clientY - rect.top  - rect.height / 2

  // 缩放后调整偏移，使鼠标指向的点保持不动
  // 公式：newOffset = mousePos - (mousePos - oldOffset) * (newScale / oldScale)
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / oldScale)
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / oldScale)
  scale.value = newScale
}

// ── 拖拽平移（蒙版激活时禁用） ────────────
let px = 0, py = 0, pox = 0, poy = 0, moved = false
const THRESHOLD = 4

const handleMouseDown = (e: MouseEvent) => {
  if (!props.imageSrc || e.button !== 0 || props.maskActive || props.cropActive) return
  e.preventDefault()
  px = e.clientX; py = e.clientY; pox = offsetX.value; poy = offsetY.value; moved = false
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}
const onMove = (e: MouseEvent) => {
  const dx = e.clientX - px, dy = e.clientY - py
  if (!moved && Math.hypot(dx, dy) > THRESHOLD) { moved = true; isPanning.value = true; document.body.style.cursor = 'grabbing' }
  if (moved) { offsetX.value = pox + dx; offsetY.value = poy + dy }
}
const onUp = () => {
  isPanning.value = false; moved = false
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  document.body.style.cursor = ''; document.body.style.userSelect = ''
}

// ── 蒙版画笔事件透传 ──────────────────────
// （MaskCanvas 直接操作 internalCanvas，只需透传 commit）

const onKey = (e: KeyboardEvent) => {
  if (props.transformPending) {
    if (e.key === 'Enter')  { e.preventDefault(); emit('transform:confirm') }
    if (e.key === 'Escape') { e.preventDefault(); emit('transform:cancel') }
    return
  }
  if (e.key === 'Escape') resetTransform()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
})

// ── 文件拖拽上传 ──────────────────────────
const isDragOver  = ref(false)
const dragCounter = ref(0)

const handleDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.value++; isDragOver.value = true }
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation()
  if (--dragCounter.value <= 0) { dragCounter.value = 0; isDragOver.value = false }
}
const handleDragOver = (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation()
  if (!isDragOver.value) { isDragOver.value = true; dragCounter.value = 1 }
}
const handleDrop = (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation()
  isDragOver.value = false; dragCounter.value = 0
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (!files.length) return
  if (files.length > 10) { alert(`一次最多上传 10 张，当前 ${files.length} 张`); return }
  files.forEach(f => {
    if (['image/jpeg','image/jpg','image/png','image/gif'].includes(f.type)) emit('upload:image', f)
    else alert(`${f.name} 不是有效图片格式`)
  })
}

// ── 裁切提交 ──────────────────────────────────────────────────
const onCropCommit = (rect: { x: number; y: number; w: number; h: number }) => {
  emit('crop:commit', rect)
}

defineExpose({ previewCanvas, resetTransform, onceDrawComplete })
</script>

<style scoped>
.image-preview-area {
  display: flex; align-items: center; justify-content: center;
  padding: 2vh 2vw; position: relative;
  overflow: hidden;
  border: 2px dashed transparent; border-radius: 8px;
}
.image-preview-area:not(.has-image):hover { background: rgba(255,255,255,0.05); }
.image-preview-area.drag-over { background: rgba(0,0,0,0.3); }

.drag-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6); z-index: 5; pointer-events: none;
}

.image-wrapper {
  position: relative; display: flex;
  align-items: center; justify-content: center;
  width: 100%; height: 100%; overflow: visible;
}

/* canvas 用 CSS 适应容器，内部像素不变 */
.image-wrapper canvas {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
  transform-origin: center center;
  user-select: none; display: block;
  will-change: transform;
}

.scale-indicator {
  position: absolute; top: 10px; left: 10px;
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.55); color: #fff;
  font-size: 12px; font-family: 'Courier New', monospace;
  padding: 4px 10px; border-radius: 20px;
  pointer-events: auto; z-index: 20; user-select: none;
}
.reset-btn {
  background: rgba(255,255,255,0.15); border: none;
  color: rgba(255,255,255,0.8); font-size: 11px;
  padding: 2px 8px; border-radius: 10px;
  cursor: pointer; outline: none; transition: background 0.15s;
}
.reset-btn:hover { background: rgba(255,255,255,0.28); }

.upload-area {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; color: #aaa;
  user-select: none; width: 100%; height: 100%;
}
.upload-content {
  padding: 40px 60px; border: 2px dashed transparent;
  border-radius: 12px; transition: all 0.2s;
}
.upload-area:hover .upload-content {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.03);
}
.upload-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.7; }
.upload-text .primary-text { font-size: 18px; margin-bottom: 8px; color: #ccc; }
.upload-text .secondary-text { font-size: 14px; color: #888; }

.drag-overlay {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 300px; height: 200px;
  background: rgba(80,80,80,0.85);
  border: 2px dashed rgba(255,255,255,0.8);
  border-radius: 8px; display: flex;
  align-items: center; justify-content: center;
  z-index: 10; pointer-events: none;
}
.drag-content { text-align: center; color: rgba(255,255,255,0.8); font-weight: bold; }
.drag-content p { font-size: 16px; margin: 0; }

/* 裁切操作栏：悬浮在预览区底部，不受 crop-root 裁剪 */
.crop-toolbar {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(20, 22, 26, 0.92);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 7px 14px;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  z-index: 35;
  user-select: none;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.crop-size {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
  min-width: 90px;
  text-align: center;
}
.crop-btn-cancel, .crop-btn-apply {
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}
.crop-btn-cancel { background: rgba(255,255,255,0.08); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1); }
.crop-btn-cancel:hover { background: rgba(255,255,255,0.14); color: #c4c9d4; }
.crop-btn-apply { background: #5b6af0; color: #fff; }
.crop-btn-apply:hover { background: #6b7af8; }

/* 网格线悬浮面板 */
.grid-float-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 40;
  width: 220px;
  background: rgba(20, 22, 26, 0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 向上展开：内容在 header 上方，整体从 header 向上生长 */
.grid-float-panel.open-upward {
  flex-direction: column-reverse;
}

.grid-float-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  transition: background 0.15s;
}
.grid-float-header:hover { background: rgba(255,255,255,0.04); }
.grid-float-header:active { cursor: grabbing; }

.grid-float-title {
  font-size: 11px; font-weight: 600;
  color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;
}

.grid-float-arrow {
  color: #6b7280; transition: transform 0.2s;
}
.grid-float-arrow.collapsed { transform: rotate(-90deg); }

.grid-float-content {
  padding: 10px;
}
</style>
