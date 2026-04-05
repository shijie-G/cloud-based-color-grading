/**
 * Repository 抽象基类
 * 固定执行流程：日志 → DB操作 → 服务器同步
 * 子类只需实现 doExecute()，特殊表可重写整个 execute()
 */

export type OpType =
  | 'save'       // 新建 / 覆盖写入
  | 'update'     // 局部字段更新
  | 'delete'     // 单条删除
  | 'deleteAll'  // 清空整表
  | 'clearCrop'  // 清除裁切数据（editedSrc + cropStateJson）
  | 'savePack'   // history 整包写入
  | 'clearPack'  // history 整包删除

export abstract class BaseRepository<TData> {
  abstract readonly tableName: string

  /** 固定流程入口 */
  async execute(opType: OpType, data: TData): Promise<void> {
    this.log(opType, data)
    await this.doExecute(opType, data)
    await this.sync(opType, data)
  }

  /** 子类必须实现：具体 IndexedDB 操作 */
  protected abstract doExecute(opType: OpType, data: TData): Promise<void>

  /** 统一日志 */
  protected log(opType: OpType, data: TData): void {
    console.log(`[${this.tableName}] op=${opType}`, data)
  }

  /**
   * 服务器同步（预留）
   * 未来接入后端时在此扩展，无需改子类
   * e.g. await api.post(`/sync/${this.tableName}`, { opType, data })
   */
  protected async sync(_opType: OpType, _data: TData): Promise<void> {
    // TODO: 接入服务器同步
  }
}
