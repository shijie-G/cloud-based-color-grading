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
   * 完整处理链：原图 → basicWorker → hslWorker → canvas dataURL
   * 两阶段都是多线程并行分片
   */
  const runFullChain = async (
    data: ImageData,
    bAdj: AdjustmentValues,
    hAdj: HSLAdjustments,
    hires: boolean
  ): Promise<string> => {
    const bAdjCopy = { ...bAdj }
    const hAdjCopy = JSON.parse(JSON.stringify(hAdj)) as HSLAdjustments

    const hasBasic = Object.values(bAdjCopy).some(v => v !== 0)
    const hasHSL   = hasHSLAdjustments()

    let intermediate: ImageData = data

    // Stage 1: 基础调色（像素级）
    if (hasBasic) {
      intermediate = await runParallel(
        data,
        getBasicWorkers(),
        (buffer, _idx) => ({
          msg: { buffer, adj: bAdjCopy },
          transfer: [buffer],
        })
      )
    }

    // Stage 2: HSL 颜色范围调节
    if (hasHSL) {
      intermediate = await runParallel(
        intermediate,
        getHslWorkers(),
        (buffer, idx) => ({
          msg: { buffer, adj: hAdjCopy, chunkIndex: idx, hires },
          transfer: [buffer],
        })
      )
    }

    // 如果两者都没有调整，直接返回空（调用方会用原图）
    if (!hasBasic && !hasHSL) return ''

    const canvas = document.createElement('canvas')
    canvas.width = intermediate.width; canvas.height = intermediate.height
    canvas.getContext('2d')!.putImageData(intermediate, 0, 0)
    return canvas.toDataURL('image/jpeg', hires ? 0.95 : 0.88)
  }

  const runProcess = async (bAdj: AdjustmentValues, hAdj: HSLAdjustments, hires: boolean) => {
    const data = hires ? fullData : previewData
    if (!data) return

    poolBusy = true
    isProcessing.value = true

    try {
      const result = await runFullChain(data, bAdj, hAdj, hires)
      processedSrc.value = result  // 空字符串时 ImagePreview 自动回退到原图
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
    if (!hasBasic && !hasHSLAdjustments()) return sourceSrc

    const result = await runFullChain(fullData, basicAdj, hslAdjustments, true)
    if (!result) return sourceSrc

    // 如果需要 PNG 格式，重新绘制一次（runFullChain 内部用 JPEG）
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
    exportProcessed,
  }
}
