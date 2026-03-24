<template>
  <template v-if="active && imageCanvas">
    <!-- overlay 预览层（最底，仅显示） -->
    <canvas
      v-if="showOverlay"
      ref="overlayEl"
      class="mask-overlay"
      :style="overlayStyle"
    />

    <!-- 手柄层（在交互层之上，直接捕获鼠标） -->
    <template v-if="showOverlay && layer">
      <div
        v-for="h in handles" :key="h.id"
        class="handle"
        :class="h.id"
        :style="handleStyle(h)"
        @mousedown.prevent.stop="startHandleDrag($event, h.id)"
      >
        <div class="handle-inner" :style="{ background: h.color }" />
      </div>
    </template>

    <!-- 交互层（最上，捕获空白区域的新建拖拽） -->
    <div
      class="mask-interact"
      :style="interactStyle"
      @mousedown.prevent="onBgDown"
      @mousemove="onBgMove"
      @mouseup="onBgUp"
      @mouseleave="onBgLeave"
      @touchstart.prevent="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend.prevent="onTouchEnd"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { MaskLayer, LinearMaskParams, RadialMaskParams } from '../composables/useMaskState'

interface Props {
  active: boolean
  layer: MaskLayer | null
  showOverlay: boolean
  imageCanvas: HTMLCanvasElement | null
  /** 裁剪容器（image-wrapper），overlay 不超出此范围 */
  clipContainer?: HTMLElement | null
  imgScale: number
  imgOffsetX: number
  imgOffsetY: number
}
interface Emits {
  'update:layer': [layer: MaskLayer]
  'commit': []
}

const props = defineProps<Props>()
const emit  = defineEmits<Emits>()

const overlayEl = ref<HTMLCanvasElement | null>(null)

// ── 定位 ──────────────────────────────────────────────────────────────
const imgRect    = ref<DOMRect | null>(null)  // canvas 实际屏幕 rect（可能超出容器）
const clipRect   = ref<DOMRect | null>(null)  // canvas 与容器的交集（用于 overlay/交互层）

const updateRect = () => {
  if (!props.imageCanvas) { imgRect.value = null; clipRect.value = null; return }
  const cr = props.imageCanvas.getBoundingClientRect()
  imgRect.value = cr

  // 与容器取交集，限制 overlay 不超出预览区
  const container = props.clipContainer
  if (container) {
    const br = container.getBoundingClientRect()
    const left   = Math.max(cr.left,   br.left)
    const top    = Math.max(cr.top,    br.top)
    const right  = Math.min(cr.right,  br.right)
    const bottom = Math.min(cr.bottom, br.bottom)
    if (right > left && bottom > top) {
      clipRect.value = new DOMRect(left, top, right - left, bottom - top)
    } else {
      clipRect.value = null
    }
  } else {
    clipRect.value = cr
  }
}

let ro: ResizeObserver | null = null
watch(() => props.imageCanvas, () => {
  ro?.disconnect()
  if (!props.imageCanvas) return
  ro = new ResizeObserver(updateRect)
  ro.observe(props.imageCanvas)
  updateRect()
}, { immediate: true })

watch(() => props.active, v => { if (v) nextTick(() => { updateRect(); redrawOverlay() }) })

// 图片缩放/平移时实时更新 rect（CSS transform 不触发 ResizeObserver）
watch(
  [() => props.imgScale, () => props.imgOffsetX, () => props.imgOffsetY],
  () => { nextTick(() => { updateRect(); redrawOverlay() }) }
)

onMounted(() => {
  window.addEventListener('scroll', updateRect, true)
  window.addEventListener('resize', updateRect)
})
onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('scroll', updateRect, true)
  window.removeEventListener('resize', updateRect)
  cleanupHandleDrag()
})

// ── 样式 ──────────────────────────────────────────────────────────────
const overlayStyle = computed(() => {
  const r = clipRect.value
  if (!r) return { display: 'none' }
  return {
    position: 'fixed' as const,
    left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`,
    zIndex: 9, pointerEvents: 'none' as const,
    overflow: 'hidden' as const,
  }
})

// 交互层：覆盖裁剪后区域，zIndex 低于手柄
const interactStyle = computed(() => {
  const r = clipRect.value
  if (!r) return { display: 'none' }
  return {
    position: 'fixed' as const,
    left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`,
    cursor: 'crosshair', zIndex: 10,
    pointerEvents: 'auto' as const,
  }
})

