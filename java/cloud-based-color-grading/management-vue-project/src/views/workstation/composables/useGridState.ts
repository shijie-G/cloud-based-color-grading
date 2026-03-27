/**
 * 网格线状态管理
 * 持久化到 localStorage（key: workstation-grid-settings）
 */
import { reactive, watch } from 'vue'

export interface GridSettings {
  visible: boolean
  cols: number       // 竖线数量（分割列数）
  rows: number       // 横线数量（分割行数）
  color: string      // 线条颜色（hex）
  opacity: number    // 透明度 0~1
  lineWidth: number  // 线宽 px
}

const STORAGE_KEY = 'workstation-grid-settings'

const defaultSettings = (): GridSettings => ({
  visible: false,
  cols: 3,
  rows: 3,
  color: '#ffffff',
  opacity: 0.4,
  lineWidth: 1,
})

const load = (): GridSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) }
  } catch {}
  return defaultSettings()
}

export function useGridState() {
  const settings = reactive<GridSettings>(load())

  // 任意变化自动持久化
  watch(settings, (v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...v }))
  }, { deep: true })

  const applyPreset = (preset: 'thirds' | 'ninths' | 'golden') => {
    if (preset === 'thirds')  { settings.cols = 3;  settings.rows = 3  }
    if (preset === 'ninths')  { settings.cols = 9;  settings.rows = 9  }
    if (preset === 'golden')  { settings.cols = 2;  settings.rows = 2  } // 黄金分割近似 1:1.618，用2列2行标记
  }

  return { settings, applyPreset }
}
