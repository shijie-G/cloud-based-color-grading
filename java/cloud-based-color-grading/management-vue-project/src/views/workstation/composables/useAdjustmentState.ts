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
    exposure:    0,
    brightness:  0,
    contrast:    0,
    saturation:  0,
    vibrance:    0,
    hue:         0,
    temperature: 0,
    clarity:     0,
  })

  // 计算图片滤镜样式（PS 风格数值 → CSS filter）
  const imageFilter = computed(() => {
    // 曝光度：PS -5~+5 EV，每 EV 亮度 ×2
    // exposure=0 → brightness(1.0)，+1EV → ×2，-1EV → ×0.5
    const exposureMul = Math.pow(2, adjustments.exposure)

    // 亮度：PS -150~+150，线性映射到 CSS brightness 0.0~2.0
    // PS 0 → 1.0，+150 → 2.0，-150 → 0.0（近似）
    const brightnessMul = 1 + adjustments.brightness / 150

    // 对比度：PS -50~+100，映射到 CSS contrast 0.5~2.0
    // PS 0 → 1.0，+100 → 2.0，-50 → 0.5
    const contrastMul = adjustments.contrast >= 0
      ? 1 + adjustments.contrast / 100
      : 1 + adjustments.contrast / 100  // -50 → 0.5

    // 饱和度：PS -100~+100，映射到 CSS saturate 0~2
    // PS 0 → 1.0，+100 → 2.0，-100 → 0（灰度）
    const saturateMul = 1 + adjustments.saturation / 100

    // 自然饱和度：用较弱的 saturate 叠加模拟（PS 有保护肤色，CSS 无法精确复现）
    // vibrance ±100 → saturate 0.7~1.3 范围内叠加
    const vibranceMul = 1 + adjustments.vibrance / 333

    // 色相：PS -180~+180 → CSS hue-rotate -180deg~+180deg，1:1
    const hueRotateDeg = adjustments.hue

    // 色温：PS 冷暖滑块 -100~+100
    // 暖色（+）→ hue-rotate 负方向（偏黄红）+ 轻微 sepia
    // 冷色（-）→ hue-rotate 正方向（偏蓝）
    const tempHueDeg = -adjustments.temperature * 0.2  // ±20deg
    const tempSepia  = adjustments.temperature > 0
      ? (adjustments.temperature / 100) * 0.15  // 最多 15% sepia 增加暖感
      : 0

    // 清晰度：用 contrast 轻微叠加模拟（CSS 无锐化，只能近似）
    // clarity ±100 → contrast ×0.9~1.1
    const clarityMul = 1 + adjustments.clarity / 1000

    // 合并所有 brightness 相关值
    const finalBrightness = (exposureMul * brightnessMul * clarityMul).toFixed(4)
    const finalContrast   = (contrastMul).toFixed(4)
    const finalSaturate   = (saturateMul * vibranceMul).toFixed(4)
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
    adjustments.exposure    = 0
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
    return adjustments.exposure    !== 0 ||
           adjustments.brightness  !== 0 ||
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