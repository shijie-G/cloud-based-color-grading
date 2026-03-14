import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTable } from '../useTable'
import type { ApiResponse } from '@/types'

describe('useTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    const { data, loading, total, currentPage, pageSize } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    expect(data.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(total.value).toBe(0)
    expect(currentPage.value).toBe(1)
    expect(pageSize.value).toBe(10)
  })

  it('should load data immediately when immediate is true', async () => {
    const mockData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]

    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockData
    })

    const { data, loading } = useTable({
      fetchData: mockFetchData,
      immediate: true
    })

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockFetchData).toHaveBeenCalledWith({
      current: 1,
      size: 10
    })
    expect(data.value).toEqual(mockData)
    expect(loading.value).toBe(false)
  })

  it('should not load data immediately when immediate is false', () => {
    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    expect(mockFetchData).not.toHaveBeenCalled()
  })

  it('should handle paginated response format', async () => {
    const mockData = {
      records: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ],
      total: 20,
      current: 1,
      size: 10
    }

    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockData
    })

    const { data, total, loadData } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    await loadData()

    expect(data.value).toEqual(mockData.records)
    expect(total.value).toBe(20)
  })

  it('should handle page change', async () => {
    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    const { currentPage, handlePageChange } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    handlePageChange(3)

    expect(currentPage.value).toBe(3)
    expect(mockFetchData).toHaveBeenCalledWith({
      current: 3,
      size: 10
    })
  })

  it('should handle page size change and reset to first page', async () => {
    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    const { currentPage, pageSize, handlePageChange, handleSizeChange } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    // First go to page 3
    handlePageChange(3)
    expect(currentPage.value).toBe(3)

    // Then change page size
    handleSizeChange(20)

    expect(pageSize.value).toBe(20)
    expect(currentPage.value).toBe(1) // Should reset to first page
    expect(mockFetchData).toHaveBeenLastCalledWith({
      current: 1,
      size: 20
    })
  })

  it('should refresh data and reset to first page', async () => {
    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    const { currentPage, handlePageChange, refresh } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    // Go to page 3
    handlePageChange(3)
    expect(currentPage.value).toBe(3)

    // Refresh
    await refresh()

    expect(currentPage.value).toBe(1)
    expect(mockFetchData).toHaveBeenLastCalledWith({
      current: 1,
      size: 10
    })
  })

  it('should handle loading state correctly', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    const mockFetchData = vi.fn().mockReturnValue(promise)

    const { loading, loadData } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    expect(loading.value).toBe(false)

    const loadPromise = loadData()
    expect(loading.value).toBe(true)

    resolvePromise!({
      code: 200,
      message: 'success',
      data: []
    })

    await loadPromise
    expect(loading.value).toBe(false)
  })

  it('should handle errors gracefully', async () => {
    const mockFetchData = vi.fn().mockRejectedValue(new Error('Network error'))

    const { data, total, loading, loadData } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    await loadData()

    expect(data.value).toEqual([])
    expect(total.value).toBe(0)
    expect(loading.value).toBe(false)
  })

  it('should handle array response format', async () => {
    const mockData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]

    const mockFetchData = vi.fn().mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockData
    })

    const { data, total, loadData } = useTable({
      fetchData: mockFetchData,
      immediate: false
    })

    await loadData()

    expect(data.value).toEqual(mockData)
    expect(total.value).toBe(3)
  })
})
