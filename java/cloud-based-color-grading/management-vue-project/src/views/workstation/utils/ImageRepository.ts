/**
 * images 表 Repository
 * 负责图片的新建、局部更新、删除、清空
 *
 * 对应原有调用方：
 *   imageUploadHelper.ts   → save
 *   useImageStorage.ts     → save / update / delete / deleteAll
 *   useGalleryDB.ts        → save / update / delete
 *   usePersonalizeStorage.ts → update (personalizeLayersJson)
 *   WorkstationPage.vue    → update (filterConfigJson / adjustmentsJson)
 */

import { BaseRepository, type OpType } from './BaseRepository'
import { imageDB, type ImageDBItem } from './imageDB'

/** update 操作的数据结构：局部字段更新 */
export interface ImageUpdateData {
  id: number
  /** 要更新的主字段名 */
  field: keyof ImageDBItem
  /** 主字段的新值 */
  value: unknown
  /** 同时更新的其他字段（可选） */
  extra?: Partial<ImageDBItem>
}

export type ImageRepoData = ImageDBItem | ImageUpdateData | { id: number }

class ImageRepository extends BaseRepository<ImageRepoData> {
  readonly tableName = 'images'

  protected async doExecute(opType: OpType, data: ImageRepoData): Promise<void> {
    switch (opType) {
      case 'save': {
        await imageDB.saveImage(data as ImageDBItem)
        break
      }

      case 'update': {
        const { id, field, value, extra } = data as ImageUpdateData
        const record = await imageDB.getImage(id)
        if (!record) return
        ;(record as Record<string, unknown>)[field as string] = value
        if (extra) Object.assign(record, extra)
        record.lastModified = new Date()
        await imageDB.saveImage(record)
        break
      }

      case 'clearCrop': {
        // 清除 editedSrc 和 cropStateJson（恢复原图展示）
        const record = await imageDB.getImage((data as { id: number }).id)
        if (!record) return
        delete record.editedSrc
        delete record.cropStateJson
        record.lastModified = new Date()
        await imageDB.saveImage(record)
        break
      }

      case 'delete': {
        await imageDB.deleteImage((data as { id: number }).id)
        break
      }

      case 'deleteAll': {
        await imageDB.clearAll()
        break
      }
    }
  }
}

export const imageRepo = new ImageRepository()
