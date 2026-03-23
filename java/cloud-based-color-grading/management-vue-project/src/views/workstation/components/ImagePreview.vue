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
          cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          transition: isPanning ? 'none' : 'transform 0.2s ease',
        }"
        @dblclick="handleDoubleClick"
        @mousedown="handleMouseDown"
      />

      <!-- 蒙版交互层 -->
      <MaskCanvas
        v-if="!!imageSrc"
        :active="maskActive"
        :layer="maskLayer"
        :showOverlay="maskShowOverlay"
        :imageCanvas="previewCanvas"
        @update:layer="emit('mask:updateLayer', $event)"
        @commit="emit('mask:commit')"
      />

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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import MaskCanvas from './MaskCanvas.vue'
import type { MaskLayer } from '../composables/useMaskState'

interface ImagePreviewProps {
  imageSrc: string
  processedSrc: string
  showUploadTips: boolean
  galleryHeight: number
  maskActive: boolean
  maskLayer: MaskLayer
  maskShowOverlay: boolean
  maskInternalCanvas: HTMLCanvasElement | null
}
interface ImagePreviewEvents {
  'upload:image': [file: File]
  'mask:commit': []
  'mask:updateLayer': [layer: MaskLayer]
}

const props = defineProps<ImagePreviewProps>()
const emit  = defineEmits<ImagePreviewEvents>()

const previewCanvas = ref<HTMLCanvasElement | null>(null)

const drawSrc = (src: string) => {
  if (!src || !previewCanvas.value) return
  const canvas = previewCanvas.value
  const img = new Image()
  img.onload = () => {
    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
  }
  img.src = src
}

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
  if (!props.imageSrc) return
  if (scale.value !== 1 || offsetX.value !== 0 || offsetY.value !== 0) resetTransform()
  else scale.value = 1.5
}

const handleWheel = (e: WheelEvent) => {
  if (!props.imageSrc) return
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  scale.value = Math.min(4, Math.max(0.2, parseFloat((scale.value + delta).toFixed(1))))
}

// ── 拖拽平移（蒙版激活时禁用） ────────────
let px = 0, py = 0, pox = 0, poy = 0, moved = false
const THRESHOLD = 4

const handleMouseDown = (e: MouseEvent) => {
  if (!props.imageSrc || e.button !== 0 || scale.value <= 1 || props.maskActive) return
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

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') resetTransform() }
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

defineExpose({ previewCanvas, resetTransform })
</script>

<style scoped>
.image-preview-area {
  display: flex; align-items: center; justify-content: center;
  padding: 2vh 2vw; position: relative;
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
  width: 100%; height: 100%; overflow: hidden;
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
</style>