// ── 坐标工具 ──────────────────────────────────────────────────────────
// 始终基于完整图片 rect 归一化，保证蒙版参数与图片像素对应
const toNorm = (clientX: number, clientY: number) => {
  const r = imgRect.value!
  return {
    nx: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
    ny: Math.max(0, Math.min(1, (clientY - r.top)  / r.height)),
  }
}

// ── 新建拖拽（背景层） ────────────────────────────────────────────────
let bgDragging = false
let bgStartNX = 0, bgStartNY = 0

const onBgDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  updateRect()
  const { nx, ny } = toNorm(e.clientX, e.clientY)

  // 径向蒙版：判断点击是否在椭圆内 → 内部拖动整体，外部新建
  if (props.layer?.type === 'radial' && imgRect.value) {
    const l = props.layer
    const r = imgRect.value
    const a = l.radial.angle ?? 0
    const cosA = Math.cos(a), sinA = Math.sin(a)
    // 转到椭圆本地坐标系（像素）
    const dxPx = (nx - l.radial.cx) * r.width
    const dyPx = (ny - l.radial.cy) * r.height
    const localX = dxPx * cosA + dyPx * sinA
    const localY = -dxPx * sinA + dyPx * cosA
    const rxPx = l.radial.rx * r.width
    const ryPx = l.radial.ry * r.height
    const inside = (localX / rxPx) ** 2 + (localY / ryPx) ** 2 <= 1

    if (inside) {
      // 内部：当作 center 手柄拖动
      handleId = 'center'
      handleDragging = true
      handleOffsetNX = nx - l.radial.cx
      handleOffsetNY = ny - l.radial.cy
      document.addEventListener('mousemove', onHandleMove)
      document.addEventListener('mouseup', onHandleUp)
      return
    }
  }

  bgDragging = true
  bgStartNX = nx; bgStartNY = ny
  applyNewDrag(nx, ny, true)
}
const onBgMove = (e: MouseEvent) => {
  if (!bgDragging) return
  const { nx, ny } = toNorm(e.clientX, e.clientY)
  applyNewDrag(nx, ny, false)
}
const onBgUp = (e: MouseEvent) => {
  if (!bgDragging) return
  bgDragging = false
  const { nx, ny } = toNorm(e.clientX, e.clientY)
  applyNewDrag(nx, ny, false)
  emit('commit')
}
const onBgLeave = () => {
  if (!bgDragging) return
  bgDragging = false
  emit('commit')
}

// 触摸（新建）
const onTouchStart = (e: TouchEvent) => {
  updateRect(); bgDragging = true
  const t = e.touches[0]
  const { nx, ny } = toNorm(t.clientX, t.clientY)
  bgStartNX = nx; bgStartNY = ny
  applyNewDrag(nx, ny, true)
}
const onTouchMove = (e: TouchEvent) => {
  if (!bgDragging) return
  const t = e.touches[0]
  const { nx, ny } = toNorm(t.clientX, t.clientY)
  applyNewDrag(nx, ny, false)
}
const onTouchEnd = () => {
  if (!bgDragging) return
  bgDragging = false
  emit('commit')
}

const applyNewDrag = (nx: number, ny: number, isStart: boolean) => {
  const l = props.layer
  if (!l) return
  if (l.type === 'linear') {
    if (isStart) {
      // 以点击位置为 p1，向右延伸 40% 宽度作为 p2，立即可见
      const defaultLen = 0.4
      emit('update:layer', { ...l, linear: {
        ...l.linear,
        x1: nx, y1: ny,
        x2: Math.min(1, nx + defaultLen), y2: ny,
      }})
    } else {
      // 拖拽：p1 固定在起点，p2 跟随鼠标
      emit('update:layer', { ...l, linear: { ...l.linear, x2: nx, y2: ny } })
    }
  } else {
    const r = imgRect.value!
    if (isStart) {
      const defaultR = 0.25
      emit('update:layer', { ...l, radial: {
        ...l.radial,
        cx: nx, cy: ny,
        rx: defaultR,
        ry: defaultR * (r.width / r.height),
      }})
    } else {
      const dxPx = (nx - bgStartNX) * r.width
      const dyPx = (ny - bgStartNY) * r.height
      const radiusPx = Math.max(10, Math.hypot(dxPx, dyPx))
      emit('update:layer', { ...l, radial: {
        ...l.radial,
        rx: radiusPx / r.width,
        ry: radiusPx / r.height,
      }})
    }
  }
}

