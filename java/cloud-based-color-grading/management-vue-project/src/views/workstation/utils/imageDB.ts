/**
 * IndexedDB 封装 - 图片存储
 * 用于持久化存储用户上传的图片，实现刷新后数据不丢失
 */

const DB_NAME = 'WorkstationDB'
const DB_VERSION = 3
const STORE_NAME = 'images'

export interface ImageDBItem {
  id: number
  name: string
  blob: Blob
  src: string
  thumbnail?: string // 压缩缩略图 base64（用于全览区显示）
  uploadTime: Date
  lastModified: Date
  fileHash?: string // 文件唯一标识：名称+大小+格式
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

        // 创建图片存储表
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('uploadTime', 'uploadTime', { unique: false })
          objectStore.createIndex('name', 'name', { unique: false })
          objectStore.createIndex('fileHash', 'fileHash', { unique: false })
        } else if (oldVersion < 2) {
          // 从版本1升级到版本2：添加 fileHash 索引
          const objectStore = transaction.objectStore(STORE_NAME)
          
          if (!objectStore.indexNames.contains('fileHash')) {
            objectStore.createIndex('fileHash', 'fileHash', { unique: false })
          }
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
}

// 导出单例实例
export const imageDB = new ImageDatabase()
