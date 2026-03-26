<template>
  <div v-if="show" class="crop-root" :style="rootStyle" @mousedown.self="onRootDown">
    <div class="shade" :style="shadeTop"/>
    <div class="shade" :style="shadeBottom"/>
    <div class="shade" :style="shadeLeft"/>
    <div class="shade" :style="shadeRight"/>

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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{ show: boolean; canvas: HTMLCanvasElement | null; ratio: number | null; initialRect?: { x: number; y: number; w: number; h: number } | null }>()
const emit = defineEmits<{ commit: [rect: { x: number; y: number; w: number; h: number }]; cancel: [] }>()

// canvas 在父容器中的 CSS 位置和尺寸（随缩放实时变化）
const cr = ref({ left: 0, top: 0, w: 0, h: 0 })

const syncRect = () => {
  if (!props.canvas) return
  const rect   = props.canvas.getBoundingClientRect()
  const parent = props.canvas.parentElement!.getBoundingClientRect()
  cr.value = { left: rect.left - parent.left, top: rect.top - parent.top, w: rect.width, h: rect.height }
}

// ── 裁切框用比例坐标存储（0~1），与缩放无关 ──────────────────
// 这样图片缩放时只需更新 cr，框自动跟随，不需要重新计算
const box = ref({ rx: 0, ry: 0, rw: 1, rh: 1 })  // 相对比例

// 比例 → CSS px（用于渲染）
const bx = computed(() => box.value.rx * cr.value.w)
const by = computed(() => box.value.ry * cr.value.h)
const bw = computed(() => box.value.rw * cr.value.w)
const bh = computed(() => box.value.rh * cr.value.h)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN_R = 0.01  // 最小比例（约 1% 的图片尺寸）

const initBox = () => {
  const { w: W, h: H } = cr.value
  if (W <= 0 || H <= 0) return

  // 如果有上次的裁切区域，用原图像素坐标还原为比例坐标
  if (props.initialRect && props.canvas && props.canvas.width > 0) {
    const natW = props.canvas.width
    const natH = props.canvas.height
    box.value = {
      rx: props.initialRect.x / natW,
      ry: props.initialRect.y / natH,
      rw: props.initialRect.w / natW,
      rh: props.initialRect.h / natH,
    }
    return
  }

  // 默认：全图初始化（带 padding，按比例适配）
  const pad = 20
  let bwPx = W - pad * 2, bhPx = H - pad * 2
  if (props.ratio !== null) {
    bhPx = bwPx / props.ratio
    if (bhPx > H - pad * 2) { bhPx = H - pad * 2; bwPx = bhPx * props.ratio }
  }
  box.value = {
    rx: (W - bwPx) / 2 / W,
    ry: (H - bhPx) / 2 / H,
    rw: bwPx / W,
    rh: bhPx / H,
  }
}

watch(() => props.show, async v => {
  if (!v) { stopPositionPoll(); return }
  await nextTick()
  syncRect()
  initBox()
  if (props.canvas) attachObserver()
  startPositionPoll()
})

watch(() => props.ratio, async r => {
  if (!props.show) return
  await nextTick()
  syncRect()
  const { w: W, h: H } = cr.value
  if (W <= 0 || H <= 0 || r === null) return
  // 以当前框中心为基准重新计算
  const cx = box.value.rx + box.value.rw / 2
  const cy = box.value.ry + box.value.rh / 2
  let rw = box.value.rw
  let rh = rw * (W / H) / r  // 转换为比例空间的高
  // 边界检查
  if (rh > 1) { rh = 1; rw = rh * r * (H / W) }
  if (rw > 1) { rw = 1; rh = rw / r * (W / H) }
  box.value = {
    rx: clamp(cx - rw / 2, 0, 1 - rw),
    ry: clamp(cy - rh / 2, 0, 1 - rh),
    rw, rh,
  }
})

// 原图像素尺寸（toolbar 显示）
const pixelW = computed(() => {
  if (!props.canvas || cr.value.w <= 0) return 0
  return Math.round(box.value.rw * props.canvas.width)
})
const pixelH = computed(() => {
  if (!props.canvas || cr.value.h <= 0) return 0
  return Math.round(box.value.rh * props.canvas.height)
})

const rootStyle = computed(() => ({
  position: 'absolute' as const,
  left:   `${cr.value.left}px`,
  top:    `${cr.value.top}px`,
  width:  `${cr.value.w}px`,
  height: `${cr.value.h}px`,
  zIndex: 25,
  pointerEvents: 'none' as const,
}))

const shadeTop    = computed(() => ({ left: '0', top: '0', width: '100%', height: `${by.value}px` }))
const shadeBottom = computed(() => ({ left: '0', top: `${by.value + bh.value}px`, width: '100%', height: `${cr.value.h - by.value - bh.value}px` }))
const shadeLeft   = computed(() => ({ left: '0', top: `${by.value}px`, width: `${bx.value}px`, height: `${bh.value}px` }))
const shadeRight  = computed(() => ({ left: `${bx.value + bw.value}px`, top: `${by.value}px`, width: `${cr.value.w - bx.value - bw.value}px`, height: `${bh.value}px` }))

