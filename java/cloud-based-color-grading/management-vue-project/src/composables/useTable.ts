import { ref, type Ref } from 'vue'
import type { ApiResponse } from '@/types'

/**
 * 表格选项接口
 */
export interface UseTableOptions<T> {
  fetchData: (params: any) => Promise<ApiResponse<T[]>>
  immediate?: boolean
}

/**
 * 表格返回值接口
 */
export interface UseTableReturn<T> {
  data: Ref<T[]>
  loading: Ref<boolean>
  total: Ref<number>
  currentPage: Ref<number>
  pageSize: Ref<number>
  loadData: () => Promise<void>
  handlePageChange: (page: number) => void
  handleSizeChange: (size: number) => void
  refresh: () => Promise<void>
}

/**
 * 表格组合函数
 * 封装表格通用逻辑，包括数据加载、分页等
 * 
 * @param options - 表格选项
 * @returns 表格状态和方法
 * 
 * @example
 * ```ts
 * const { data, loading, loadData, handlePageChange } = useTable({
 *   fetchData: getRoles,
 *   immediate: true
 * })
 * ```
 */
export function useTable<T>(options: UseTableOptions<T>): UseTableReturn<T> {
  const { fetchData, immediate = true } = options

  // 表格数据状态
  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref<boolean>(false)
  const total = ref<number>(0)
  const currentPage = ref<number>(1)
  const pageSize = ref<number>(10)

  /**
   * 加载数据
   */
  const loadData = async (): Promise<void> => {
    try {
      loading.value = true
      const params = {
        current: currentPage.value,
        size: pageSize.value
      }
      const response = await fetchData(params)
      
      // 处理响应数据
      if (Array.isArray(response.data)) {
        data.value = response.data
        total.value = response.data.length
      } else if (response.data && typeof response.data === 'object') {
        // 处理分页响应格式
        const pageData = response.data as any
        data.value = pageData.records || pageData.list || []
        total.value = pageData.total || 0
      }
    } catch (error) {
      console.error('Failed to load table data:', error)
      data.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理页码变化
   */
  const handlePageChange = (page: number): void => {
    currentPage.value = page
    loadData()
  }

  /**
   * 处理每页大小变化
   */
  const handleSizeChange = (size: number): void => {
    pageSize.value = size
    currentPage.value = 1
    loadData()
  }

  /**
   * 刷新数据（重置到第一页）
   */
  const refresh = async (): Promise<void> => {
    currentPage.value = 1
    await loadData()
  }

  // 立即加载数据
  if (immediate) {
    loadData()
  }

  return {
    data,
    loading,
    total,
    currentPage,
    pageSize,
    loadData,
    handlePageChange,
    handleSizeChange,
    refresh
  }
}
