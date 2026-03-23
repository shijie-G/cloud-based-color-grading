/**
 * 蒙版状态管理 — 线性蒙版 & 径向蒙版
 *
 * 蒙版完全由数学参数生成，不做任何像素级笔刷操作，主线程零卡顿。
 * 生成结果写入 internalCanvas，供 useHSLState 异步读取合成。
 */
import { ref, reactive } from 'vue'

export type MaskType = 'linear' | 'radial'

/** 线性蒙版参数（归一化坐标 0~1） */
export interface LinearMaskParams {
  x1: number; y1: number  // 起点（白=完全应用）
  x2: number; y2: number  // 终点（黑=不应用）
  feather: number         // 羽化宽度（0~1，相对图片对角线）
}

/** 径向蒙版参数（归一化坐标 0~1） */
export interface RadialMaskParams {
  cx: number; cy: number  // 中心
  rx: number; ry: number  // 横/纵半径
  angle: number           // 旋转角度（弧度）
  feather: number         // 羽化（0~1）
  invert: boolean         // false=内部应用，true=外部应用
}

export interface MaskLayer {
  id: string
  enabled: boolean
  type: MaskType
  width: number
  height: number
  linear: LinearMaskParams
  radial: RadialMaskParams
}

export function useMaskState() {
  const layer = reactive<MaskLayer>({
    id: 'layer-0',
    enabled: false,
    type: 'linear',
    width: 0,
    height: 0,
    linear: { x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5, feather: 0.1 },
    radial: { cx: 0.5, cy: 0.5, rx: 0.25, ry: 0.25, angle: 0, feather: 0.15, invert: false },
  })

  const showOverlay = ref(true)
  const maskActive  = ref(false)

  // 内部 canvas — 由 generateMask() 写入，供 useHSLState 读取
  const internalCanvas = ref<HTMLCanvasElement | null>(null)

  /** 初始化（图片加载时调用） */
  const initMask = (width: number, height: number) => {
    layer.width  = width
    layer.height = height
    if (!internalCanvas.value || internalCanvas.value.width !== width || internalCanvas.value.height !== height) {
      const c = document.createElement('canvas')
      c.width = width; c.height = height
      internalCanvas.value = c
    }
    generateMask()
    layer.enabled = true
  }

  /** 根据当前参数重新生成蒙版到 internalCanvas */
  const generateMask = () => {
    const c = internalCanvas.value
    if (!c || !layer.width) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)

    if (layer.type === 'linear') {
      _drawLinear(ctx, c.width, c.height, layer.linear)
    } else {
      _drawRadial(ctx, c.width, c.height, layer.radial)
    }
  }

  const _drawLinear = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    p: LinearMaskParams
  ) => {
    const x1 = p.x1 * w, y1 = p.y1 * h
    const x2 = p.x2 * w, y2 = p.y2 * h

    // 沿渐变方向计算羽化偏移
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const diag = Math.hypot(w, h)
    const featherPx = p.feather * diag * 0.5

    // 渐变从 (x1,y1) 白 → (x2,y2) 黑，两端各延伸 featherPx
    const dx = (x2 - x1) / len, dy = (y2 - y1) / len
    const sx = x1 - dx * featherPx, sy = y1 - dy * featherPx
    const ex = x2 + dx * featherPx, ey = y2 + dy * featherPx

    const grad = ctx.createLinearGradient(sx, sy, ex, ey)
    grad.addColorStop(0,   '#fff')
    grad.addColorStop(1,   '#000')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  const _drawRadial = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    p: RadialMaskParams
  ) => {
    const cx = p.cx * w, cy = p.cy * h
    const rx = p.rx * w, ry = p.ry * h
    const feather = Math.max(0.001, p.feather)
    const angle = p.angle ?? 0

    // 旋转 + 椭圆缩放：在中心坐标系下操作
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.scale(1, ry / (rx || 1))

    const innerR = rx * (1 - feather)
    const outerR = rx

    const grad = ctx.createRadialGradient(0, 0, Math.max(0, innerR), 0, 0, outerR)
    if (!p.invert) {
      grad.addColorStop(0,   '#fff')
      grad.addColorStop(1,   '#000')
    } else {
      grad.addColorStop(0,   '#000')
      grad.addColorStop(1,   '#fff')
    }
    ctx.fillStyle = grad
    // fillRect 需要覆盖整个画布，反变换后的范围
    const maxR = Math.max(w, h) * 2
    ctx.fillRect(-maxR, -maxR, maxR * 2, maxR * 2)
    ctx.restore()

    if (p.invert) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  }

  const clearMask = () => {
    const c = internalCanvas.value
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, c.width, c.height)
  }

  const invertMask = () => {
    if (layer.type === 'radial') {
      layer.radial.invert = !layer.radial.invert
    } else {
      // 线性：交换起终点
      const { x1, y1, x2, y2 } = layer.linear
      layer.linear.x1 = x2; layer.linear.y1 = y2
      layer.linear.x2 = x1; layer.linear.y2 = y1
    }
    generateMask()
  }

  const toggleMask    = () => { layer.enabled = !layer.enabled }
  const toggleOverlay = () => { showOverlay.value = !showOverlay.value }

  const getMaskDataUrl = () => internalCanvas.value?.toDataURL('image/png') ?? null

  const loadMaskFromDataUrl = (dataUrl: string, width: number, height: number): Promise<void> =>
    new Promise((resolve) => {
      layer.width = width; layer.height = height
      const c = document.createElement('canvas')
      c.width = width; c.height = height
      const ctx = c.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        internalCanvas.value = c
        layer.enabled = true
        resolve()
      }
      img.onerror = () => resolve()
      img.src = dataUrl
    })

  const resetMask = () => {
    layer.enabled = false
    layer.width = 0; layer.height = 0
    internalCanvas.value = null
    maskActive.value = false
  }

  return {
    layer, showOverlay, maskActive,
    internalCanvas,
    initMask, generateMask,
    clearMask, invertMask,
    toggleMask, toggleOverlay,
    getMaskDataUrl, loadMaskFromDataUrl, resetMask,
  }
}
