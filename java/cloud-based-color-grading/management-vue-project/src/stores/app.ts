/**
 * 应用状态管理 Store
 * 管理应用级别的全局状态，如侧边栏、加载状态等
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref<boolean>(false)
  const loading = ref<boolean>(false)
  
  // Actions
  
  /**
   * 切换侧边栏展开/收起状态
   */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  /**
   * 设置侧边栏状态
   * @param collapsed 是否收起
   */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed
  }
  
  /**
   * 设置全局加载状态
   * @param value 加载状态
   */
  function setLoading(value: boolean): void {
    loading.value = value
  }
  
  return {
    // State
    sidebarCollapsed,
    loading,
    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setLoading
  }
})
