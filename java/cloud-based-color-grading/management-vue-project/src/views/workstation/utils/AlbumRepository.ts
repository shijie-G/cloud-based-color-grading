/**
 * albums 表 Repository
 * 负责相册的创建、更新、删除（级联删除相册内所有图片）
 *
 * 对应原有调用方：
 *   useAlbumState.ts  → save / update / delete
 *   useGalleryDB.ts   → save / update / delete（透传层）
 */

import { BaseRepository, type OpType } from './BaseRepository'
import { imageDB, type AlbumRecord } from './imageDB'

export type AlbumRepoData = Omit<AlbumRecord, 'id'> | AlbumRecord | { id: number }

class AlbumRepository extends BaseRepository<AlbumRepoData> {
  readonly tableName = 'albums'

  protected async doExecute(opType: OpType, data: AlbumRepoData): Promise<void> {
    switch (opType) {
      case 'save': {
        await imageDB.createAlbum(data as Omit<AlbumRecord, 'id'>)
        break
      }

      case 'update': {
        await imageDB.updateAlbum(data as AlbumRecord)
        break
      }

      case 'delete': {
        // 级联删除相册内所有图片
        await imageDB.deleteAlbum((data as { id: number }).id)
        break
      }
    }
  }

  /**
   * 创建相册并返回新 id
   * 走完整流程（日志 + DB + sync），同时返回自增 id
   */
  async create(album: Omit<AlbumRecord, 'id'>): Promise<number> {
    this.log('save', album)
    const id = await imageDB.createAlbum(album)
    await this.sync('save', album)
    return id
  }
}

export const albumRepo = new AlbumRepository()
