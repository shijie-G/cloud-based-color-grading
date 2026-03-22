/**
 * HSL 颜色范围调节状态管理
 *
 * 性能策略：
 * 1. 双缓存：预览版(≤1200px) 用于实时拖动，原图版用于停止后精细处理
 * 2. 多 Worker 并行分片：把像素数组切成 WORKER_COUNT 份同时处理，利用多核
 * 3. 跳帧：Worker 忙时只保留最新请求
 * 4. 输出格式：预览用 JPEG 0.88，原图用 JPEG 0.95（PNG 太慢）
 */
import { reactive, ref, watch, type Ref } from 'vue'
import { defaultHSLAdjustments, type HSLAdjustments, type HSLRange } from './useHSLProcessor'

export type { HSLAdjustments, HSLRange }

const PREVIEW_MAX  = 1200
const HIRES_DELAY  = 800
// 并行 Worker 数量，取 CPU 核数和 8 的较小值
const WORKER_COUNT = Math.min(navigator.hardwareConcurrency || 4, 8)

export interface UseHSLStateReturn {
  hslAdjustments: HSLAdjustments
  processedSrc: Ref<string>
  isProcessing: Ref<boolean>
  resetHSL: () => void
  hasHSLAdjustments: () => boolean
  setSourceImage: (src: string) => void
  exportProcessed: (format?: 'png' | 'jpeg', quality?: number) => Promise<string>
}

export function useHSLState(): UseHSLStateReturn {
  const hslAdjustments = reactive<HSLAdjustments>(defaultHSLAdjustments())
  const processedSrc   = ref<string>('')
  const isProcessing   = ref(false)

  let sourceSrc   = ''
  let previewData: ImageData | null = null
  let fullData:    ImageData | null = null
  let cachedSrc   = ''

  // Worker 池（懒创建）
  let workers: Worker[] = []
  let poolBusy = false
  let pendingReq: { adj: HSLAdjustments; hires: boolean } | null = null
  let hiresTimer: ReturnType<typeof setTimeout> | null = null

  const getWorkers = (): Worker[] => {
    if (workers.length === 0) {
      for (let i = 0; i < WORKER_COUNT; i++) {
        workers.push(new Worker(new URL('../workers/hslWorker.ts', import.meta.url), { type: 'module' }))
      }
    }
    return workers
  }

  // 并行处理：把 ImageData 切成 N 份，分发给 N 个 Worker
  const processParallel = (data: ImageData, adj: HSLAdjustments, hires: boolean): Promise<ImageData> => {
    return new Promise((resolve) => {
      const pool = getWorkers()
      const n = pool.length
      const totalPixels = data.width * data.height
      // 按像素行对齐切分（每份像素数向上取整到 4 的倍数）
      const chunkPixels = Math.ceil(totalPixels / n)
      const chunkBytes  = chunkPixels * 4

      const results = new Array<Uint8ClampedArray>(n)
      let done = 0

      pool.forEach((w, idx) => {
        const start = idx * chunkBytes
        const end   = Math.min(start + chunkBytes, data.data.length)
        if (start >= data.data.length) {
          // 这个 worker 没有数据，直接标记完成
          results[idx] = new Uint8ClampedArray(0)
          if (++done === n) resolve(merge(results, data.width, data.height))
          return
        }

        const slice = new Uint8ClampedArray(data.data.buffer, start, end - start)
        const copy  = new Uint8ClampedArray(slice.length)
        copy.set(slice)

        w.onmessage = (e: MessageEvent) => {
          results[idx] = new Uint8ClampedArray(e.data.buffer)
          if (++done === n) resolve(merge(results, data.width, data.height))
        }

        w.postMessage({ buffer: copy.buffer, adj, chunkIndex: idx, hires }, [copy.buffer])
      })
    })
  }

  // 合并各分片结果为完整 ImageData
  const merge = (chunks: Uint8ClampedArray[], width: number, height: number): ImageData => {
    const out = new Uint8ClampedArray(width * height * 4)
    let offset = 0
    for (const chunk of chunks) {
      if (chunk.length > 0) {
        out.set(chunk, offset)
        offset += chunk.length
      }
    }
    return new ImageData(out, width, height)
  }

  const runProcess = async (adj: HSLAdjustments, hires: boolean) => {
    const data = hires ? fullData : previewData
    if (!data || !hasHSLAdjustments()) {
      if (!hasHSLAdjustments()) processedSrc.value = ''
      return
    }

    poolBusy = true
    isProcessing.value = true

    try {
      const result = await processParallel(data, JSON.parse(JSON.stringify(adj)), hires)

      const canvas = document.createElement('canvas')
      canvas.width = result.width; canvas.height = result.height
      canvas.getContext('2d')!.putImageData(result, 0, 0)
      // 两种情况都用 JPEG，原图质量更高，避免 PNG 编码耗时
      processedSrc.value = canvas.toDataURL('image/jpeg', hires ? 0.95 : 0.88)
    } finally {
      poolBusy = false
      isProcessing.value = false

      // 处理完后如果有待处理请求，立即执行
      if (pendingReq) {
        const req = pendingReq
        pendingReq = null
        runProcess(req.adj, req.hires)
      }
    }
  }

  const scheduleProcess = (adj: HSLAdjustments, hires = false) => {
    if (!hasHSLAdjustments()) { processedSrc.value = ''; return }
    if (poolBusy) {
      if (!pendingReq || hires) {
        pendingReq = { adj: JSON.parse(JSON.stringify(adj)), hires }
      }
    } else {
      runProcess(adj, hires)
    }
  }

  const scheduleHires = (adj: HSLAdjustments) => {
    if (hiresTimer) clearTimeout(hiresTimer)
    hiresTimer = setTimeout(() => {
      hiresTimer = null
      if (fullData && hasHSLAdjustments()) {
        scheduleProcess(JSON.parse(JSON.stringify(adj)), true)
      }
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

    scheduleProcess(JSON.parse(JSON.stringify(hslAdjustments)), false)
    scheduleHires(hslAdjustments)
  }

  watch(hslAdjustments, (adj) => {
    if (!sourceSrc || !previewData) return
    scheduleProcess(JSON.parse(JSON.stringify(adj)), false)
    scheduleHires(adj)
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
   * 导出时用原图 fullData 重新走完整 HSL 处理，返回指定格式的 dataURL
   * 如果没有 HSL 调整，直接返回原图 src
   */
  const exportProcessed = async (format: 'png' | 'jpeg' = 'png', quality = 0.95): Promise<string> => {
    if (!fullData) return sourceSrc
    if (!hasHSLAdjustments()) return sourceSrc

    const result = await processParallel(fullData, JSON.parse(JSON.stringify(hslAdjustments)), true)
    const canvas = document.createElement('canvas')
    canvas.width = result.width; canvas.height = result.height
    canvas.getContext('2d')!.putImageData(result, 0, 0)
    return canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', quality)
  }

  return { hslAdjustments, processedSrc, isProcessing, resetHSL, hasHSLAdjustments, setSourceImage, exportProcessed }
}
