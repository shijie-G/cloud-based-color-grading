import { ref, computed } from 'vue'
import type { Layer } from '../types'

const layers = ref<Layer[]>([])
const selectedLayerId = ref<string | null>(null)
let layerIdCounter = 0

/**
 * 图层管理
 */
export function useLayerManager() {
  const selectedLayer = computed(() => {
    if (!selectedLayerId.value) return null
    return layers.value.find(l => l.id === selectedLayerId.value) || null
  })

  const sortedLayers = computed(() => {
    return [...layers.value].sort((a, b) => b.zIndex - a.zIndex)
  })

  /**
   * 添加图层
   */
  function addLayer(layer: Omit<Layer, 'id' | 'zIndex'>): string {
    const id = `layer-${++layerIdCounter}`
    const maxZIndex = layers.value.length > 0
      ? Math.max(...layers.value.map(l => l.zIndex))
      : 0

    const newLayer: Layer = {
      ...layer,
      id,
      zIndex: maxZIndex + 1
    }

    layers.value.push(newLayer)
    selectedLayerId.value = id
    return id
  }

  /**
   * 删除图层
   */
  function removeLayer(id: string) {
    const index = layers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      layers.value.splice(index, 1)
      if (selectedLayerId.value === id) {
        selectedLayerId.value = layers.value.length > 0 ? layers.value[0].id : null
      }
    }
  }

  /**
   * 更新图层
   */
  function updateLayer(id: string, updates: Partial<Layer>) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      Object.assign(layer, updates)
    }
  }

  /**
   * 选择图层
   */
  function selectLayer(id: string | null) {
    selectedLayerId.value = id
  }

  /**
   * 移动图层顺序
   */
  function moveLayerUp(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (!layer) return

    const upperLayers = layers.value.filter(l => l.zIndex > layer.zIndex)
    if (upperLayers.length === 0) return

    const nextLayer = upperLayers.reduce((prev, curr) =>
      curr.zIndex < prev.zIndex ? curr : prev
    )

    const tempZIndex = layer.zIndex
    layer.zIndex = nextLayer.zIndex
    nextLayer.zIndex = tempZIndex
  }

  function moveLayerDown(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (!layer) return

    const lowerLayers = layers.value.filter(l => l.zIndex < layer.zIndex)
    if (lowerLayers.length === 0) return

    const prevLayer = lowerLayers.reduce((prev, curr) =>
      curr.zIndex > prev.zIndex ? curr : prev
    )

    const tempZIndex = layer.zIndex
    layer.zIndex = prevLayer.zIndex
    prevLayer.zIndex = tempZIndex
  }

  /**
   * 切换图层可见性
   */
  function toggleLayerVisibility(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.visible = !layer.visible
    }
  }

  /**
   * 切换图层锁定状态
   */
  function toggleLayerLock(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.locked = !layer.locked
    }
  }

  /**
   * 复制图层
   */
  function duplicateLayer(id: string): string | null {
    const layer = layers.value.find(l => l.id === id)
    if (!layer) return null

    const newId = `layer-${++layerIdCounter}`
    const maxZIndex = Math.max(...layers.value.map(l => l.zIndex))

    const duplicated: Layer = {
      ...layer,
      id: newId,
      name: `${layer.name} 副本`,
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: maxZIndex + 1
    }

    layers.value.push(duplicated)
    selectedLayerId.value = newId
    return newId
  }

  /**
   * 清空所有图层
   */
  function clearLayers() {
    layers.value = []
    selectedLayerId.value = null
    layerIdCounter = 0
  }

  /**
   * 重新排序图层（拖拽）
   */
  function reorderLayers(fromIndex: number, toIndex: number) {
    const sortedLayersList = [...layers.value].sort((a, b) => b.zIndex - a.zIndex)
    const [movedLayer] = sortedLayersList.splice(fromIndex, 1)
    sortedLayersList.splice(toIndex, 0, movedLayer)

    // 重新分配 zIndex
    sortedLayersList.forEach((layer, index) => {
      layer.zIndex = sortedLayersList.length - index
    })
  }

  return {
    layers,
    selectedLayerId,
    selectedLayer,
    sortedLayers,
    addLayer,
    removeLayer,
    updateLayer,
    selectLayer,
    moveLayerUp,
    moveLayerDown,
    toggleLayerVisibility,
    toggleLayerLock,
    duplicateLayer,
    clearLayers,
    reorderLayers
  }
}
