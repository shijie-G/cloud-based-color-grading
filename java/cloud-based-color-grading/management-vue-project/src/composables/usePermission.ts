import { useUserStore } from '@/stores/user'

/**
 * 权限检查返回值接口
 */
export interface UsePermissionReturn {
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

/**
 * 权限检查组合函数
 * 封装权限检查逻辑，用于控制 UI 元素的显示/隐藏
 * 
 * @returns 权限检查方法
 * 
 * @example
 * ```ts
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
 * 
 * // 检查单个权限
 * if (hasPermission('system:role:create')) {
 *   // 显示新增按钮
 * }
 * 
 * // 检查是否有任意一个权限
 * if (hasAnyPermission(['system:role:edit', 'system:role:delete'])) {
 *   // 显示操作列
 * }
 * 
 * // 检查是否有所有权限
 * if (hasAllPermissions(['system:role:view', 'system:role:edit'])) {
 *   // 显示高级功能
 * }
 * ```
 */
export function usePermission(): UsePermissionReturn {
  const userStore = useUserStore()

  /**
   * 检查是否有指定权限
   * @param permission - 权限标识
   * @returns 是否有权限
   */
  const hasPermission = (permission: string): boolean => {
    if (!permission) {
      return true
    }
    return userStore.permissions.includes(permission)
  }

  /**
   * 检查是否有任意一个权限
   * @param permissions - 权限标识数组
   * @returns 是否有任意一个权限
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return true
    }
    return permissions.some(permission => userStore.permissions.includes(permission))
  }

  /**
   * 检查是否有所有权限
   * @param permissions - 权限标识数组
   * @returns 是否有所有权限
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return true
    }
    return permissions.every(permission => userStore.permissions.includes(permission))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}
