/**
 * 个性化图层存储管理 Composable
 * 封装 IndexedDB 操作，提供图层数据的持久化存储和恢复
 */

import { imageDB } from '@/views/workstation/utils/imageDB'
import type { Layer } from '../types'

export interface UsePersonalizeStorageReturn {
  saveLayersToStorage: (imageId: number, layers: Layer[]) => Promise<void>
  loadLayersFromStorage: (imageId: number) => Promise<Layer[]>
  clearLayersFromStorage: (imageId: number) => Promise<void>
  serializeLayers: (layers: Layer[]) => string
  deserializeLayers: (json: string) => Layer[]
}

/**
 * 个性化图层存储管理
 */
export function usePersonalizeStorage(): UsePersonalizeStorageReturn {

  /**
   * 序列化图层数据（Layer[] → JSON 字符串）
   * 注意：imageBlob 不可序列化，需要转换为 imageUrl（dataURL）
   */
  const serializeLayers = (layers: Layer[]): string => {
    const serializable = layers.map(layer => {
      const { imageBlob, ...rest } = layer
      // 如果有 imageBlob 但没有 imageUrl，需要先转换（实际上应该在添加图层时就处理）
      // 这里假设 imageUrl 已经存在（dataURL 或 blob URL）
      return rest
    })
    return JSON.stringify(serializable)
  }

  /**
   * 反序列化图层数据（JSON 字符串 → Layer[]）
   */
  const deserializeLayers = (json: string): Layer[] => {
    try {
      const layers = JSON.parse(json) as Layer[]
      return layers
    } catch (error) {
      console.error('反序列化图层数据失败:', error)
      return []
    }
  }

  /**
   * 保存图层数据到 IndexedDB
   * @param imageId 图片 ID
   * @param layers 图层数组
   */
  const saveLayersToStorage = async (imageId: number, layers: Layer[]): Promise<void> => {
    try {
      const layersJson = serializeLayers(layers)
      await imageDB.savePersonalizeLayers(imageId, layersJson)
      console.log(`图层数据已保存: 图片 ID ${imageId}, ${layers.length} 个图层`)
    } catch (error) {
      console.error('保存图层数据失败:', error)
      throw error
    }
  }

  /**
   * 从 IndexedDB 加载图层数据
   * @param imageId 图片 ID
   * @returns 图层数组，如果不存在返回空数组
   */
  const loadLayersFromStorage = async (imageId: number): Promise<Layer[]> => {
    try {
      const layersJson = await imageDB.loadPersonalizeLayers(imageId)
      if (!layersJson) {
        console.log(`图片 ID ${imageId} 没有保存的图层数据`)
        return []
      }
      const layers = deserializeLayers(layersJson)
      console.log(`图层数据已加载: 图片 ID ${imageId}, ${layers.length} 个图层`)
      return layers
    } catch (error) {
      console.error('加载图层数据失败:', error)
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
      console.log(`图层数据已清除: 图片 ID ${imageId}`)
    } catch (error) {
      console.error('清除图层数据失败:', error)
      throw error
    }
  }

  return {
    saveLayersToStorage,
    loadLayersFromStorage,
    clearLayersFromStorage,
    serializeLayers,
    deserializeLayers
  }
}
