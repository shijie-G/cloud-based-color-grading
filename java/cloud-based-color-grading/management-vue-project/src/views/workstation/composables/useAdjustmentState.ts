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
  // 调色参数（响应式）
  const adjustments = reactive<AdjustmentValues>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    temperature: 100,
    exposure: 100
  })

  // 计算图片滤镜样式（响应式）
  const imageFilter = computed(() => {
    const brightness = adjustments.brightness / 100
    const contrast = adjustments.contrast / 100
    const saturation = adjustments.saturation / 100
    const temperature = adjustments.temperature / 100
    const exposure = adjustments.exposure / 100

    return `
      brightness(${brightness}) 
      contrast(${contrast}) 
      saturate(${saturation}) 
      sepia(${1 - temperature * 0.5})
      exposure(${exposure})
    `.replace(/\s+/g, ' ').trim()
  })

  // 重置所有调色参数
  const resetAdjustments = (): void => {
    adjustments.brightness = 100
    adjustments.contrast = 100
    adjustments.saturation = 100
    adjustments.temperature = 100
    adjustments.exposure = 100
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

  // 检查是否有调整（非默认值）
  const hasAdjustments = (): boolean => {
    return adjustments.brightness !== 100 ||
           adjustments.contrast !== 100 ||
           adjustments.saturation !== 100 ||
           adjustments.temperature !== 100 ||
           adjustments.exposure !== 100
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