// ── 手柄拖拽 ──────────────────────────────────────────────────────────
let handleId = ''
let handleDragging = false
// 拖拽开始时记录鼠标与参数的偏移，用于平移
let handleOffsetNX = 0, handleOffsetNY = 0

const startHandleDrag = (e: MouseEvent, id: string) => {
  handleId = id
  handleDragging = true
  updateRect()
  const { nx, ny } = toNorm(e.clientX, e.clientY)
  const l = props.layer
  if (!l) return

  // 记录偏移（鼠标位置 - 手柄参数位置），用于平移时保持相对位置
  if (l.type === 'linear') {
    if (id === 'mid') {
      // 中点手柄：记录鼠标与线段中点的偏移
      const mx = (l.linear.x1 + l.linear.x2) / 2
      const my = (l.linear.y1 + l.linear.y2) / 2
      handleOffsetNX = nx - mx; handleOffsetNY = ny - my
    } else if (id === 'p1') {
      handleOffsetNX = nx - l.linear.x1; handleOffsetNY = ny - l.linear.y1
    } else {
      handleOffsetNX = nx - l.linear.x2; handleOffsetNY = ny - l.linear.y2
    }
  } else {
    if (id === 'center') {
      handleOffsetNX = nx - l.radial.cx; handleOffsetNY = ny - l.radial.cy
    } else {
      handleOffsetNX = 0; handleOffsetNY = 0
    }
  }

  document.addEventListener('mousemove', onHandleMove)
  document.addEventListener('mouseup', onHandleUp)
}

const onHandleMove = (e: MouseEvent) => {
  if (!handleDragging) return
  const { nx, ny } = toNorm(e.clientX, e.clientY)
  applyHandle(nx, ny)
}

const onHandleUp = () => {
  handleDragging = false
  cleanupHandleDrag()
  emit('commit')
}

const cleanupHandleDrag = () => {
  document.removeEventListener('mousemove', onHandleMove)
  document.removeEventListener('mouseup', onHandleUp)
}

const applyHandle = (nx: number, ny: number) => {
  const l = props.layer
  if (!l) return
  if (l.type === 'linear') {
    const px = Math.max(0, Math.min(1, nx - handleOffsetNX))
    const py = Math.max(0, Math.min(1, ny - handleOffsetNY))
    if (handleId === 'p1') {
      emit('update:layer', { ...l, linear: { ...l.linear, x1: px, y1: py } })
    } else if (handleId === 'p2') {
      emit('update:layer', { ...l, linear: { ...l.linear, x2: px, y2: py } })
    } else if (handleId === 'mid') {
      // 平移整条线
      const dx = px - (l.linear.x1 + l.linear.x2) / 2
      const dy = py - (l.linear.y1 + l.linear.y2) / 2
      emit('update:layer', { ...l, linear: {
        ...l.linear,
        x1: Math.max(0, Math.min(1, l.linear.x1 + dx)), y1: Math.max(0, Math.min(1, l.linear.y1 + dy)),
        x2: Math.max(0, Math.min(1, l.linear.x2 + dx)), y2: Math.max(0, Math.min(1, l.linear.y2 + dy)),
      }})
    }
  } else {
    if (handleId === 'center') {
      emit('update:layer', { ...l, radial: {
        ...l.radial,
        cx: nx - handleOffsetNX,
        cy: ny - handleOffsetNY,
      }})
    } else if (handleId === 'rotate') {
      // 旋转：鼠标相对中心的屏幕像素角度
      const r = imgRect.value!
      const dxPx = (nx - l.radial.cx) * r.width
      const dyPx = (ny - l.radial.cy) * r.height
      const angle = Math.atan2(dyPx, dxPx)
      emit('update:layer', { ...l, radial: { ...l.radial, angle } })
    } else {
      // 边缘手柄：在旋转坐标系下投影计算半径
      const r = imgRect.value!
      const a = l.radial.angle ?? 0
      const cosA = Math.cos(a), sinA = Math.sin(a)
      const dxPx = (nx - l.radial.cx) * r.width
      const dyPx = (ny - l.radial.cy) * r.height
      if (handleId === 'edge-x') {
        const proj = dxPx * cosA + dyPx * sinA
        emit('update:layer', { ...l, radial: { ...l.radial, rx: Math.max(0.02, Math.abs(proj) / r.width) } })
      } else if (handleId === 'edge-y') {
        const proj = -dxPx * sinA + dyPx * cosA
        emit('update:layer', { ...l, radial: { ...l.radial, ry: Math.max(0.02, Math.abs(proj) / r.height) } })
      }
    }
  }
}

