import { reactive } from 'vue'
import type { AdjustmentValues } from '../component-interfaces'

/**
 * 图片调整状态管理 Composable
 * 管理图片调整参数、滤镜计算和相关操作
 */

interface UseAdjustmentStateReturn {
  // 状态
  adjustments: AdjustmentValues
  
  // 方法
  resetAdjustments: () => void
  setAdjustment: (key: keyof AdjustmentValues, value: number) => void
  setAdjustments: (newAdjustments: Partial<AdjustmentValues>) => void
  getAdjustments: () => AdjustmentValues
  hasAdjustments: () => boolean
}

export function useAdjustmentState(): UseAdjustmentStateReturn {
  // 调色参数（响应式）— 默认值全部为 0（PS 风格）
  const adjustments = reactive<AdjustmentValues>({
    brightness:  0,
    contrast:    0,
    saturation:  0,
    vibrance:    0,
    hue:         0,
    temperature: 0,
    clarity:     0,
  })

  const resetAdjustments = (): void => {
    adjustments.brightness  = 0
    adjustments.contrast    = 0
    adjustments.saturation  = 0
    adjustments.vibrance    = 0
    adjustments.hue         = 0
    adjustments.temperature = 0
    adjustments.clarity     = 0
  }

  // 设置单个调整参数
  const setAdjustment = (key: keyof AdjustmentValues, value: number): void => {
    if (key in adjustments) {
      adjustments[key] = value
    }
  }

  // 批量设置调整参数
  const setAdjustments = (newAdjustments: Partial<AdjustmentValues>): void => {
    Object.keys(newAdjustments).forEach(key => {
      const adjustmentKey = key as keyof AdjustmentValues
      if (adjustmentKey in adjustments && newAdjustments[adjustmentKey] !== undefined) {
        adjustments[adjustmentKey] = newAdjustments[adjustmentKey]!
      }
    })
  }

  // 获取当前调整参数的副本
  const getAdjustments = (): AdjustmentValues => {
    return { ...adjustments }
  }

  const hasAdjustments = (): boolean => {
    return adjustments.brightness  !== 0 ||
           adjustments.contrast    !== 0 ||
           adjustments.saturation  !== 0 ||
           adjustments.vibrance    !== 0 ||
           adjustments.hue         !== 0 ||
           adjustments.temperature !== 0 ||
           adjustments.clarity     !== 0
  }

  return {
    // 状态
    adjustments,
    
    // 方法
    resetAdjustments,
    setAdjustment,
    setAdjustments,
    getAdjustments,
    hasAdjustments,
  }
}