<template>
  <!-- crop-root 严格覆盖 canvas 区域，不超出图片边界 -->
  <div v-if="show" class="crop-root" :style="rootStyle" @mousedown.self="onRootDown">
    <!-- 四块遮罩（坐标相对 crop-root，即相对 canvas） -->
    <div class="shade" :style="shadeTop"/>
    <div class="shade" :style="shadeBottom"/>
    <div class="shade" :style="shadeLeft"/>
    <div class="shade" :style="shadeRight"/>

    <!-- 裁切框（坐标相对 crop-root） -->
    <div class="crop-box" :style="boxStyle" @mousedown.stop="onBoxDown">
      <div class="gl gl-v" style="left:33.33%"/>
      <div class="gl gl-v" style="left:66.66%"/>
      <div class="gl gl-h" style="top:33.33%"/>
      <div class="gl gl-h" style="top:66.66%"/>
      <div class="box-border"/>
      <div class="corner c-tl"/><div class="corner c-tr"/>
      <div class="corner c-bl"/><div class="corner c-br"/>
      <div v-for="h in visibleHandles" :key="h.id" class="handle" :style="h.style" @mousedown.stop="onHandleDown($event, h.id)"/>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <span class="size-hint">{{ Math.round(box.w) }} x {{ Math.round(box.h) }}</span>
      <button class="btn-cancel" @click="emit('cancel')">取消</button>
      <button class="btn-apply" @click="doCommit">应用</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{ show: boolean; canvas: HTMLCanvasElement | null; ratio: number | null }>()
const emit = defineEmits<{ commit: [rect: { x: number; y: number; w: number; h: number }]; cancel: [] }>()

// canvas 在父容器中的 CSS 位置和尺寸
const cr = ref({ left: 0, top: 0, w: 0, h: 0 })

const syncRect = () => {
  if (!props.canvas) return
  const rect   = props.canvas.getBoundingClientRect()
  const parent = props.canvas.parentElement!.getBoundingClientRect()
  cr.value = { left: rect.left - parent.left, top: rect.top - parent.top, w: rect.width, h: rect.height }
}

// crop-root 直接覆盖 canvas，严格限制在图片边界内
const rootStyle = computed(() => ({
  position: 'absolute' as const,
  left:   `${cr.value.left}px`,
  top:    `${cr.value.top}px`,
  width:  `${cr.value.w}px`,
  height: `${cr.value.h}px`,
  zIndex: 25,
  pointerEvents: 'none' as const,
}))

// 裁切框（相对 crop-root / canvas 左上角）
const box = ref({ x: 0, y: 0, w: 100, h: 100 })
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN = 20

const initBox = () => {
  const { w: W, h: H } = cr.value
  if (W <= 0 || H <= 0) return
  const pad = 20
  let bw = W - pad * 2, bh = H - pad * 2
  if (props.ratio !== null) {
    bh = bw / props.ratio
    if (bh > H - pad * 2) { bh = H - pad * 2; bw = bh * props.ratio }
  }
  box.value = { x: (W - bw) / 2, y: (H - bh) / 2, w: bw, h: bh }
}

watch(() => props.show, async v => {
  if (!v) return
  await nextTick()
  syncRect()
  initBox()
  if (props.canvas) attachObserver()
})

watch(() => props.ratio, async r => {
  if (!props.show) return
  await nextTick()
  syncRect()
  const { w: W, h: H } = cr.value
  if (W <= 0 || H <= 0 || r === null) return
  const cx = box.value.x + box.value.w / 2, cy = box.value.y + box.value.h / 2
  let bw = box.value.w, bh = bw / r
  if (bh > H) { bh = H; bw = bh * r }
  if (bw > W) { bw = W; bh = bw / r }
  box.value = { x: clamp(cx - bw / 2, 0, W - bw), y: clamp(cy - bh / 2, 0, H - bh), w: bw, h: bh }
})

// 遮罩四块（坐标相对 crop-root，即相对 canvas）
const shadeTop    = computed(() => ({ left: '0', top: '0', width: '100%', height: `${box.value.y}px` }))
const shadeBottom = computed(() => ({ left: '0', top: `${box.value.y + box.value.h}px`, width: '100%', height: `${cr.value.h - box.value.y - box.value.h}px` }))
const shadeLeft   = computed(() => ({ left: '0', top: `${box.value.y}px`, width: `${box.value.x}px`, height: `${box.value.h}px` }))
const shadeRight  = computed(() => ({ left: `${box.value.x + box.value.w}px`, top: `${box.value.y}px`, width: `${cr.value.w - box.value.x - box.value.w}px`, height: `${box.value.h}px` }))