// ── 手柄定义 ──────────────────────────────────────────────────────────
interface Handle { id: string; nx: number; ny: number; color: string; cursor: string }

const handles = computed<Handle[]>(() => {
  const l = props.layer
  if (!imgRect.value || !l) return []

  if (l.type === 'linear') {
    const mx = (l.linear.x1 + l.linear.x2) / 2
    const my = (l.linear.y1 + l.linear.y2) / 2
    return [
      { id: 'p1',  nx: l.linear.x1, ny: l.linear.y1, color: '#fff',    cursor: 'move' },
      { id: 'p2',  nx: l.linear.x2, ny: l.linear.y2, color: '#aaa',    cursor: 'move' },
      { id: 'mid', nx: mx,           ny: my,           color: '#5b6af0', cursor: 'move' },
    ]
  } else {
    const a = l.radial.angle ?? 0
    const cosA = Math.cos(a), sinA = Math.sin(a)
    const r = imgRect.value!
    const W = r.width, H = r.height

    // 所有计算在屏幕像素坐标系进行
    const cxPx = l.radial.cx * W, cyPx = l.radial.cy * H
    const rxPx = l.radial.rx * W, ryPx = l.radial.ry * H

    // edge-x：沿旋转后 x 轴（像素坐标）
    const exPx = cxPx + rxPx * cosA
    const eyPx = cyPx + rxPx * sinA
    // edge-y：沿旋转后 y 轴（像素坐标，垂直于 x 轴）
    const eyx = cxPx - ryPx * sinA
    const eyy = cyPx + ryPx * cosA
    // rotate：edge-x 外侧 30px
    const rotOffset = 30
    const rotPx = cxPx + (rxPx + rotOffset) * cosA
    const rotPy = cyPx + (rxPx + rotOffset) * sinA

    return [
      { id: 'center', nx: l.radial.cx,  ny: l.radial.cy,  color: '#fff',    cursor: 'move' },
      { id: 'edge-x', nx: exPx / W,     ny: eyPx / H,     color: '#5b6af0', cursor: 'ew-resize' },
      { id: 'edge-y', nx: eyx  / W,     ny: eyy  / H,     color: '#5b6af0', cursor: 'ns-resize' },
      { id: 'rotate', nx: rotPx / W,    ny: rotPy / H,    color: '#f0a05b', cursor: 'crosshair' },
    ]
  }
})

const handleStyle = (h: Handle) => {
  const r = imgRect.value!
  const clip = clipRect.value
  const x = r.left + h.nx * r.width
  const y = r.top  + h.ny * r.height
  // 手柄中心超出裁剪区则隐藏
  const hidden = clip
    ? (x < clip.left || x > clip.right || y < clip.top || y > clip.bottom)
    : false
  return {
    position: 'fixed' as const,
    left: `${x - 8}px`, top: `${y - 8}px`,
    width: '16px', height: '16px',
    cursor: h.cursor,
    zIndex: 13,
    pointerEvents: (hidden ? 'none' : 'auto') as 'none' | 'auto',
    opacity: hidden ? 0 : 1,
  }
}

