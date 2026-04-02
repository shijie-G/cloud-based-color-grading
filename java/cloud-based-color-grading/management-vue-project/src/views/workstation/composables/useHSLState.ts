/**
 * 图片处理状态管理（基础调色 + HSL 颜色范围调节）
 *
 * 处理链（与 PS/Lightroom 一致，完全递进式）：
 *   原图 → basicWorker（色温→亮度→对比度→清晰度→饱和度→色相）
 *        → hslWorker（红/橙/黄/绿/青/蓝/紫 × H/S/L）
 *        → processedSrc
 *
 * 性能策略：
 * 1. 双缓存：预览版(≤1200px) 实时拖动，原图版停止后精细处理
 * 2. basicWorker × N 并行分片（和 hslWorker 相同模式）
 * 3. hslWorker × N 并行分片
 * 4. 跳帧：Worker 忙时只保留最新请求
 * 5. 500ms 后触发原图高清处理
 */
import { reactive, ref, watch, type Ref } from 'vue'
import { defaultHSLAdjustments, type HSLAdjustments, type HSLRange } from './useHSLProcessor'
import type { AdjustmentValues } from '../component-interfaces'
import type { MaskLayer } from './useMaskState'

export type { HSLAdjustments, HSLRange }

const PREVIEW_MAX  = 1200
const HIRES_DELAY  = 500
const WORKER_COUNT = Math.min(navigator.hardwareConcurrency || 4, 8)

export interface UseHSLStateReturn {
  hslAdjustments: HSLAdjustments
  processedSrc: Ref<string>
  isProcessing: Ref<boolean>
  resetHSL: () => void
  hasHSLAdjustments: () => boolean
  setSourceImage: (src: string) => void
  setBasicAdjustments: (adj: AdjustmentValues) => void
  /** 传入蒙版层列表（含每层独立调色参数），处理时逐层应用 */
  setMaskLayers: (layers: MaskLayer[]) => void
  /** 仅更新某层调色参数，不重传 canvas，用于滑块实时预览 */
  updateMaskLayerAdj: (id: string, adjustments: AdjustmentValues) => void
  /** 兼容旧接口：传入合成蒙版 canvas（无独立调色） */
  setMaskCanvas: (canvas: HTMLCanvasElement | null) => void
  exportProcessed: (format?: 'png' | 'jpeg', quality?: number) => Promise<string>
}

