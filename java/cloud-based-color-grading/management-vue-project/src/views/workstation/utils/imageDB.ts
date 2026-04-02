/**
 * IndexedDB 封装 - 图片存储
 * 用于持久化存储用户上传的图片，实现刷新后数据不丢失
 */

const DB_NAME = 'WorkstationDB'
const DB_VERSION = 8  // 升级到 v8 添加 Personalize 支持
const STORE_NAME = 'images'
const HISTORY_STORE = 'history'
const ALBUMS_STORE = 'albums'  // Gallery 相册表
const PERSONALIZE_PROJECTS_STORE = 'personalizeProjects'  // Personalize 项目表

// 特殊相册 ID：非分配图片（从 Workstation 直接上传的图片）
export const UNASSIGNED_ALBUM_ID = -1

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

  // ========== Gallery 扩展字段（可选） ==========
  albumId?: number      // 所属相册 ID（Gallery 专用）
  isFavorite?: boolean  // 是否收藏（Gallery 专用）
  favoritedAt?: number  // 收藏时间戳
  isDeleted?: boolean   // 是否在回收站（软删除，Gallery 专用）
  deletedAt?: number    // 删除时间戳
  tags?: string[]       // 标签数组（Gallery 专用）
  sortOrder?: number    // 相册内排序权重（Gallery 专用）
}

// Gallery 相册接口
export interface AlbumRecord {
  id: number
  name: string
  createdAt: number
  sortOrder: number
  coverImageId?: number
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

