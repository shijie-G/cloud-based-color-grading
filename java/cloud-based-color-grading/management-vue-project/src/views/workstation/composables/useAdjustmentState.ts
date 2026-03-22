import { reactive, computed, type ComputedRef } from 'vue'
import type { AdjustmentValues } from '../component-interfaces'

/**
 * 图片调整状态管理 Composable
 * 管理图片调整参数、滤镜计算和相关操作
 */

interface UseAdjustmentStateReturn {
  // 状态
  adjustments: AdjustmentValues
  imageFilter: ComputedRef<string>
  
  // 方法
  resetAdjustments: () => void
  setAdjustment: (key: keyof AdjustmentValues, value: number) => void
  setAdjustments: (newAdjustments: Partial<AdjustmentValues>) => void
  getAdjustments: () => AdjustmentValues
  hasAdjustments: () => boolean
  saveImage: (previewImageRef?: HTMLImageElement) => void
  updateImageFilter: () => void
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

  const imageFilter = computed(() => {
    // 亮度：-150~+150 → CSS brightness 0.0~2.0，0 → 1.0
    const brightnessMul = 1 + adjustments.brightness / 150

    // 对比度：-100~+100 对称，0 → 1.0，+100 → 2.0，-100 → 0.0
    const contrastMul = 1 + adjustments.contrast / 100

    // 饱和度：-100~+100 → CSS saturate 0~2，0 → 1.0
    const saturateMul = 1 + adjustments.saturation / 100

    // 自然饱和度：较弱叠加
    const vibranceMul = 1 + adjustments.vibrance / 333

    // 色相：1:1 映射
    const hueRotateDeg = adjustments.hue

    // 色温：-100~+100，偏暖偏冷
    const tempHueDeg = -adjustments.temperature * 0.2
    const tempSepia  = adjustments.temperature > 0
      ? (adjustments.temperature / 100) * 0.15
      : 0

    // 清晰度：轻微 contrast 叠加模拟
    const clarityMul = 1 + adjustments.clarity / 1000

    const finalBrightness = (brightnessMul * clarityMul).toFixed(4)
    const finalContrast   = Math.max(0, contrastMul).toFixed(4)
    const finalSaturate   = Math.max(0, saturateMul * vibranceMul).toFixed(4)
    const finalHue        = (hueRotateDeg + tempHueDeg).toFixed(1)
    const finalSepia      = tempSepia.toFixed(4)

    const parts = [
      `brightness(${finalBrightness})`,
      `contrast(${finalContrast})`,
      `saturate(${finalSaturate})`,
      `hue-rotate(${finalHue}deg)`,
    ]
    if (tempSepia > 0) parts.push(`sepia(${finalSepia})`)

    return parts.join(' ')
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

  // 保存图片（应用滤镜效果）
  const saveImage = (previewImageRef?: HTMLImageElement): void => {
    if (!previewImageRef || !previewImageRef.src) {
      alert('请先上传图片！')
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      alert('无法创建画布上下文！')
      return
    }
    
    // 设置canvas尺寸与原图一致
    canvas.width = previewImageRef.naturalWidth
    canvas.height = previewImageRef.naturalHeight
    
    // 应用滤镜并绘制图片
    ctx.filter = imageFilter.value
    ctx.drawImage(previewImageRef, 0, 0)
    
    // 生成下载链接
    const link = document.createElement('a')
    link.download = `edited-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // 更新滤镜（Vue中由computed自动处理，此方法仅为统一入口）
  const updateImageFilter = (): void => {
    // 由于使用computed，滤镜会自动更新
    // 此方法保留用于兼容性或触发其他副作用
  }

  return {
    // 状态
    adjustments,
    imageFilter,
    
    // 方法
    resetAdjustments,
    setAdjustment,
    setAdjustments,
    getAdjustments,
    hasAdjustments,
    saveImage,
    updateImageFilter
  }
}