// ── Overlay 绘制 ──────────────────────────────────────────────────────
const redrawOverlay = () => {
  const canvas = overlayEl.value
  const cr = clipRect.value   // overlay canvas 的屏幕区域
  const ir = imgRect.value    // 完整图片的屏幕区域
  if (!canvas || !cr || !ir || !props.layer) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(cr.width), h = Math.round(cr.height)
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr; canvas.height = h * dpr
  }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // 将完整图片坐标系平移到 clipRect 的偏移量
  // overlay canvas 左上角对应图片内 (cr.left - ir.left, cr.top - ir.top)
  const ox = cr.left - ir.left  // 裁剪区左上角在图片坐标系中的 x
  const oy = cr.top  - ir.top   // 裁剪区左上角在图片坐标系中的 y
  const iw = ir.width, ih = ir.height  // 完整图片的屏幕尺寸

  ctx.save()
  ctx.translate(-ox, -oy)  // 平移使图片坐标系原点对齐

  const l = props.layer
  if (l.type === 'linear') {
    _overlayLinear(ctx, iw, ih, l.linear)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(l.linear.x1 * iw, l.linear.y1 * ih)
    ctx.lineTo(l.linear.x2 * iw, l.linear.y2 * ih)
    ctx.stroke()
  } else {
    _overlayRadial(ctx, iw, ih, l.radial)
  }

  ctx.restore()
}

const _overlayLinear = (ctx: CanvasRenderingContext2D, w: number, h: number, p: LinearMaskParams) => {
  const x1 = p.x1 * w, y1 = p.y1 * h
  const x2 = p.x2 * w, y2 = p.y2 * h
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const featherPx = p.feather * Math.hypot(w, h) * 0.5
  const dx = (x2 - x1) / len, dy = (y2 - y1) / len
  const sx = x1 - dx * featherPx, sy = y1 - dy * featherPx
  const ex = x2 + dx * featherPx, ey = y2 + dy * featherPx

  const grad = ctx.createLinearGradient(sx, sy, ex, ey)
  grad.addColorStop(0,   'rgba(91,106,240,0.4)')
  grad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

const _overlayRadial = (ctx: CanvasRenderingContext2D, w: number, h: number, p: RadialMaskParams) => {
  const cx = p.cx * w, cy = p.cy * h
  const rx = p.rx * w, ry = p.ry * h
  const feather = Math.max(0.001, p.feather)
  const innerR = rx * (1 - feather)
  const angle = p.angle ?? 0

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.scale(1, ry / (rx || 1))

  const grad = ctx.createRadialGradient(0, 0, Math.max(0, innerR), 0, 0, Math.max(innerR + 1, rx))
  if (!p.invert) {
    grad.addColorStop(0,   'rgba(91,106,240,0.45)')
    grad.addColorStop(1,   'rgba(0,0,0,0)')
  } else {
    grad.addColorStop(0,   'rgba(0,0,0,0)')
    grad.addColorStop(1,   'rgba(91,106,240,0.45)')
  }
  ctx.fillStyle = grad
  const maxR = Math.max(w, h) * 2
  ctx.fillRect(-maxR, -maxR, maxR * 2, maxR * 2)
  ctx.restore()

  // 椭圆边框（旋转后）
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), angle, 0, Math.PI * 2)
  ctx.stroke()
  // 十字中心
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 1
  const cs = 6
  ctx.beginPath()
  ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy)
  ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs)
  ctx.stroke()
  // 旋转手柄连线（从 edge-x 到 rotate 手柄，像素坐标）
  const cosA = Math.cos(angle), sinA = Math.sin(angle)
  const rxPx = p.rx * w
  const exX = cx + rxPx * cosA, exY = cy + rxPx * sinA
  const rotX = cx + (rxPx + 30) * cosA, rotY = cy + (rxPx + 30) * sinA
  ctx.strokeStyle = 'rgba(240,160,91,0.7)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(exX, exY); ctx.lineTo(rotX, rotY)
  ctx.stroke()
  ctx.restore()
}

watch(
  [() => props.layer, () => props.showOverlay, imgRect],
  () => { if (props.active && props.showOverlay) nextTick(redrawOverlay) },
  { deep: true }
)
</script>

<style scoped>
.mask-overlay {
  border-radius: 4px;
  pointer-events: none;
}
.mask-interact {
  border-radius: 4px;
  user-select: none;
  touch-action: none;
}
.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  user-select: none;
  transition: transform 0.1s;
}
.handle:hover { transform: scale(1.25); }
.handle-inner {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.55);
  box-shadow: 0 0 0 1.5px rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.4);
}
</style>
