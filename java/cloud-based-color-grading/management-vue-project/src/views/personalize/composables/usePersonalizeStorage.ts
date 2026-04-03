/**
 * 个性化图层存储管理 Composable
 *
 * 核心原则：
 * 1. 所有图层数据以百分比形式存储到 IndexedDB（持久化）
 * 2. 定位原点：图片左上角 (0, 0)
 * 3. 百分比范围：0-100（相对于图片宽高）
 * 4. 保证图层在不同尺寸图片上保持相对位置不变
 */

import { imageDB } from '@/views/workstation/utils/imageDB'
import type { Layer, LayerStorageData } from '../types'

export interface UsePersonalizeStorageReturn {
  saveLayersToStorage: (imageId: number, layers: Layer[], imageWidth: number, imageHeight: number) => Promise<void>
  loadLayersFromStorage: (imageId: number, imageWidth: number, imageHeight: number) => Promise<Layer[]>
  clearLayersFromStorage: (imageId: number) => Promise<void>
}

/**
 * 个性化图层存储管理
 */
export function usePersonalizeStorage(): UsePersonalizeStorageReturn {

  /**
   * 像素 → 百分比（保存时）
   *
   * 公式：
   * xPercent = (x / imageWidth) * 100
   * yPercent = (y / imageHeight) * 100
   * widthPercent = (width / imageWidth) * 100
   * heightPercent = (height / imageHeight) * 100
   */
  const layerToStorage = (layer: Layer, imageWidth: number, imageHeight: number): LayerStorageData => {
    const storage: LayerStorageData = {
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,

      // 核心转换：像素 → 百分比
      xPercent: (layer.x / imageWidth) * 100,
      yPercent: (layer.y / imageHeight) * 100,
      widthPercent: (layer.width / imageWidth) * 100,
      heightPercent: (layer.height / imageHeight) * 100,

      rotation: layer.rotation,
      zIndex: layer.zIndex,
      imageUrl: layer.imageUrl
    }

    // 文字图层特有属性
    if (layer.type === 'text') {
      storage.text = layer.text
      storage.fontSizePercent = layer.fontSize ? (layer.fontSize / imageHeight) * 100 : undefined
      storage.fontFamily = layer.fontFamily
      storage.color = layer.color
    }

    // 形状图层特有属性
    if (layer.type === 'shape') {
      storage.shapeType = layer.shapeType
      storage.fillColor = layer.fillColor
      storage.strokeColor = layer.strokeColor
      storage.strokeWidthPercent = layer.strokeWidth ? (layer.strokeWidth / imageWidth) * 100 : undefined
    }

    return storage
  }

  /**
   * 百分比 → 像素（加载时）
   *
   * 公式：
   * x = (xPercent / 100) * imageWidth
   * y = (yPercent / 100) * imageHeight
   * width = (widthPercent / 100) * imageWidth
   * height = (heightPercent / 100) * imageHeight
   */
  const storageToLayer = (storage: LayerStorageData, imageWidth: number, imageHeight: number): Layer => {
    const layer: Layer = {
      id: storage.id,
      name: storage.name,
      type: storage.type,
      visible: storage.visible,
      locked: storage.locked,
      opacity: storage.opacity,

      // 核心转换：百分比 → 像素
      x: (storage.xPercent / 100) * imageWidth,
      y: (storage.yPercent / 100) * imageHeight,
      width: (storage.widthPercent / 100) * imageWidth,
      height: (storage.heightPercent / 100) * imageHeight,

      rotation: storage.rotation,
      zIndex: storage.zIndex,
      imageUrl: storage.imageUrl
    }

    // 文字图层特有属性
    if (storage.type === 'text') {
      layer.text = storage.text
      layer.fontSize = storage.fontSizePercent ? (storage.fontSizePercent / 100) * imageHeight : undefined
      layer.fontFamily = storage.fontFamily
      layer.color = storage.color
    }

    // 形状图层特有属性
    if (storage.type === 'shape') {
      layer.shapeType = storage.shapeType
      layer.fillColor = storage.fillColor
      layer.strokeColor = storage.strokeColor
      layer.strokeWidth = storage.strokeWidthPercent ? (storage.strokeWidthPercent / 100) * imageWidth : undefined
    }

    return layer
  }

  /**
   * 序列化图层数据（Layer[] → JSON 字符串）
   * 转换为百分比格式存储
   */
  const serializeLayers = (layers: Layer[], imageWidth: number, imageHeight: number): string => {
    const storageData = layers.map(layer => layerToStorage(layer, imageWidth, imageHeight))
    return JSON.stringify(storageData)
  }

  /**
   * 反序列化图层数据（JSON 字符串 → Layer[]）
   * 从百分比格式还原为像素坐标
   */
  const deserializeLayers = (json: string, imageWidth: number, imageHeight: number): Layer[] => {
    try {
      const data = JSON.parse(json) as LayerStorageData[]

      return data.map(storage => {
        // 验证数据格式
        if (!('xPercent' in storage) || !('yPercent' in storage)) {
          console.error(`图层 "${storage.name}" 数据格式错误，缺少百分比字段`)
          throw new Error(`图层数据格式错误: ${storage.name}`)
        }

        return storageToLayer(storage, imageWidth, imageHeight)
      })
    } catch (error) {
      console.error('反序列化失败:', error)
      return []
    }
  }

  /**
   * 保存图层数据到 IndexedDB（持久化）
   * @param imageId 图片 ID
   * @param layers 图层数组（像素坐标）
   * @param imageWidth 图片宽度
   * @param imageHeight 图片高度
   */
  const saveLayersToStorage = async (
    imageId: number,
    layers: Layer[],
    imageWidth: number,
    imageHeight: number
  ): Promise<void> => {
    try {
      const layersJson = serializeLayers(layers, imageWidth, imageHeight)
      await imageDB.savePersonalizeLayers(imageId, layersJson)
      console.log(`✅ 持久化保存成功: 图片 ID ${imageId}, ${layers.length} 个图层`)
    } catch (error) {
      console.error('❌ 保存失败:', error)
      throw error
    }
  }

  /**
   * 从 IndexedDB 加载图层数据（持久化恢复）
   * @param imageId 图片 ID
   * @param imageWidth 图片宽度
   * @param imageHeight 图片高度
   * @returns 图层数组（像素坐标），如果不存在返回空数组
   */
  const loadLayersFromStorage = async (
    imageId: number,
    imageWidth: number,
    imageHeight: number
  ): Promise<Layer[]> => {
    try {
      const layersJson = await imageDB.loadPersonalizeLayers(imageId)
      if (!layersJson) {
        console.log(`图片 ID ${imageId} 没有保存的图层数据`)
        return []
      }

      const layers = deserializeLayers(layersJson, imageWidth, imageHeight)
      console.log(`✅ 持久化加载成功: 图片 ID ${imageId}, ${layers.length} 个图层`)
      return layers
    } catch (error) {
      console.error('❌ 加载失败:', error)
      return []
    }
  }

  /**
   * 清除图层数据
   * @param imageId 图片 ID
   */
  const clearLayersFromStorage = async (imageId: number): Promise<void> => {
    try {
      await imageDB.clearPersonalizeLayers(imageId)
      console.log(`✅ 清除成功: 图片 ID ${imageId}`)
    } catch (error) {
      console.error('❌ 清除失败:', error)
      throw error
    }
  }

  return {
    saveLayersToStorage,
    loadLayersFromStorage,
    clearLayersFromStorage
  }
}
