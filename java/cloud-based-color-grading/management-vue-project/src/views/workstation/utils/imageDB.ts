/**
 * IndexedDB 封装 - 图片存储
 * 用于持久化存储用户上传的图片，实现刷新后数据不丢失
 */

const DB_NAME = 'WorkstationDB'
const DB_VERSION = 6
const STORE_NAME = 'images'
const HISTORY_STORE = 'history'

export interface ImageDBItem {
  id: number
  name: string
  blob: Blob          // 原始图片（永不覆盖）
  src: string         // 原始图片 dataUrl（永不覆盖）
  editedSrc?: string  // 裁切/旋转/翻转后的图片 dataUrl（可选，有则优先用于预览）
  cropStateJson?: string // 非破坏性裁切参数 JSON（CropState）
  thumbnail?: string
  uploadTime: Date
  lastModified: Date
  fileHash?: string
  adjustmentsJson?: string
}

class ImageDatabase {
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        const transaction = (event.target as IDBOpenDBRequest).transaction!

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('uploadTime', 'uploadTime', { unique: false })
          objectStore.createIndex('name', 'name', { unique: false })
          objectStore.createIndex('fileHash', 'fileHash', { unique: false })
        } else if (oldVersion < 2) {
          const objectStore = transaction.objectStore(STORE_NAME)
          if (!objectStore.indexNames.contains('fileHash')) {
            objectStore.createIndex('fileHash', 'fileHash', { unique: false })
          }
        }
        // v3→v4: adjustmentsJson 是普通字段，无需建索引，自动兼容旧记录（值为 undefined）
        // v4→v5: editedSrc / cropStateJson 是普通字段，自动兼容旧记录（值为 undefined）
        // v5→v6: 新增 history store（撤销/重做历史栈持久化）
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const hs = db.createObjectStore(HISTORY_STORE, { keyPath: 'key' })
          hs.createIndex('imageId', 'imageId', { unique: false })
        }
      }
    })
  }

  /**
   * 保存图片到数据库
   */
  async saveImage(image: ImageDBItem): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.put(image)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save image'))
    })
  }

  /**
   * 获取所有图片
   */
  async getAllImages(): Promise<ImageDBItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const images = request.result as ImageDBItem[]
        // 按上传时间排序
        images.sort((a, b) => new Date(a.uploadTime).getTime() - new Date(b.uploadTime).getTime())
        resolve(images)
      }
      request.onerror = () => reject(new Error('Failed to get images'))
    })
  }

  /**
   * 根据ID获取图片
   */
  async getImage(id: number): Promise<ImageDBItem | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Failed to get image'))
    })
  }

  /**
   * 清除裁切数据（删除 editedSrc 和 cropStateJson 字段，恢复原图）
   */
  async clearCropData(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const getReq = objectStore.get(id)
      getReq.onsuccess = () => {
        const record = getReq.result
        if (!record) { resolve(); return }
        delete record.editedSrc
        delete record.cropStateJson
        record.lastModified = new Date()
        const putReq = objectStore.put(record)
        putReq.onsuccess = () => resolve()
        putReq.onerror  = () => reject(new Error('Failed to clear crop data'))
      }
      getReq.onerror = () => reject(new Error('Failed to get record for clear crop'))
    })
  }

  /**
   * 仅更新 editedSrc 和 cropStateJson（不重写 blob/src，保留原图）
   */
  async updateCropData(id: number, editedSrc: string, cropStateJson: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const getReq = objectStore.get(id)
      getReq.onsuccess = () => {
        const record = getReq.result
        if (!record) { resolve(); return }
        record.editedSrc     = editedSrc
        record.cropStateJson = cropStateJson
        record.lastModified  = new Date()
        const putReq = objectStore.put(record)
        putReq.onsuccess = () => resolve()
        putReq.onerror  = () => reject(new Error('Failed to update crop data'))
      }
      getReq.onerror = () => reject(new Error('Failed to get record for crop update'))
    })
  }

  /**
   * 获取裁切数据（editedSrc + cropStateJson）
   */
  async getCropData(id: number): Promise<{ editedSrc?: string; cropStateJson?: string } | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.get(id)
      request.onsuccess = () => {
        const r = request.result
        if (!r) { resolve(null); return }
        resolve({ editedSrc: r.editedSrc, cropStateJson: r.cropStateJson })
      }
      request.onerror = () => reject(new Error('Failed to get crop data'))
    })
  }

  /**
   * 仅更新某条记录的 adjustmentsJson 字段（不重写 blob，性能更好）
   */
  async updateAdjustments(id: number, adjustmentsJson: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const getReq = objectStore.get(id)
      getReq.onsuccess = () => {
        const record = getReq.result
        if (!record) { resolve(); return }
        record.adjustmentsJson = adjustmentsJson
        record.lastModified = new Date()
        const putReq = objectStore.put(record)
        putReq.onsuccess = () => resolve()
        putReq.onerror  = () => reject(new Error('Failed to update adjustments'))
      }
      getReq.onerror = () => reject(new Error('Failed to get record for update'))
    })
  }

  /**
   * 获取某条记录的 adjustmentsJson 字段
   */
  async getAdjustments(id: number): Promise<string | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.get(id)
      request.onsuccess = () => resolve(request.result?.adjustmentsJson ?? null)
      request.onerror  = () => reject(new Error('Failed to get adjustments'))
    })
  }

  /**
   * 删除图片
   */
  async deleteImage(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete image'))
    })
  }

  /**
   * 清空所有图片
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear images'))
    })
  }

  /**
   * 根据文件哈希检查图片是否已存在
   */
  async existsByHash(fileHash: string): Promise<boolean> {
    if (!this.db) await this.init()

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly')
        const objectStore = transaction.objectStore(STORE_NAME)
        
        // 检查索引是否存在
        if (!objectStore.indexNames.contains('fileHash')) {
          resolve(false)
          return
        }
        
        const index = objectStore.index('fileHash')
        const request = index.get(fileHash)

        request.onsuccess = () => resolve(!!request.result)
        request.onerror = () => {
          console.warn('检查图片是否存在时出错')
          resolve(false)
        }
      } catch (error) {
        console.warn('检查图片是否存在时出错:', error)
        resolve(false)
      }
    })
  }

  /**
   * 获取数据库中图片数量
   */
  async getCount(): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get count'))
    })
  }
  // ── 历史栈持久化 ──────────────────────────────────────────────

  /**
   * 写入一条历史记录
   * key = `${imageId}_${step}`，imageId 用于按图片隔离
   */
  async saveHistoryItem(imageId: number, step: number, snapshotJson: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite')
      const store = tx.objectStore(HISTORY_STORE)
      store.put({ key: `${imageId}_${step}`, imageId, step, snapshotJson, savedAt: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to save history item'))
    })
  }

  /** 读取某张图片的全部历史记录，按 step 升序 */
  async loadHistory(imageId: number): Promise<{ step: number; snapshotJson: string }[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readonly')
      const index = tx.objectStore(HISTORY_STORE).index('imageId')
      const req = index.getAll(imageId)
      req.onsuccess = () => {
        const items = (req.result as { step: number; snapshotJson: string }[])
        items.sort((a, b) => a.step - b.step)
        resolve(items)
      }
      req.onerror = () => reject(new Error('Failed to load history'))
    })
  }

  /** 删除某张图片从 fromStep 开始（含）的所有历史记录（用于 push 时丢弃分支） */
  async deleteHistoryFrom(imageId: number, fromStep: number): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite')
      const store = tx.objectStore(HISTORY_STORE)
      const index = store.index('imageId')
      const req = index.getAll(imageId)
      req.onsuccess = () => {
        const items = req.result as { key: string; step: number }[]
        items.filter(i => i.step >= fromStep).forEach(i => store.delete(i.key))
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to delete history'))
    })
  }

  /** 清除某张图片的全部历史记录 */
  async clearHistory(imageId: number): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite')
      const store = tx.objectStore(HISTORY_STORE)
      const index = store.index('imageId')
      const req = index.getAll(imageId)
      req.onsuccess = () => {
        const items = req.result as { key: string }[]
        items.forEach(i => store.delete(i.key))
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to clear history'))
    })
  }
}

// 导出单例实例
export const imageDB = new ImageDatabase()
