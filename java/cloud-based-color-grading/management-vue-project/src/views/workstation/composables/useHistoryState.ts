/**
 * 撤销 / 重做历史栈（base + diff 增量 + 整包单条存储）
 *
 * DB 存储策略：
 *   整个历史栈打包成 1 个 JSON → 覆盖写入 DB 的同一条记录
 *   key = `history_${imageId}`，每张图片永远只有 1 条 DB 记录
 *
 * 包结构：
 *   { base: HistorySnapshot, diffs: SnapshotDiff[], cursor: number }
 *   base = step0 完整快照
 *   diffs[i] = step(i+1) 相对 step(i) 的增量
 *
 * 内存：完整快照数组（undo/redo 纯内存，不读 DB）
 */
import { ref } from 'vue'
import type { AdjustmentValues } from '../component-interfaces'
import type { HSLAdjustments } from './useHSLProcessor'
import type { CropState } from '../types/cropTypes'
import { imageDB } from '../utils/imageDB'
import { historyRepo } from '../utils/HistoryRepository'

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

type SnapshotDiff = Partial<HistorySnapshot>

interface HistoryPack {
  base: HistorySnapshot
  diffs: SnapshotDiff[]
  cursor: number
}

const MAX_HISTORY = 30

// ── diff 工具 ─────────────────────────────────────────────────

function computeDiff(prev: HistorySnapshot, next: HistorySnapshot): SnapshotDiff {
  const diff: SnapshotDiff = {}
  for (const key of Object.keys(next) as (keyof HistorySnapshot)[]) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
      (diff as Record<string, unknown>)[key] = next[key]
    }
  }
  return diff
}

function replayDiffs(base: HistorySnapshot, diffs: SnapshotDiff[]): HistorySnapshot[] {
  const result: HistorySnapshot[] = [JSON.parse(JSON.stringify(base))]
  for (const diff of diffs) {
    result.push({ ...JSON.parse(JSON.stringify(result[result.length - 1])), ...JSON.parse(JSON.stringify(diff)) })
  }
  return result
}

// ── composable ────────────────────────────────────────────────

export function useHistoryState() {
  const stack = ref<HistorySnapshot[]>([])
  const cursor = ref(-1)
  let currentImageId: number | null = null

  // 防抖写入：操作停止 300ms 后才写 DB，避免连续操作频繁写入
  let dbTimer: ReturnType<typeof setTimeout> | null = null
  let writeQueue: Promise<void> = Promise.resolve()

  const enqueue = (fn: () => Promise<void>) => {
    writeQueue = writeQueue.then(fn).catch(e => console.warn('[History] DB write error:', e))
  }

  /** 将当前内存栈序列化为整包 JSON */
  const serializePack = (): string => {
    if (stack.value.length === 0) return ''
    const base = stack.value[0]
    const diffs: SnapshotDiff[] = []
    for (let i = 1; i < stack.value.length; i++) {
      diffs.push(computeDiff(stack.value[i - 1], stack.value[i]))
    }
    const pack: HistoryPack = { base, diffs, cursor: cursor.value }
    return JSON.stringify(pack)
  }

  /** 防抖写入 DB（300ms 无操作后写入） */
  const scheduleSaveToDB = () => {
    if (currentImageId == null) return
    if (dbTimer) clearTimeout(dbTimer)
    const imageId = currentImageId
    dbTimer = setTimeout(() => {
      const packJson = serializePack()
      if (!packJson) return
      enqueue(() => historyRepo.execute('savePack', { imageId, packJson }))
    }, 300)
  }

  /** 保存一个快照 */
  const push = (snapshot: HistorySnapshot) => {
    const discardFrom = cursor.value + 1
    stack.value.splice(discardFrom)
    stack.value.push(JSON.parse(JSON.stringify(snapshot)))
    if (stack.value.length > MAX_HISTORY) stack.value.shift()
    cursor.value = stack.value.length - 1

    console.log(
      `[History] push #${cursor.value}`,
      `adjustments:`, { ...snapshot.adjustments },
      `maskLayers:`, snapshot.maskLayers.length,
      `stack size:`, stack.value.length
    )

    scheduleSaveToDB()
  }

  /** 撤销 */
  const undo = (): HistorySnapshot | null => {
    if (cursor.value <= 0) {
      console.log('[History] undo: nothing to undo, cursor=', cursor.value)
      return null
    }
    cursor.value--
    console.log(`[History] undo → #${cursor.value}`)
    scheduleSaveToDB()  // 更新 cursor 到 DB
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 重做 */
  const redo = (): HistorySnapshot | null => {
    if (cursor.value >= stack.value.length - 1) {
      console.log('[History] redo: nothing to redo, cursor=', cursor.value)
      return null
    }
    cursor.value++
    console.log(`[History] redo → #${cursor.value}`)
    scheduleSaveToDB()
    return JSON.parse(JSON.stringify(stack.value[cursor.value]))
  }

  /** 切换图片：清空内存，从 DB 恢复 */
  const switchImage = async (imageId: number) => {
    if (dbTimer) { clearTimeout(dbTimer); dbTimer = null }
    stack.value = []
    cursor.value = -1
    currentImageId = imageId

    try {
      const packJson = await imageDB.loadHistoryPack(imageId)
      if (!packJson) return
      const pack: HistoryPack = JSON.parse(packJson)
      stack.value = replayDiffs(pack.base, pack.diffs)
      cursor.value = Math.min(pack.cursor, stack.value.length - 1)
      console.log(`[History] restored ${stack.value.length} steps for image ${imageId}`)
    } catch (e) {
      console.warn('[History] failed to restore history:', e)
    }
  }

  /** 清空内存 + DB */
  const clear = (imageId?: number) => {
    if (dbTimer) { clearTimeout(dbTimer); dbTimer = null }
    stack.value = []
    cursor.value = -1
    const id = imageId ?? currentImageId
    if (id != null) enqueue(() => historyRepo.execute('clearPack', { imageId: id }))
  }

  const canUndo = () => cursor.value > 0
  const canRedo = () => cursor.value < stack.value.length - 1

  return { push, undo, redo, clear, switchImage, canUndo, canRedo, cursor, stack }
}
