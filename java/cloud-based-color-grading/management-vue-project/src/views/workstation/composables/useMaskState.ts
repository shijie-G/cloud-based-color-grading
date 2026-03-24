/**
 * 蒙版状态管理 — 多层线性/径向蒙版
 *
 * 架构：
 *   - layers: MaskLayer[]  每层独立参数 + canvas
 *   - activeLayerId: 当前编辑层
 *   - compositeCanvas: 所有启用层 multiply 合成后的结果，供 useHSLState 读取
 *
 * 蒙版完全由数学参数生成，主线程零像素遍历。
 */
import { ref, reactive, computed } from 'vue'

export type MaskType = 'linear' | 'radial'

/**
 * 蒙版局部调色参数（PS 蒙版调整面板顺序）
 * 处理顺序：曝光 → 对比度 → 高光 → 阴影 → 白色色阶 → 黑色色阶 → 清晰度 → 去朦胧 → 饱和度 → 色相
 */
export interface MaskAdjustments {
  exposure:    number  // 曝光     -5.0 ~ +5.0 EV（模拟 PS 曝光滑块）
  contrast:    number  // 对比度   -100 ~ +100
  highlights:  number  // 高光     -100 ~ +100
  shadows:     number  // 阴影     -100 ~ +100
  whites:      number  // 白色色阶 -100 ~ +100
  blacks:      number  // 黑色色阶 -100 ~ +100
  clarity:     number  // 清晰度   -100 ~ +100
  dehaze:      number  // 去朦胧   -100 ~ +100
  saturation:  number  // 饱和度   -100 ~ +100
  hue:         number  // 色相     -180 ~ +180
}

export const defaultMaskAdjustments = (): MaskAdjustments => ({
  exposure: 0, contrast: 0, highlights: 0, shadows: 0,
  whites: 0, blacks: 0, clarity: 0, dehaze: 0,
  saturation: 0, hue: 0,
})

export interface LinearMaskParams {
  x1: number; y1: number   // 起点（白=完全应用）
  x2: number; y2: number   // 终点（黑=不应用）
  feather: number          // 羽化（0~1，相对对角线）
}

export interface RadialMaskParams {
  cx: number; cy: number   // 中心（归一化）
  rx: number; ry: number   // 横/纵半径（归一化）
  angle: number            // 旋转角度（弧度）
  feather: number          // 羽化（0~1）
  invert: boolean          // false=内部应用，true=外部应用
}

export interface MaskLayer {
  id: string
  name: string
  enabled: boolean
  type: MaskType
  linear: LinearMaskParams
  radial: RadialMaskParams
  adjustments: MaskAdjustments
  /** 该层的离屏 canvas（原图尺寸），由 generateLayerMask 写入 */
  canvas: HTMLCanvasElement | null
}

// ── 工厂函数 ──────────────────────────────────────────────────────────
let _idCounter = 0
export const createLinearLayer = (): MaskLayer => ({
  id: `mask-${++_idCounter}`,
  name: `线性 ${_idCounter}`,
  enabled: true,
  type: 'linear',
  linear: { x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5, feather: 0.1 },
  radial: { cx: 0.5, cy: 0.5, rx: 0.25, ry: 0.25, angle: 0, feather: 0.15, invert: false },
  adjustments: defaultMaskAdjustments(),
  canvas: null,
})

export const createRadialLayer = (): MaskLayer => ({
  id: `mask-${++_idCounter}`,
  name: `径向 ${_idCounter}`,
  enabled: true,
  type: 'radial',
  linear: { x1: 0.2, y1: 0.5, x2: 0.8, y2: 0.5, feather: 0.1 },
  radial: { cx: 0.5, cy: 0.5, rx: 0.25, ry: 0.25, angle: 0, feather: 0.15, invert: false },
  adjustments: defaultMaskAdjustments(),
  canvas: null,
})