const boxStyle = computed(() => ({
  left:   `${box.value.x}px`,
  top:    `${box.value.y}px`,
  width:  `${box.value.w}px`,
  height: `${box.value.h}px`,
}))

const allHandles = [
  { id: 'tl', style: { top: '-5px', left: '-5px', cursor: 'nwse-resize' } },
  { id: 'tc', style: { top: '-5px', left: 'calc(50% - 5px)', cursor: 'ns-resize' } },
  { id: 'tr', style: { top: '-5px', right: '-5px', cursor: 'nesw-resize' } },
  { id: 'ml', style: { top: 'calc(50% - 5px)', left: '-5px', cursor: 'ew-resize' } },
  { id: 'mr', style: { top: 'calc(50% - 5px)', right: '-5px', cursor: 'ew-resize' } },
  { id: 'bl', style: { bottom: '-5px', left: '-5px', cursor: 'nesw-resize' } },
  { id: 'bc', style: { bottom: '-5px', left: 'calc(50% - 5px)', cursor: 'ns-resize' } },
  { id: 'br', style: { bottom: '-5px', right: '-5px', cursor: 'nwse-resize' } },
]
const visibleHandles = computed(() =>
  props.ratio !== null ? allHandles.filter(h => ['tl','tr','bl','br'].includes(h.id)) : allHandles
)

// 双重监听：canvas 尺寸变化时重新同步
let ro: ResizeObserver | null = null
let mo: MutationObserver | null = null
let rafId = 0

const onCanvasChanged = () => {
  if (!props.show) return
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncRect()
      initBox()
    })
  })
}

const attachObserver = () => {
  if (!props.canvas) return
  ro?.disconnect(); mo?.disconnect()
  mo = new MutationObserver(onCanvasChanged)
  mo.observe(props.canvas, { attributes: true, attributeFilter: ['width', 'height'] })
  ro = new ResizeObserver(onCanvasChanged)
  ro.observe(props.canvas)
}

watch(() => props.canvas, (c) => {
  ro?.disconnect(); mo?.disconnect()
  if (c && props.show) attachObserver()
})

// 拖拽
type DragMode = 'move'|'tl'|'tc'|'tr'|'ml'|'mr'|'bl'|'bc'|'br'
let mode: DragMode = 'move', sx = 0, sy = 0, sb = { x: 0, y: 0, w: 0, h: 0 }

const startDrag = (e: MouseEvent, m: DragMode) => {
  mode = m; sx = e.clientX; sy = e.clientY; sb = { ...box.value }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}
const onBoxDown = (e: MouseEvent) => startDrag(e, 'move')
const onHandleDown = (e: MouseEvent, id: string) => startDrag(e, id as DragMode)

// 在 crop-root（即 canvas 区域）内重新绘制裁切框
const onRootDown = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const sx_ = e.clientX - rect.left
  const sy_ = e.clientY - rect.top
  box.value = { x: sx_, y: sy_, w: MIN, h: MIN }
  sb = { x: sx_, y: sy_, w: 0, h: 0 }
  sx = e.clientX; sy = e.clientY
  mode = 'br'  // 从右下角开始拖拽
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}

