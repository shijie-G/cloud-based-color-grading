import type { AlbumRecord, ImageRecord } from '../types/gallery'

const DB_NAME = 'GalleryDB'
const DB_VERSION = 1
const ALBUMS_STORE = 'albums'
const IMAGES_STORE = 'images'

let dbInstance: IDBDatabase | null = null

/**
 * 初始化 IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建相册对象仓库
      if (!db.objectStoreNames.contains(ALBUMS_STORE)) {
        const albumStore = db.createObjectStore(ALBUMS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        })
        albumStore.createIndex('createdAt', 'createdAt', { unique: false })
        albumStore.createIndex('sortOrder', 'sortOrder', { unique: false })
      }

      // 创建图片对象仓库
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        const imageStore = db.createObjectStore(IMAGES_STORE, {
          keyPath: 'id',
          autoIncrement: true
        })
        imageStore.createIndex('albumId', 'albumId', { unique: false })
        imageStore.createIndex('isFavorite', 'isFavorite', { unique: false })
        imageStore.createIndex('isDeleted', 'isDeleted', { unique: false })
        imageStore.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
    }
  })
}

/**
 * IndexedDB 操作封装
 */
export function useGalleryDB() {
  // ==================== 相册操作 ====================

  /**
   * 获取所有相册
   */
  async function getAllAlbums(): Promise<AlbumRecord[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ALBUMS_STORE, 'readonly')
      const store = transaction.objectStore(ALBUMS_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 根据 ID 获取相册
   */
  async function getAlbumById(id: number): Promise<AlbumRecord | undefined> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ALBUMS_STORE, 'readonly')
      const store = transaction.objectStore(ALBUMS_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 创建相册
   */
  async function createAlbum(album: Omit<AlbumRecord, 'id'>): Promise<number> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ALBUMS_STORE, 'readwrite')
      const store = transaction.objectStore(ALBUMS_STORE)
      const request = store.add(album)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新相册
   */
  async function updateAlbum(album: AlbumRecord): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ALBUMS_STORE, 'readwrite')
      const store = transaction.objectStore(ALBUMS_STORE)
      const request = store.put(album)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除相册（同时删除相册内所有图片）
   */
  async function deleteAlbum(id: number): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALBUMS_STORE, IMAGES_STORE], 'readwrite')
      const albumStore = transaction.objectStore(ALBUMS_STORE)
      const imageStore = transaction.objectStore(IMAGES_STORE)
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
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // ==================== 图片操作 ====================

  /**
   * 获取相册内所有图片
   */
  async function getImagesByAlbum(albumId: number): Promise<ImageRecord[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readonly')
      const store = transaction.objectStore(IMAGES_STORE)
      const index = store.index('albumId')
      const request = index.getAll(IDBKeyRange.only(albumId))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 根据 ID 获取图片
   */
  async function getImageById(id: number): Promise<ImageRecord | undefined> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readonly')
      const store = transaction.objectStore(IMAGES_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 添加图片
   */
  async function addImage(image: Omit<ImageRecord, 'id'>): Promise<number> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)
      const request = store.add(image)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量添加图片
   */
  async function addImages(images: Omit<ImageRecord, 'id'>[]): Promise<number[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)
      const ids: number[] = []

      let completed = 0
      images.forEach((image) => {
        const request = store.add(image)
        request.onsuccess = () => {
          ids.push(request.result as number)
          completed++
          if (completed === images.length) {
            resolve(ids)
          }
        }
      })

      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * 更新图片
   */
  async function updateImage(image: ImageRecord): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)
      const request = store.put(image)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量更新图片
   */
  async function updateImages(images: ImageRecord[]): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)

      let completed = 0
      images.forEach((image) => {
        const request = store.put(image)
        request.onsuccess = () => {
          completed++
          if (completed === images.length) {
            resolve()
          }
        }
      })

      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * 永久删除图片
   */
  async function deleteImage(id: number): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量永久删除图片
   */
  async function deleteImages(ids: number[]): Promise<void> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGES_STORE)

      let completed = 0
      ids.forEach((id) => {
        const request = store.delete(id)
        request.onsuccess = () => {
          completed++
          if (completed === ids.length) {
            resolve()
          }
        }
      })

      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * 获取所有收藏图片
   */
  async function getFavoriteImages(): Promise<ImageRecord[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readonly')
      const store = transaction.objectStore(IMAGES_STORE)
      const index = store.index('isFavorite')
      const request = index.getAll(IDBKeyRange.only(true))

      request.onsuccess = () => {
        const results = request.result.filter((img: ImageRecord) => !img.isDeleted)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取回收站图片
   */
  async function getDeletedImages(): Promise<ImageRecord[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGES_STORE, 'readonly')
      const store = transaction.objectStore(IMAGES_STORE)
      const index = store.index('isDeleted')
      const request = index.getAll(IDBKeyRange.only(true))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    // 相册操作
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    // 图片操作
    getImagesByAlbum,
    getImageById,
    addImage,
    addImages,
    updateImage,
    updateImages,
    deleteImage,
    deleteImages,
    getFavoriteImages,
    getDeletedImages
  }
}