const boxStyle = computed(() => ({
  left:   `${bx.value}px`,
  top:    `${by.value}px`,
  width:  `${bw.value}px`,
  height: `${bh.value}px`,
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

// 双重监听：canvas 尺寸变化时重新同步（重置裁切框）
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

// 位置轮询：面板拖拽/图片缩放时 canvas 位置变化，每帧同步 cr（不重置裁切框）
let posRafId = 0
const startPositionPoll = () => {
  const poll = () => {
    if (!props.show || !props.canvas) return
    const rect   = props.canvas.getBoundingClientRect()
    const parent = props.canvas.parentElement?.getBoundingClientRect()
    if (parent) {
      const newLeft = rect.left - parent.left
      const newTop  = rect.top  - parent.top
      const newW    = rect.width
      const newH    = rect.height
      if (
        Math.abs(newLeft - cr.value.left) > 0.5 ||
        Math.abs(newTop  - cr.value.top)  > 0.5 ||
        Math.abs(newW    - cr.value.w)    > 0.5 ||
        Math.abs(newH    - cr.value.h)    > 0.5
      ) {
        cr.value = { left: newLeft, top: newTop, w: newW, h: newH }
      }
    }
    posRafId = requestAnimationFrame(poll)
  }
  posRafId = requestAnimationFrame(poll)
}
const stopPositionPoll = () => cancelAnimationFrame(posRafId)

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

// 拖拽（操作比例坐标）
type DragMode = 'move'|'tl'|'tc'|'tr'|'ml'|'mr'|'bl'|'bc'|'br'
let mode: DragMode = 'move'
let sx = 0, sy = 0
let sb = { rx: 0, ry: 0, rw: 0, rh: 0 }

const startDrag = (e: MouseEvent, m: DragMode) => {
  mode = m; sx = e.clientX; sy = e.clientY; sb = { ...box.value }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}
const onBoxDown = (e: MouseEvent) => startDrag(e, 'move')
const onHandleDown = (e: MouseEvent, id: string) => startDrag(e, id as DragMode)

const onRootDown = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const px = (e.clientX - rect.left) / cr.value.w
  const py = (e.clientY - rect.top)  / cr.value.h
  box.value = { rx: px, ry: py, rw: MIN_R, rh: MIN_R }
  sb = { rx: px, ry: py, rw: 0, rh: 0 }
  sx = e.clientX; sy = e.clientY
  mode = 'br'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.userSelect = 'none'
}

const onMove = (e: MouseEvent) => {
  // 鼠标位移转换为比例增量
  const drx = (e.clientX - sx) / cr.value.w
  const dry = (e.clientY - sy) / cr.value.h
  const r   = props.ratio
  const W   = cr.value.w, H = cr.value.h
  let { rx, ry, rw, rh } = sb
  let nx = rx, ny = ry, nw = rw, nh = rh

  if (mode === 'move') {
    box.value = { rx: clamp(rx+drx, 0, 1-rw), ry: clamp(ry+dry, 0, 1-rh), rw, rh }
    return
  }

  if (mode==='tl') { nx=rx+drx; nw=rw-drx; ny=ry+dry; nh=rh-dry }
  else if (mode==='tc') { ny=ry+dry; nh=rh-dry }
  else if (mode==='tr') { nw=rw+drx; ny=ry+dry; nh=rh-dry }
  else if (mode==='ml') { nx=rx+drx; nw=rw-drx }
  else if (mode==='mr') { nw=rw+drx }
  else if (mode==='bl') { nx=rx+drx; nw=rw-drx; nh=rh+dry }
  else if (mode==='bc') { nh=rh+dry }
  else if (mode==='br') { nw=rw+drx; nh=rh+dry }

  // 固定比例：以 nw 为基准，转换为比例空间的 nh
  if (r !== null) {
    nh = nw * (W / H) / r
    if (['tl','tc','tr'].includes(mode)) ny = ry + rh - nh
    if (['tl','ml','bl'].includes(mode)) nx = rx + rw - nw
  }

  // 最小尺寸
  if (nw < MIN_R) { nw=MIN_R; if(r!==null) nh=nw*(W/H)/r; if(['tl','ml','bl'].includes(mode)) nx=rx+rw-MIN_R }
  if (nh < MIN_R) { nh=MIN_R; if(r!==null) nw=nh*r*(H/W); if(['tl','tc','tr'].includes(mode)) ny=ry+rh-MIN_R }

  // 边界约束
  nx = clamp(nx, 0, 1 - MIN_R)
  ny = clamp(ny, 0, 1 - MIN_R)
  nw = clamp(nw, MIN_R, 1 - nx)
  nh = clamp(nh, MIN_R, 1 - ny)
  if (r !== null) {
    if (nw * (W/H) / r > 1 - ny) { nh = 1 - ny; nw = nh * r * (H/W) }
    if (nh * r * (H/W) > 1 - nx) { nw = 1 - nx; nh = nw * (W/H) / r }
    nw = clamp(nw, MIN_R, 1 - nx)
    nh = clamp(nh, MIN_R, 1 - ny)
  }

  box.value = { rx: nx, ry: ny, rw: nw, rh: nh }
}

const onUp = () => {
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  document.body.style.userSelect = ''
}

const doCommit = () => {
  if (!props.canvas) return
  emit('commit', {
    x: Math.round(box.value.rx * props.canvas.width),
    y: Math.round(box.value.ry * props.canvas.height),
    w: Math.round(box.value.rw * props.canvas.width),
    h: Math.round(box.value.rh * props.canvas.height),
  })
}

const onKey = (e: KeyboardEvent) => {
  if (!props.show) return
  if (e.key === 'Enter')  doCommit()
  if (e.key === 'Escape') emit('cancel')
}

defineExpose({ doCommit, pixelW, pixelH })

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (props.canvas && props.show) {
    attachObserver()
    startPositionPoll()
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  cancelAnimationFrame(rafId)
  stopPositionPoll()
  ro?.disconnect(); mo?.disconnect()
})
</script>

<style scoped>
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

</style>
