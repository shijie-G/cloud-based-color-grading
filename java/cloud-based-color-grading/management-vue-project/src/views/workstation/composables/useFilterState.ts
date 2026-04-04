/**
 * 滤镜状态管理
 * 参考 useHSLState 的架构，实现滤镜处理链
 */

import { reactive, ref, watch, type Ref } from 'vue'
import type { FilterConfig } from '../types/filterTypes'
import { defaultFilterConfig } from '../types/filterTypes'

const PREVIEW_MAX = 1200
const HIRES_DELAY = 500
const WORKER_COUNT = Math.min(navigator.hardwareConcurrency || 4, 8)

export interface UseFilterStateReturn {
  filterConfig: FilterConfig
  processedSrc: Ref<string>
  isProcessing: Ref<boolean>
  resetFilter: () => void
  hasFilterAdjustments: () => boolean
  setSourceImage: (src: string) => void
  applyFilter: () => void
}

export function useFilterState(): UseFilterStateReturn {
  const filterConfig = reactive<FilterConfig>(defaultFilterConfig())
  const processedSrc = ref<string>('')
  const isProcessing = ref(false)

  let sourceSrc = ''
  let previewData: ImageData | null = null
  let fullData: ImageData | null = null
  let cachedSrc = ''

  // Worker 池
  let filterWorkers: Worker[] = []
  let poolBusy = false
  let pendingReq: { config: FilterConfig; hires: boolean } | null = null
  let hiresTimer: ReturnType<typeof setTimeout> | null = null

  const getFilterWorkers = (): Worker[] => {
    if (filterWorkers.length === 0) {
      for (let i = 0; i < WORKER_COUNT; i++) {
        filterWorkers.push(new Worker(
          new URL('../workers/filterWorker.ts', import.meta.url), { type: 'module' }
        ))
      }
    }
    return filterWorkers
  }

  const runProcess = async (config: FilterConfig, hires: boolean) => {
    const data = hires ? fullData : previewData
    if (!data) return

    poolBusy = true
    isProcessing.value = true

    try {
      // 简化版：单 Worker 处理
      const worker = getFilterWorkers()[0]
      const copy = new Uint8ClampedArray(data.data)

      const result = await new Promise<Uint8ClampedArray>((resolve) => {
        worker.onmessage = (e: MessageEvent) => {
          resolve(new Uint8ClampedArray(e.data.buffer))
        }
        worker.postMessage(
          { buffer: copy.buffer, config },
          { transfer: [copy.buffer] }
        )
      })

      const canvas = document.createElement('canvas')
      canvas.width = data.width
      canvas.height = data.height
      const ctx = canvas.getContext('2d')!
      const imageData = new ImageData(result, data.width, data.height)
      ctx.putImageData(imageData, 0, 0)
      processedSrc.value = canvas.toDataURL('image/jpeg', hires ? 0.95 : 0.88)
    } finally {
      poolBusy = false
      isProcessing.value = false
      if (pendingReq) {
        const req = pendingReq
        pendingReq = null
        runProcess(req.config, req.hires)
      }
    }
  }

  const scheduleProcess = (config: FilterConfig, hires = false) => {
    if (poolBusy) {
      if (!pendingReq || hires) {
        pendingReq = { config: JSON.parse(JSON.stringify(config)), hires }
      }
    } else {
      runProcess(JSON.parse(JSON.stringify(config)), hires)
    }
  }

  const scheduleHires = () => {
    if (hiresTimer) clearTimeout(hiresTimer)
    hiresTimer = setTimeout(() => {
      hiresTimer = null
      if (fullData) scheduleProcess(filterConfig, true)
    }, HIRES_DELAY)
  }

  const makePreviewData = (img: HTMLImageElement): ImageData => {
    const ratio = Math.min(1, PREVIEW_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * ratio)
    const h = Math.round(img.naturalHeight * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  }

  const makeFullData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  const triggerProcess = () => {
    if (!sourceSrc || !previewData) return
    scheduleProcess(filterConfig, false)
    scheduleHires()
  }

  const setSourceImage = async (src: string) => {
    if (!src) {
      processedSrc.value = ''
      sourceSrc = ''
      previewData = null
      fullData = null
      return
    }
    sourceSrc = src
    processedSrc.value = ''

    if (cachedSrc !== src) {
      previewData = null
      fullData = null
      try {
        const img = await loadImage(src)
        previewData = makePreviewData(img)
        fullData = makeFullData(img)
        cachedSrc = src
      } catch {
        return
      }
    }

    triggerProcess()
  }

  const applyFilter = () => {
    triggerProcess()
  }

  watch(filterConfig, () => {
    if (!sourceSrc || !previewData) return
    triggerProcess()
  }, { deep: true })

  const hasFilterAdjustments = (): boolean => {
    return filterConfig.blur_radius > 0 ||
      filterConfig.sharpen_amount > 0 ||
      filterConfig.style_type > 0 ||
      filterConfig.grain_intensity > 0 ||
      filterConfig.vignette_strength !== 0
  }

  const resetFilter = () => {
    if (hiresTimer) {
      clearTimeout(hiresTimer)
      hiresTimer = null
    }
    Object.assign(filterConfig, defaultFilterConfig())
  }

  return {
    filterConfig,
    processedSrc,
    isProcessing,
    resetFilter,
    hasFilterAdjustments,
    setSourceImage,
    applyFilter
  }
}