        // v1: 创建 images store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('uploadTime', 'uploadTime', { unique: false })
          objectStore.createIndex('name', 'name', { unique: false })
          objectStore.createIndex('fileHash', 'fileHash', { unique: false })
          // v7: 同时创建 Gallery 索引（新数据库直接包含）
          objectStore.createIndex('albumId', 'albumId', { unique: false })
          objectStore.createIndex('isFavorite', 'isFavorite', { unique: false })
          objectStore.createIndex('isDeleted', 'isDeleted', { unique: false })
        } else {
          // 已存在 images store，逐步升级
          const objectStore = transaction.objectStore(STORE_NAME)

          // v2: 添加 fileHash 索引
          if (oldVersion < 2 && !objectStore.indexNames.contains('fileHash')) {
            objectStore.createIndex('fileHash', 'fileHash', { unique: false })
          }

          // v7: 添加 Gallery 索引
          if (oldVersion < 7) {
            if (!objectStore.indexNames.contains('albumId')) {
              objectStore.createIndex('albumId', 'albumId', { unique: false })
            }
            if (!objectStore.indexNames.contains('isFavorite')) {
              objectStore.createIndex('isFavorite', 'isFavorite', { unique: false })
            }
            if (!objectStore.indexNames.contains('isDeleted')) {
              objectStore.createIndex('isDeleted', 'isDeleted', { unique: false })
            }
          }
        }

        // v3→v4: adjustmentsJson 是普通字段，无需建索引，自动兼容旧记录（值为 undefined）
        // v4→v5: editedSrc / cropStateJson 是普通字段，自动兼容旧记录（值为 undefined）

        // v5→v6: 新增 history store（撤销/重做历史栈持久化）
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const hs = db.createObjectStore(HISTORY_STORE, { keyPath: 'key' })
          hs.createIndex('imageId', 'imageId', { unique: false })
        }

        // v7: 新增 albums store（Gallery 相册表）
        if (!db.objectStoreNames.contains(ALBUMS_STORE)) {
          const albumStore = db.createObjectStore(ALBUMS_STORE, { keyPath: 'id', autoIncrement: true })
          albumStore.createIndex('createdAt', 'createdAt', { unique: false })
          albumStore.createIndex('sortOrder', 'sortOrder', { unique: false })
        }

        // v8: 新增 personalizeProjects store（Personalize 项目表）
        if (!db.objectStoreNames.contains(PERSONALIZE_PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PERSONALIZE_PROJECTS_STORE, { keyPath: 'id' })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
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
   * 可选同时更新 editedSrc 用于 Gallery 预览
   */
  async updateAdjustments(id: number, adjustmentsJson: string, editedSrc?: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const getReq = objectStore.get(id)
      getReq.onsuccess = () => {
        const record = getReq.result
        if (!record) { resolve(); return }
        record.adjustmentsJson = adjustmentsJson
        if (editedSrc !== undefined) {
          record.editedSrc = editedSrc
        }
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
      const transaction = this.db!.transaction([STORE_NAME, HISTORY_STORE], 'readwrite')
      const imageStore = transaction.objectStore(STORE_NAME)
      const historyStore = transaction.objectStore(HISTORY_STORE)

      // 删除图片
      imageStore.delete(id)

      // 删除该图片的所有 history 记录
      const historyIndex = historyStore.index('imageId')
      const historyRequest = historyIndex.openCursor(IDBKeyRange.only(id))

      historyRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error('Failed to delete image and history'))
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

  // ── 历史栈持久化（整包存储，每张图片只有 1 条记录） ──────────

  /**
   * 覆盖写入整个历史包（base + diffs + cursor）
   * key = `history_${imageId}`，永远只有 1 条记录
   */
  async saveHistoryPack(imageId: number, packJson: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite')
      tx.objectStore(HISTORY_STORE).put({
        key: `history_${imageId}`,
        imageId,
        packJson,
        savedAt: Date.now(),
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to save history pack'))
    })
  }

  /** 读取整个历史包 */
  async loadHistoryPack(imageId: number): Promise<string | null> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readonly')
      const req = tx.objectStore(HISTORY_STORE).get(`history_${imageId}`)
      req.onsuccess = () => resolve(req.result?.packJson ?? null)
      req.onerror = () => reject(new Error('Failed to load history pack'))
    })
  }

  /** 清除某张图片的历史记录 */
  async clearHistory(imageId: number): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite')
      tx.objectStore(HISTORY_STORE).delete(`history_${imageId}`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Failed to clear history'))
    })
  }

  // 以下方法保留兼容旧调用，内部不再使用
  async saveHistoryItem(imageId: number, step: number, data: string, type: 'base' | 'diff' = 'base'): Promise<void> {
    // 已废弃，由 saveHistoryPack 替代
  }
  async loadHistory(imageId: number): Promise<{ step: number; type: 'base' | 'diff'; data: string }[]> {
    return []
  }
  async deleteHistoryFrom(imageId: number, fromStep: number): Promise<void> {
    // 已废弃，整包覆盖写入不需要按 step 删除
  }

  // ── Gallery 相册操作 ──────────────────────────────────────────────

  /**
   * 获取所有相册
   */
  async getAllAlbums(): Promise<AlbumRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ALBUMS_STORE], 'readonly')
      const objectStore = transaction.objectStore(ALBUMS_STORE)
      const request = objectStore.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get albums'))
    })
  }

  /**
   * 根据 ID 获取相册
   */
  async getAlbumById(id: number): Promise<AlbumRecord | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ALBUMS_STORE], 'readonly')
      const objectStore = transaction.objectStore(ALBUMS_STORE)
      const request = objectStore.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get album'))
    })
  }

  /**
   * 创建相册
   */
  async createAlbum(album: Omit<AlbumRecord, 'id'>): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ALBUMS_STORE], 'readwrite')
      const objectStore = transaction.objectStore(ALBUMS_STORE)
      const request = objectStore.add(album)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(new Error('Failed to create album'))
    })
  }

  /**
   * 更新相册
   */
  async updateAlbum(album: AlbumRecord): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ALBUMS_STORE], 'readwrite')
      const objectStore = transaction.objectStore(ALBUMS_STORE)
      const request = objectStore.put(album)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to update album'))
    })
  }

  /**
   * 删除相册（同时删除相册内所有图片）
   */
  async deleteAlbum(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ALBUMS_STORE, STORE_NAME], 'readwrite')
      const albumStore = transaction.objectStore(ALBUMS_STORE)
      const imageStore = transaction.objectStore(STORE_NAME)
      const index = imageStore.index('albumId')

      // 删除相册内所有图片
      const imageRequest = index.openCursor(IDBKeyRange.only(id))
      imageRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      // 删除相册
      albumStore.delete(id)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error('Failed to delete album'))
    })
  }

  // ── Gallery 图片查询 ──────────────────────────────────────────────

  /**
   * 获取相册内所有图片（不包括已删除）
   */
  async getImagesByAlbum(albumId: number): Promise<ImageDBItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('albumId')
      const request = index.getAll(IDBKeyRange.only(albumId))

      request.onsuccess = () => {
        const images = request.result.filter((img: ImageDBItem) => !img.isDeleted)
        resolve(images)
      }
      request.onerror = () => reject(new Error('Failed to get images by album'))
    })
  }

  /**
   * 获取所有收藏图片（不包括已删除）
   */
  async getFavoriteImages(): Promise<ImageDBItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('isFavorite')
      const request = index.getAll(IDBKeyRange.only(true))

      request.onsuccess = () => {
        const images = request.result.filter((img: ImageDBItem) => !img.isDeleted)
        resolve(images)
      }
      request.onerror = () => reject(new Error('Failed to get favorite images'))
    })
  }

  /**
   * 获取回收站图片
   */
  async getDeletedImages(): Promise<ImageDBItem[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('isDeleted')
      const request = index.getAll(IDBKeyRange.only(true))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get deleted images'))
    })
  }

  /**
   * 批量更新图片
   */
  async updateImages(images: ImageDBItem[]): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)

      let completed = 0
      images.forEach((image) => {
        const request = objectStore.put(image)
        request.onsuccess = () => {
          completed++
          if (completed === images.length) {
            resolve()
          }
        }
      })

      transaction.onerror = () => reject(new Error('Failed to update images'))
    })
  }

  // ── Personalize 项目操作 ──────────────────────────────────────────────

  /**
   * 保存个性化项目
   */
  async savePersonalizeProject(project: PersonalizeProjectData): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONALIZE_PROJECTS_STORE], 'readwrite')
      const objectStore = transaction.objectStore(PERSONALIZE_PROJECTS_STORE)
      const request = objectStore.put(project)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save personalize project'))
    })
  }

  /**
   * 获取个性化项目
   */
  async getPersonalizeProject(id: string): Promise<PersonalizeProjectData | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONALIZE_PROJECTS_STORE], 'readonly')
      const objectStore = transaction.objectStore(PERSONALIZE_PROJECTS_STORE)
      const request = objectStore.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Failed to get personalize project'))
    })
  }

  /**
   * 删除个性化项目
   */
  async deletePersonalizeProject(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONALIZE_PROJECTS_STORE], 'readwrite')
      const objectStore = transaction.objectStore(PERSONALIZE_PROJECTS_STORE)
      const request = objectStore.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete personalize project'))
    })
  }
}

// Personalize 项目数据接口
export interface PersonalizeProjectData {
  id: string
  name: string
  baseImageId: number | null
  layers: LayerData[]
  createdAt: number
  updatedAt: number
}

export interface LayerData {
  id: string
  name: string
  type: 'image' | 'text' | 'shape'
  visible: boolean
  locked: boolean
  opacity: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number

  // 图片图层
  imageId?: number
  strokeColor?: string
  strokeWidth?: number

  // 文字图层
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string

  // 形状图层
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow' | 'pentagon' | 'hexagon'
  fillColor?: string
}

// 导出单例实例
export const imageDB = new ImageDatabase()
