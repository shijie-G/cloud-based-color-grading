/**
 * 撤销 / 重做历史栈
 * - 内存：快照栈 + cursor
 * - 持久化：异步队列写入 IndexedDB history store，刷新后可恢复
 */
import { ref } from 'vue'
import type { AdjustmentValues } from '../component-interfaces'
import type { HSLAdjustments } from './useHSLProcessor'
import type { CropState } from '../types/cropTypes'
import { imageDB } from '../utils/imageDB'

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
  imageSrc: string
}

const MAX_HISTORY = 30

export function useHistoryState() {
  const stack = ref<HistorySnapshot[]>([])
  const cursor = ref(-1)
  let currentImageId: number | null = null

  // ── 异步写入队列（串行，避免并发冲突） ──────────────────────
  let writeQueue: Promise<void> = Promise.resolve()

  const enqueue = (fn: () => Promise<void>) => {
    writeQueue = writeQueue.then(fn).catch(e => console.warn('[History] DB write error:', e))
  }

  /** 保存一个快照（在 cursor 之后的记录全部丢弃，同步删除 DB） */
  const push = (snapshot: HistorySnapshot) => {
    const discardFrom = cursor.value + 1

    // 内存：丢弃分支
    stack.value.splice(discardFrom)
    stack.value.push(JSON.parse(JSON.stringify(snapshot)))
    if (stack.value.length > MAX_HISTORY) stack.value.shift()
    cursor.value = stack.value.length - 1

    const step = cursor.value
    const snap = JSON.stringify(snapshot)

    console.log(
      `[History] push #${step}`,
      `adjustments:`, { ...snapshot.adjustments },
      `maskLayers:`, snapshot.maskLayers.length,
      `cropState:`, snapshot.cropState,
      `stack size:`, stack.value.length
    )

    // DB：先删除分支，再追加写入
    if (currentImageId != null) {
      const imageId = currentImageId
      enqueue(async () => {
        if (discardFrom <= step) await imageDB.deleteHistoryFrom(imageId, discardFrom)
        await imageDB.saveHistoryItem(imageId, step, snap)
      })
    }
  }

  /** 撤销：返回上一个快照 */
  const undo = (): HistorySnapshot | null => {
    if (cursor.value <= 0) {
      console.log('[History] undo: nothing to undo, cursor=', cursor.value)
      return null
    }
    cursor.value--
    console.log(`[History] undo → #${cursor.value}`, stack.value[cursor.value].adjustments)
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 重做：返回下一个快照 */
  const redo = (): HistorySnapshot | null => {
    if (cursor.value >= stack.value.length - 1) {
      console.log('[History] redo: nothing to redo, cursor=', cursor.value)
      return null
    }
    cursor.value++
    console.log(`[History] redo → #${cursor.value}`, stack.value[cursor.value].adjustments)
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 切换图片时清空内存栈 + 清空 DB 历史，并从 DB 恢复新图片的历史 */
  const switchImage = async (imageId: number) => {
    // 清空旧图片的内存栈
    stack.value = []
    cursor.value = -1
    currentImageId = imageId

    // 从 DB 恢复该图片的历史
    try {
      const items = await imageDB.loadHistory(imageId)
      if (items.length > 0) {
        stack.value = items.map(i => JSON.parse(i.snapshotJson))
        cursor.value = stack.value.length - 1
        console.log(`[History] restored ${items.length} steps for image ${imageId}`)
      }
    } catch (e) {
      console.warn('[History] failed to restore history:', e)
    }
  }

  /** 清空内存栈 + 清空 DB 历史（切换图片时调用） */
  const clear = (imageId?: number) => {
    stack.value = []
    cursor.value = -1
    const id = imageId ?? currentImageId
    if (id != null) {
      enqueue(() => imageDB.clearHistory(id))
    }
  }

  const canUndo = () => cursor.value > 0
  const canRedo = () => cursor.value < stack.value.length - 1

  return { push, undo, redo, clear, switchImage, canUndo, canRedo, cursor, stack }
}