export function useHSLState(): UseHSLStateReturn {
  const hslAdjustments  = reactive<HSLAdjustments>(defaultHSLAdjustments())
  const processedSrc    = ref<string>('')
  const isProcessing    = ref(false)

  // 当前基础调色参数（由外部通过 setBasicAdjustments 注入）
  let basicAdj: AdjustmentValues = {
    brightness: 0, contrast: 0, saturation: 0,
    vibrance: 0, hue: 0, temperature: 0, clarity: 0,
  }

  // 当前蒙版层列表（含每层独立调色参数）
  let currentMaskLayers: MaskLayer[] = []

  let sourceSrc   = ''
  let previewData: ImageData | null = null
  let fullData:    ImageData | null = null
  let cachedSrc   = ''

  // Worker 池（懒创建）
  let basicWorkers: Worker[] = []
  let hslWorkers:   Worker[] = []
  let poolBusy  = false
  let pendingReq: { hslAdj: HSLAdjustments; basicAdj: AdjustmentValues; hires: boolean } | null = null
  let hiresTimer: ReturnType<typeof setTimeout> | null = null

  const getBasicWorkers = (): Worker[] => {
    if (basicWorkers.length === 0) {
      for (let i = 0; i < WORKER_COUNT; i++) {
        basicWorkers.push(new Worker(
          new URL('../workers/basicWorker.ts', import.meta.url), { type: 'module' }
        ))
      }
    }
    return basicWorkers
  }

  const getHslWorkers = (): Worker[] => {
    if (hslWorkers.length === 0) {
      for (let i = 0; i < WORKER_COUNT; i++) {
        hslWorkers.push(new Worker(
          new URL('../workers/hslWorker.ts', import.meta.url), { type: 'module' }
        ))
      }
    }
    return hslWorkers
  }

  // maskWorker 池（蒙版合成，同样分片并行）
  let maskWorkers: Worker[] = []
  const getMaskWorkers = (): Worker[] => {
    if (maskWorkers.length === 0) {
      for (let i = 0; i < WORKER_COUNT; i++) {
        maskWorkers.push(new Worker(
          new URL('../workers/maskWorker.ts', import.meta.url), { type: 'module' }
        ))
      }
    }
    return maskWorkers
  }
  // 把 ImageData 切成 N 份，分发给 N 个 Worker，返回合并后的 ImageData
  const runParallel = (
    data: ImageData,
    workers: Worker[],
    buildMsg: (slice: ArrayBuffer, idx: number) => { msg: object; transfer: Transferable[] }
  ): Promise<ImageData> => {
    return new Promise((resolve) => {
      const n = workers.length
      const totalBytes = data.data.length
      const chunkBytes = Math.ceil(Math.ceil(totalBytes / n / 4) * 4)  // 对齐到 4 字节（1像素）

      const results = new Array<Uint8ClampedArray>(n)
      let done = 0

      workers.forEach((w, idx) => {
        const start = idx * chunkBytes
        if (start >= totalBytes) {
          results[idx] = new Uint8ClampedArray(0)
          if (++done === n) resolve(merge(results, data.width, data.height))
          return
        }
        const end  = Math.min(start + chunkBytes, totalBytes)
        const copy = new Uint8ClampedArray(data.data.buffer.slice(start, end))

        w.onmessage = (e: MessageEvent) => {
          results[idx] = new Uint8ClampedArray(e.data.buffer)
          if (++done === n) resolve(merge(results, data.width, data.height))
        }

        const { msg, transfer } = buildMsg(copy.buffer, idx)
        w.postMessage(msg, transfer)
      })
    })
  }

  const merge = (chunks: Uint8ClampedArray[], width: number, height: number): ImageData => {
    const out = new Uint8ClampedArray(width * height * 4)
    let offset = 0
    for (const chunk of chunks) {
      if (chunk.length > 0) { out.set(chunk, offset); offset += chunk.length }
    }
    return new ImageData(out, width, height)
  }

  /**
   * 完整处理链（PS 顺序）：
   *   原图 → basicWorker（全局）→ hslWorker（全局）
   *        → 逐层蒙版：对当前结果再应用该层 basic adj，用蒙版 alpha 混合
   *        → canvas dataURL
   *
   * 多蒙版叠加：每层以上一层的输出作为"当前图"，逐层累积效果。
   * 这与 PS 局部调整图层的行为一致。
   */
  const runFullChain = async (
    data: ImageData,
    bAdj: AdjustmentValues,
    hAdj: HSLAdjustments,
    hires: boolean,
    maskLayers?: MaskLayer[]
  ): Promise<string> => {
    const bAdjCopy = { ...bAdj }
    const hAdjCopy = JSON.parse(JSON.stringify(hAdj)) as HSLAdjustments

    const enabledLayers = (maskLayers ?? []).filter(l => l.enabled && l.canvas)
    const hasBasic = Object.values(bAdjCopy).some(v => v !== 0)
    const hasHSL   = hasHSLAdjustments()
    const hasMask  = enabledLayers.length > 0

    if (!hasBasic && !hasHSL && !hasMask) return ''

    // Step 1: 全局基础调色
    let current: ImageData = data
    if (hasBasic) {
      current = await runParallel(
        data, getBasicWorkers(),
        (buffer, _idx) => ({ msg: { buffer, adj: bAdjCopy }, transfer: [buffer] })
      )
    }

    // Step 2: 全局 HSL
    if (hasHSL) {
      current = await runParallel(
        current, getHslWorkers(),
        (buffer, idx) => ({ msg: { buffer, adj: hAdjCopy, chunkIndex: idx, hires }, transfer: [buffer] })
      )
    }

    // Step 3: 逐层蒙版独立调色（PS 局部调整图层顺序）
    // 每层：对 current 再应用该层的 basic adj → 得到 layerAdjusted
    //       用蒙版 alpha lerp(current, layerAdjusted) → 新的 current
    for (const layer of enabledLayers) {
      const layerAdj = layer.adjustments
      const hasLayerAdj = Object.values(layerAdj).some(v => v !== 0)

      // 该层调色后的结果
      let layerAdjusted: ImageData = current
      if (hasLayerAdj) {
        layerAdjusted = await runParallel(
          current, getBasicWorkers(),
          (buffer, _idx) => ({ msg: { buffer, adj: { ...layerAdj } }, transfer: [buffer] })
        )
      }

      // 读取该层蒙版 canvas
      const maskData = await readCanvasAsync(layer.canvas!, current.width, current.height)

      // 用蒙版 alpha 混合：current lerp layerAdjusted
      current = await runMaskCompose(current, layerAdjusted, maskData)
    }

    const canvas = document.createElement('canvas')
    canvas.width = current.width; canvas.height = current.height
    canvas.getContext('2d')!.putImageData(current, 0, 0)
    return canvas.toDataURL('image/jpeg', hires ? 0.95 : 0.88)
  }

  /**
   * 用 createImageBitmap 异步把 canvas 内容读成 ImageData，缩放到目标尺寸。
   * 完全异步，不阻塞主线程渲染帧。
   */
  const readCanvasAsync = async (
    src: HTMLCanvasElement,
    targetW: number,
    targetH: number
  ): Promise<ImageData> => {
    const bitmap = await createImageBitmap(src, {
      resizeWidth: targetW,
      resizeHeight: targetH,
      resizeQuality: 'medium',
    })
    const oc = new OffscreenCanvas(targetW, targetH)
    const ctx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    return ctx.getImageData(0, 0, targetW, targetH)
  }

  /**
   * 将 ImageData 缩放到目标尺寸
   * 用于将预览图放大到原图尺寸，保持 Canvas 尺寸一致
   */
  const scaleImageData = async (
    data: ImageData,
    targetW: number,
    targetH: number
  ): Promise<ImageData> => {
    // 创建临时 canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = data.width
    tempCanvas.height = data.height
    tempCanvas.getContext('2d')!.putImageData(data, 0, 0)

    // 使用 createImageBitmap 高质量缩放
    const bitmap = await createImageBitmap(tempCanvas, {
      resizeWidth: targetW,
      resizeHeight: targetH,
      resizeQuality: 'high', // 放大时使用高质量
    })

    const oc = new OffscreenCanvas(targetW, targetH)
    const ctx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    return ctx.getImageData(0, 0, targetW, targetH)
  }

  /** 蒙版合成：分片并行 lerp(original, adjusted, mask) */
  const runMaskCompose = (
    original: ImageData,
    adjusted: ImageData,
    mask: ImageData
  ): Promise<ImageData> => {
    return new Promise((resolve) => {
      const pool = getMaskWorkers()
      const n = pool.length
      const totalBytes = original.data.length
      const chunkBytes = Math.ceil(Math.ceil(totalBytes / n / 4) * 4)

      const results = new Array<Uint8ClampedArray>(n)
      let done = 0

      pool.forEach((w, idx) => {
        const start = idx * chunkBytes
        if (start >= totalBytes) {
          results[idx] = new Uint8ClampedArray(0)
          if (++done === n) resolve(merge(results, original.width, original.height))
          return
        }
        const end = Math.min(start + chunkBytes, totalBytes)
        const origSlice = new Uint8ClampedArray(original.data.buffer.slice(start, end))
        const adjSlice  = new Uint8ClampedArray(adjusted.data.buffer.slice(start, end))
        const mskSlice  = new Uint8ClampedArray(mask.data.buffer.slice(start, end))

        w.onmessage = (e: MessageEvent) => {
          results[idx] = new Uint8ClampedArray(e.data.buffer)
          if (++done === n) resolve(merge(results, original.width, original.height))
        }

        w.postMessage(
          { original: origSlice.buffer, adjusted: adjSlice.buffer, mask: mskSlice.buffer },
          { transfer: [origSlice.buffer, adjSlice.buffer, mskSlice.buffer] }
        )
      })
    })
  }

  const runProcess = async (bAdj: AdjustmentValues, hAdj: HSLAdjustments, hires: boolean) => {
    const data = hires ? fullData : previewData
    if (!data) return

    poolBusy = true
    isProcessing.value = true

    try {
      const result = await runFullChain(data, bAdj, hAdj, hires, currentMaskLayers)
      // result 为空字符串表示无任何调整，清空 processedSrc 让 ImagePreview 显示原图
      processedSrc.value = result
    } finally {
      poolBusy = false
      isProcessing.value = false
      if (pendingReq) {
        const req = pendingReq; pendingReq = null
        runProcess(req.basicAdj, req.hslAdj, req.hires)
      }
    }
  }

  const scheduleProcess = (bAdj: AdjustmentValues, hAdj: HSLAdjustments, hires = false) => {
    if (poolBusy) {
      if (!pendingReq || hires) {
        pendingReq = {
          basicAdj: { ...bAdj },
          hslAdj: JSON.parse(JSON.stringify(hAdj)),
          hires,
        }
      }
    } else {
      runProcess({ ...bAdj }, JSON.parse(JSON.stringify(hAdj)), hires)
    }
  }

  const scheduleHires = () => {
    if (hiresTimer) clearTimeout(hiresTimer)
    hiresTimer = setTimeout(() => {
      hiresTimer = null
      if (fullData) scheduleProcess({ ...basicAdj }, hslAdjustments, true)
    }, HIRES_DELAY)
  }
  const makePreviewData = (img: HTMLImageElement): ImageData => {
    const ratio = Math.min(1, PREVIEW_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth  * ratio)
    const h = Math.round(img.naturalHeight * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  }

  const makeFullData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  const triggerProcess = () => {
    if (!sourceSrc || !previewData) return
    scheduleProcess({ ...basicAdj }, hslAdjustments, false)
    scheduleHires()
  }

  const setSourceImage = async (src: string) => {
    if (!src) {
      processedSrc.value = ''; sourceSrc = ''
      previewData = null; fullData = null
      return
    }
    sourceSrc = src
    processedSrc.value = ''

    if (cachedSrc !== src) {
      previewData = null; fullData = null
      try {
        const img = await loadImage(src)
        previewData = makePreviewData(img)
        fullData    = makeFullData(img)
        cachedSrc   = src
      } catch { return }
    }

    triggerProcess()
  }

  /** 外部注入基础调色参数，触发重新处理 */
  const setBasicAdjustments = (adj: AdjustmentValues) => {
    basicAdj = { ...adj }
    triggerProcess()
  }

  /** 兼容旧接口：传入合成蒙版 canvas（无独立调色），已废弃，保留兼容 */
  const setMaskCanvas = (_canvas: HTMLCanvasElement | null) => {
    requestAnimationFrame(() => triggerProcess())
  }

  /** 外部注入蒙版层列表（含每层独立调色参数），触发重新处理 */
  const setMaskLayers = (layers: MaskLayer[]) => {
    // 深拷贝参数，保留 canvas 引用（canvas 不可序列化，直接引用）
    currentMaskLayers = layers.map(l => ({ ...l, adjustments: { ...l.adjustments } }))
    requestAnimationFrame(() => triggerProcess())
  }

  /**
   * 仅更新某层的独立调色参数，不重新传 canvas，直接触发处理链。
   * 用于滑块拖动时的实时预览，避免 rAF 延迟导致蒙版闪烁。
   */
  const updateMaskLayerAdj = (id: string, adjustments: AdjustmentValues) => {
    const layer = currentMaskLayers.find(l => l.id === id)
    if (layer) {
      layer.adjustments = { ...adjustments }
      triggerProcess()
    }
  }

  // HSL 参数变化时重新处理
  watch(hslAdjustments, () => {
    if (!sourceSrc || !previewData) return
    triggerProcess()
  }, { deep: true })

  const hasHSLAdjustments = (): boolean =>
    (Object.values(hslAdjustments) as HSLRange[]).some(
      r => r.hue !== 0 || r.saturation !== 0 || r.lightness !== 0
    )

  const resetHSL = () => {
    if (hiresTimer) { clearTimeout(hiresTimer); hiresTimer = null }
    const keys = Object.keys(hslAdjustments) as (keyof HSLAdjustments)[]
    keys.forEach(k => {
      hslAdjustments[k].hue        = 0
      hslAdjustments[k].saturation = 0
      hslAdjustments[k].lightness  = 0
    })
  }

  /**
   * 导出：用原图 fullData 走完整处理链，返回指定格式 dataURL
   * 无任何调整时直接返回原图 src
   */
  const exportProcessed = async (format: 'png' | 'jpeg' = 'png', quality = 0.95): Promise<string> => {
    if (!fullData) return sourceSrc
    const hasBasic = Object.values(basicAdj).some(v => v !== 0)
    if (!hasBasic && !hasHSLAdjustments() && currentMaskLayers.length === 0) return sourceSrc

    const result = await runFullChain(fullData, basicAdj, hslAdjustments, true, currentMaskLayers)
    if (!result) return sourceSrc

    if (format === 'png') {
      const img = await loadImage(result)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      return canvas.toDataURL('image/png', quality)
    }
    return result
  }

  return {
    hslAdjustments,
    processedSrc,
    isProcessing,
    resetHSL,
    hasHSLAdjustments,
    setSourceImage,
    setBasicAdjustments,
    setMaskCanvas,
    setMaskLayers,
    updateMaskLayerAdj,
    exportProcessed,
  }
}