const onMove = (e: MouseEvent) => {
  const dx = e.clientX - sx, dy = e.clientY - sy
  const { w: W, h: H } = cr.value, r = props.ratio
  let { x, y, w, h } = sb, nx = x, ny = y, nw = w, nh = h

  if (mode === 'move') { box.value = { x: clamp(x+dx,0,W-w), y: clamp(y+dy,0,H-h), w, h }; return }

  if (mode==='tl') { nx=x+dx; nw=w-dx; ny=y+dy; nh=h-dy }
  else if (mode==='tc') { ny=y+dy; nh=h-dy }
  else if (mode==='tr') { nw=w+dx; ny=y+dy; nh=h-dy }
  else if (mode==='ml') { nx=x+dx; nw=w-dx }
  else if (mode==='mr') { nw=w+dx }
  else if (mode==='bl') { nx=x+dx; nw=w-dx; nh=h+dy }
  else if (mode==='bc') { nh=h+dy }
  else if (mode==='br') { nw=w+dx; nh=h+dy }

  if (r !== null) {
    nh = nw / r
    if (['tl','tc','tr'].includes(mode)) ny = y + h - nh
    if (['tl','ml','bl'].includes(mode)) nx = x + w - nw
  }

  if (nw < MIN) { nw=MIN; if(r!==null) nh=nw/r; if(['tl','ml','bl'].includes(mode)) nx=x+w-MIN }
  if (nh < MIN) { nh=MIN; if(r!==null) nw=nh*r; if(['tl','tc','tr'].includes(mode)) ny=y+h-MIN }

  // 先约束位置，再约束尺寸，确保 x+w<=W 且 y+h<=H（不超出图片边界）
  nx = clamp(nx, 0, W - MIN)
  ny = clamp(ny, 0, H - MIN)
  nw = clamp(nw, MIN, W - nx)
  nh = clamp(nh, MIN, H - ny)
  // 固定比例时，尺寸被边界截断后需要同步另一轴
  if (r !== null) {
    if (nw / r > H - ny) { nh = H - ny; nw = nh * r }
    if (nh * r > W - nx) { nw = W - nx; nh = nw / r }
    nw = clamp(nw, MIN, W - nx)
    nh = clamp(nh, MIN, H - ny)
  }
  box.value = { x: nx, y: ny, w: nw, h: nh }
}

const onUp = () => {
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  document.body.style.userSelect = ''
}

const doCommit = () => {
  if (!props.canvas) return
  const scaleX = props.canvas.width / cr.value.w
  const scaleY = props.canvas.height / cr.value.h
  emit('commit', {
    x: Math.round(box.value.x * scaleX),
    y: Math.round(box.value.y * scaleY),
    w: Math.round(box.value.w * scaleX),
    h: Math.round(box.value.h * scaleY),
  })
}

const onKey = (e: KeyboardEvent) => {
  if (!props.show) return
  if (e.key === 'Enter')  doCommit()
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (props.canvas && props.show) attachObserver()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  cancelAnimationFrame(rafId)
  ro?.disconnect(); mo?.disconnect()
})
</script>

<style scoped>
/* crop-root 由 rootStyle 动态定位，严格等于 canvas 的位置和尺寸 */
.crop-root { overflow: hidden; }

.shade { position: absolute; background: rgba(0,0,0,0.55); pointer-events: auto; }
.crop-box { position: absolute; box-sizing: border-box; cursor: move; pointer-events: auto; }
.box-border { position: absolute; inset: 0; border: 1px solid rgba(255,255,255,0.9); pointer-events: none; }
.gl { position: absolute; background: rgba(255,255,255,0.22); pointer-events: none; }
.gl-v { width: 1px; top: 0; bottom: 0; }
.gl-h { height: 1px; left: 0; right: 0; }
.handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid rgba(0,0,0,0.35); border-radius: 2px; z-index: 2; pointer-events: auto; }
.corner { position: absolute; width: 14px; height: 14px; pointer-events: none; z-index: 3; }
.corner::before, .corner::after { content: ''; position: absolute; background: #fff; }
.corner::before { width: 14px; height: 2px; }
.corner::after { width: 2px; height: 14px; }
.c-tl { top: -1px; left: -1px; } .c-tl::before { top: 0; left: 0; } .c-tl::after { top: 0; left: 0; }
.c-tr { top: -1px; right: -1px; } .c-tr::before { top: 0; right: 0; } .c-tr::after { top: 0; right: 0; }
.c-bl { bottom: -1px; left: -1px; } .c-bl::before { bottom: 0; left: 0; } .c-bl::after { bottom: 0; left: 0; }
.c-br { bottom: -1px; right: -1px; } .c-br::before { bottom: 0; right: 0; } .c-br::after { bottom: 0; right: 0; }
.toolbar { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; background: rgba(20,22,26,0.88); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 12px; pointer-events: auto; backdrop-filter: blur(6px); z-index: 10; user-select: none; }
.size-hint { font-size: 11px; color: #9ca3af; font-family: 'Courier New', monospace; min-width: 80px; text-align: center; }
.btn-cancel, .btn-apply { padding: 4px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
.btn-cancel { background: rgba(255,255,255,0.08); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1); }
.btn-cancel:hover { background: rgba(255,255,255,0.14); color: #c4c9d4; }
.btn-apply { background: #5b6af0; color: #fff; }
.btn-apply:hover { background: #6b7af8; }
</style>
