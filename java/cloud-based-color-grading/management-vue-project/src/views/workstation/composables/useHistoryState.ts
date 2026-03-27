/**
 * 撤销 / 重做历史栈
 * 管理 adjustments + hslAdjustments + maskLayers + cropState 的快照
 * 最多保存 MAX_HISTORY 步，超出时丢弃最旧的
 */
import { ref } from 'vue'
import type { AdjustmentValues } from '../component-interfaces'
import type { HSLAdjustments } from './useHSLProcessor'
import type { CropState } from '../types/cropTypes'

export interface SerializedMaskLayer {
  id: string
  name: string
  enabled: boolean
  type: 'linear' | 'radial'
  linear: { x1: number; y1: number; x2: number; y2: number; feather: number }
  radial: { cx: number; cy: number; rx: number; ry: number; angle: number; feather: number; invert: boolean }
  adjustments: AdjustmentValues
}

export interface HistorySnapshot {
  adjustments: AdjustmentValues
  hslAdjustments: HSLAdjustments
  maskLayers: SerializedMaskLayer[]
  cropState: CropState
  imageSrc: string   // 裁切/旋转/翻转后图片 dataUrl，撤销时需要一并恢复
}

const MAX_HISTORY = 30

export function useHistoryState() {
  const stack = ref<HistorySnapshot[]>([])
  const cursor = ref(-1)  // 当前所在位置

  /** 保存一个快照（在 cursor 之后的记录全部丢弃） */
  const push = (snapshot: HistorySnapshot) => {
    // 丢弃 cursor 之后的分支
    stack.value.splice(cursor.value + 1)
    stack.value.push(JSON.parse(JSON.stringify(snapshot)))
    // 超出上限时丢弃最旧的
    if (stack.value.length > MAX_HISTORY) {
      stack.value.shift()
    }
    cursor.value = stack.value.length - 1
    console.log(
      `[History] push #${cursor.value}`,
      `adjustments:`, { ...snapshot.adjustments },
      `hsl keys:`, Object.keys(snapshot.hslAdjustments),
      `maskLayers:`, snapshot.maskLayers.length,
      `cropState:`, snapshot.cropState,
      `stack size:`, stack.value.length
    )
  }

  /** 撤销：返回上一个快照，无法撤销时返回 null */
  const undo = (): HistorySnapshot | null => {
    if (cursor.value <= 0) {
      console.log('[History] undo: nothing to undo, cursor=', cursor.value)
      return null
    }
    cursor.value--
    console.log(`[History] undo → #${cursor.value}`, stack.value[cursor.value].adjustments)
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 重做：返回下一个快照，无法重做时返回 null */
  const redo = (): HistorySnapshot | null => {
    if (cursor.value >= stack.value.length - 1) {
      console.log('[History] redo: nothing to redo, cursor=', cursor.value)
      return null
    }
    cursor.value++
    console.log(`[History] redo → #${cursor.value}`, stack.value[cursor.value].adjustments)
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 切换图片时清空历史 */
  const clear = () => {
    stack.value = []
    cursor.value = -1
  }

  const canUndo = () => cursor.value > 0
  const canRedo = () => cursor.value < stack.value.length - 1

  return { push, undo, redo, clear, canUndo, canRedo, cursor, stack }
}
