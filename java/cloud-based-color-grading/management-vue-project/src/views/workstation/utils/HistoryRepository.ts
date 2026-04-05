/**
 * history 表 Repository
 * 负责撤销/重做历史栈的整包写入与清除
 *
 * 特殊处理：重写 execute()，跳过 sync 步骤
 * 原因：历史栈是纯本地数据，不需要上传服务器
 *
 * 对应原有调用方：
 *   useHistoryState.ts → savePack（防抖 300ms 后触发）/ clearPack
 */

import { BaseRepository, type OpType } from './BaseRepository'
import { imageDB } from './imageDB'

export interface HistoryRepoData {
  imageId: number
  packJson?: string
}

class HistoryRepository extends BaseRepository<HistoryRepoData> {
  readonly tableName = 'history'

  /** 重写整个 execute：跳过 sync，历史栈不上传服务器 */
  async execute(opType: OpType, data: HistoryRepoData): Promise<void> {
    this.log(opType, data)
    await this.doExecute(opType, data)
    // 不调用 sync()
  }

  protected async doExecute(opType: OpType, data: HistoryRepoData): Promise<void> {
    switch (opType) {
      case 'savePack': {
        await imageDB.saveHistoryPack(data.imageId, data.packJson!)
        break
      }

      case 'clearPack': {
        await imageDB.clearHistory(data.imageId)
        break
      }
    }
  }
}

export const historyRepo = new HistoryRepository()
