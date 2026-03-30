import { ref, computed } from 'vue'
import type { AlbumRecord, MonthGroup } from '../types/gallery'
import { useGalleryDB } from './useGalleryDB'

const albums = ref<AlbumRecord[]>([])
const currentAlbumId = ref<number | null>(null)

/**
 * 相册状态管理
 */
export function useAlbumState() {
  const db = useGalleryDB()

  /**
   * 当前相册
   */
  const currentAlbum = computed(() => {
    if (!currentAlbumId.value) return null
    return albums.value.find(a => a.id === currentAlbumId.value) || null
  })

  /**
   * 按月份分组的相册
   */
  const monthGroups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, AlbumRecord[]>()

    albums.value.forEach(album => {
      const date = new Date(album.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!groups.has(month)) {
        groups.set(month, [])
      }
      groups.get(month)!.push(album)
    })

    return Array.from(groups.entries())
      .map(([month, albums]) => ({ month, albums }))
      .sort((a, b) => b.month.localeCompare(a.month))
  })

  /**
   * 加载所有相册
   */
  async function loadAlbums() {
    try {
      const data = await db.getAllAlbums()
      albums.value = data.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('加载相册失败:', error)
      throw error
    }
  }

  /**
   * 创建相册
   */
  async function createAlbum(name: string): Promise<number> {
    if (!name.trim()) {
      throw new Error('相册名称不能为空')
    }

    try {
      const newAlbum: Omit<AlbumRecord, 'id'> = {
        name: name.trim(),
        createdAt: Date.now(),
        sortOrder: albums.value.length
      }
      const id = await db.createAlbum(newAlbum)
      await loadAlbums()
      return id
    } catch (error) {
      console.error('创建相册失败:', error)
      throw error
    }
  }

  /**
   * 重命名相册
   */
  async function renameAlbum(id: number, newName: string) {
    if (!newName.trim()) {
      throw new Error('相册名称不能为空')
    }

    try {
      const album = albums.value.find(a => a.id === id)
      if (!album) throw new Error('相册不存在')

      album.name = newName.trim()
      await db.updateAlbum(album)
      await loadAlbums()
    } catch (error) {
      console.error('重命名相册失败:', error)
      throw error
    }
  }

  /**
   * 更新相册排序
   */
  async function updateAlbumOrder(albumId: number, newOrder: number) {
    try {
      const album = albums.value.find(a => a.id === albumId)
      if (!album) throw new Error('相册不存在')

      album.sortOrder = newOrder
      await db.updateAlbum(album)
      await loadAlbums()
    } catch (error) {
      console.error('更新相册排序失败:', error)
      throw error
    }
  }

  /**
   * 删除相册
   */
  async function deleteAlbum(id: number) {
    try {
      await db.deleteAlbum(id)
      await loadAlbums()
      if (currentAlbumId.value === id) {
        currentAlbumId.value = null
      }
    } catch (error) {
      console.error('删除相册失败:', error)
      throw error
    }
  }

  /**
   * 设置当前相册
   */
  function setCurrentAlbum(id: number | null) {
    currentAlbumId.value = id
  }

  return {
    albums,
    currentAlbum,
    currentAlbumId,
    monthGroups,
    loadAlbums,
    createAlbum,
    renameAlbum,
    updateAlbumOrder,
    deleteAlbum,
    setCurrentAlbum
  }
}
