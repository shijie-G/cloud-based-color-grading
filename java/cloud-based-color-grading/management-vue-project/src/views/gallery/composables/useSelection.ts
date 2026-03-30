import { ref, computed } from 'vue'

const selectedIds = ref<Set<number>>(new Set())
const lastSelectedId = ref<number | null>(null)

/**
 * 多选状态管理
 */
export function useSelection() {
  /**
   * 已选中的 ID 数组
   */
  const selectedArray = computed(() => Array.from(selectedIds.value))

  /**
   * 已选中数量
   */
  const selectedCount = computed(() => selectedIds.value.size)

  /**
   * 是否有选中项
   */
  const hasSelection = computed(() => selectedIds.value.size > 0)

  /**
   * 检查是否已选中
   */
  function isSelected(id: number): boolean {
    return selectedIds.value.has(id)
  }

  /**
   * 切换选中状态
   */
  function toggleSelect(id: number) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    lastSelectedId.value = id
  }

  /**
   * 范围选择（Shift + 点击）
   */
  function rangeSelect(id: number, allIds: number[]) {
    if (!lastSelectedId.value) {
      toggleSelect(id)
      return
    }

    const lastIndex = allIds.indexOf(lastSelectedId.value)
    const currentIndex = allIds.indexOf(id)

    if (lastIndex === -1 || currentIndex === -1) {
      toggleSelect(id)
      return
    }

    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)

    for (let i = start; i <= end; i++) {
      selectedIds.value.add(allIds[i])
    }
  }

  /**
   * 全选
   */
  function selectAll(ids: number[]) {
    ids.forEach(id => selectedIds.value.add(id))
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedIds.value.clear()
    lastSelectedId.value = null
  }

  /**
   * 设置选中项
   */
  function setSelection(ids: number[]) {
    selectedIds.value = new Set(ids)
  }

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    hasSelection,
    isSelected,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    setSelection
  }
}