// ── 绘制工具（纯函数，可复用） ────────────────────────────────────────
export function drawLinearMask(
  ctx: CanvasRenderingContext2D, w: number, h: number, p: LinearMaskParams
) {
  const x1 = p.x1 * w, y1 = p.y1 * h
  const x2 = p.x2 * w, y2 = p.y2 * h
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const featherPx = p.feather * Math.hypot(w, h) * 0.5
  const dx = (x2 - x1) / len, dy = (y2 - y1) / len
  const sx = x1 - dx * featherPx, sy = y1 - dy * featherPx
  const ex = x2 + dx * featherPx, ey = y2 + dy * featherPx
  const grad = ctx.createLinearGradient(sx, sy, ex, ey)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(1, '#000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

export function drawRadialMask(
  ctx: CanvasRenderingContext2D, w: number, h: number, p: RadialMaskParams
) {
  const cx = p.cx * w, cy = p.cy * h
  const rx = p.rx * w, ry = p.ry * h
  const feather = Math.max(0.001, p.feather)
  const angle = p.angle ?? 0
  const innerR = rx * (1 - feather)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.scale(1, ry / (rx || 1))
  const grad = ctx.createRadialGradient(0, 0, Math.max(0, innerR), 0, 0, rx)
  if (!p.invert) {
    grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#000')
  } else {
    grad.addColorStop(0, '#000'); grad.addColorStop(1, '#fff')
  }
  ctx.fillStyle = grad
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

// ── composable ────────────────────────────────────────────────────────
export function useMaskState() {
  // 图片尺寸（所有层共用）
  const imgWidth  = ref(0)
  const imgHeight = ref(0)

  const layers         = reactive<MaskLayer[]>([])
  const activeLayerId  = ref<string>('')
  const showOverlay    = ref(true)
  const maskActive     = ref(false)

  // 合成 canvas：所有启用层 multiply 叠加，供 useHSLState 读取
  const compositeCanvas = ref<HTMLCanvasElement | null>(null)

  const activeLayer = computed(() =>
    layers.find(l => l.id === activeLayerId.value) ?? null
  )

  const hasLayers = computed(() => layers.length > 0)

  // ── 初始化 ──────────────────────────────────────────────────────────
  const initSize = (width: number, height: number) => {
    imgWidth.value  = width
    imgHeight.value = height
    // 重建所有层的 canvas
    layers.forEach(l => _ensureLayerCanvas(l))
    _rebuildComposite()
  }

  const _ensureLayerCanvas = (layer: MaskLayer) => {
    const w = imgWidth.value, h = imgHeight.value
    if (!w || !h) return
    if (!layer.canvas || layer.canvas.width !== w || layer.canvas.height !== h) {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      layer.canvas = c
    }
  }

  // ── 层管理 ──────────────────────────────────────────────────────────
  const addLayer = (type: MaskType = 'linear'): MaskLayer => {
    const layer = type === 'linear' ? createLinearLayer() : createRadialLayer()
    _ensureLayerCanvas(layer)
    layers.push(layer)
    activeLayerId.value = layer.id
    generateLayerMask(layer)
    return layer
  }

  const removeLayer = (id: string) => {
    const idx = layers.findIndex(l => l.id === id)
    if (idx === -1) return
    layers.splice(idx, 1)
    if (activeLayerId.value === id) {
      activeLayerId.value = layers[Math.max(0, idx - 1)]?.id ?? ''
    }
    _rebuildComposite()
  }

  const setActiveLayer = (id: string) => {
    activeLayerId.value = id
  }

  const toggleLayerEnabled = (id: string) => {
    const l = layers.find(l => l.id === id)
    if (l) { l.enabled = !l.enabled; _rebuildComposite() }
  }

  // ── 蒙版生成 ────────────────────────────────────────────────────────
  /** 重新生成指定层的 canvas，然后重建合成 */
  const generateLayerMask = (layer: MaskLayer) => {
    _ensureLayerCanvas(layer)
    const c = layer.canvas
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    if (layer.type === 'linear') {
      drawLinearMask(ctx, c.width, c.height, layer.linear)
    } else {
      drawRadialMask(ctx, c.width, c.height, layer.radial)
    }
    _rebuildComposite()
  }

  /** 重新生成当前激活层 */
  const generateActiveMask = () => {
    if (activeLayer.value) generateLayerMask(activeLayer.value)
  }

  /** 将所有启用层 multiply 合成到 compositeCanvas */
  const _rebuildComposite = () => {
    const w = imgWidth.value, h = imgHeight.value
    if (!w || !h) return

    const enabledLayers = layers.filter(l => l.enabled && l.canvas)
    if (enabledLayers.length === 0) {
      compositeCanvas.value = null
      return
    }

    if (!compositeCanvas.value || compositeCanvas.value.width !== w || compositeCanvas.value.height !== h) {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      compositeCanvas.value = c
    }

    const ctx = compositeCanvas.value.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    // 第一层直接绘制
    ctx.drawImage(enabledLayers[0].canvas!, 0, 0)

    // 后续层用 multiply 叠加（两个灰度蒙版相乘 = 交集收窄）
    for (let i = 1; i < enabledLayers.length; i++) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(enabledLayers[i].canvas!, 0, 0)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── 层参数更新 ───────────────────────────────────────────────────────
  const updateLayer = (updated: MaskLayer) => {
    const idx = layers.findIndex(l => l.id === updated.id)
    if (idx === -1) return
    Object.assign(layers[idx], updated)
    generateLayerMask(layers[idx])
  }

  // ── 操作 ────────────────────────────────────────────────────────────
  const invertActiveLayer = () => {
    const l = activeLayer.value
    if (!l) return
    if (l.type === 'radial') {
      l.radial.invert = !l.radial.invert
    } else {
      const { x1, y1, x2, y2 } = l.linear
      l.linear.x1 = x2; l.linear.y1 = y2
      l.linear.x2 = x1; l.linear.y2 = y1
    }
    generateLayerMask(l)
  }

  const clearActiveLayer = () => {
    const l = activeLayer.value
    if (!l?.canvas) return
    const ctx = l.canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, l.canvas.width, l.canvas.height)
    _rebuildComposite()
  }

  const toggleOverlay = () => { showOverlay.value = !showOverlay.value }

  // ── 持久化 ──────────────────────────────────────────────────────────
  const getSerializable = () => layers.map(l => ({
    id: l.id, name: l.name, enabled: l.enabled, type: l.type,
    linear: { ...l.linear }, radial: { ...l.radial },
    adjustments: { ...l.adjustments },
  }))

  const loadFromSerializable = (data: ReturnType<typeof getSerializable>) => {
    layers.splice(0)
    data.forEach(d => {
      const layer: MaskLayer = {
        id: d.id, name: d.name, enabled: d.enabled, type: d.type,
        linear: { ...d.linear }, radial: { ...d.radial },
        adjustments: d.adjustments ? { ...defaultMaskAdjustments(), ...d.adjustments } : defaultMaskAdjustments(),
        canvas: null,
      }
      _ensureLayerCanvas(layer)
      layers.push(layer)
      generateLayerMask(layer)
    })
    activeLayerId.value = layers[0]?.id ?? ''
  }

  // ── 重置 ────────────────────────────────────────────────────────────
  const resetMask = () => {
    layers.splice(0)
    activeLayerId.value = ''
    compositeCanvas.value = null
    imgWidth.value = 0; imgHeight.value = 0
    maskActive.value = false
  }

  return {
    // 状态
    layers, activeLayerId, activeLayer, hasLayers,
    showOverlay, maskActive,
    compositeCanvas,
    imgWidth, imgHeight,
    // 层管理
    addLayer, removeLayer, setActiveLayer, toggleLayerEnabled,
    // 生成
    initSize, generateLayerMask, generateActiveMask,
    // 参数更新
    updateLayer,
    // 操作
    invertActiveLayer, clearActiveLayer, toggleOverlay,
    // 持久化
    getSerializable, loadFromSerializable,
    // 重置
    resetMask,
  }
}
