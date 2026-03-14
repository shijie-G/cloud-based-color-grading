import request from '@/utils/request'
import type { Menu, MenuFormData, MenuTreeNode, ApiResponse } from '@/types'

/**
 * 获取所有菜单
 * @returns Promise<ApiResponse<Menu[]>>
 */
export function getMenus(): Promise<ApiResponse<Menu[]>> {
  return request({
    url: '/api/menus',
    method: 'get'
  })
}

/**
 * 获取菜单详情
 * @param id 菜单ID
 * @returns Promise<ApiResponse<Menu>>
 */
export function getMenuById(id: number): Promise<ApiResponse<Menu>> {
  return request({
    url: `/api/menus/${id}`,
    method: 'get'
  })
}

/**
 * 获取用户菜单树
 * @param userId 用户ID
 * @returns Promise<ApiResponse<MenuTreeNode[]>>
 */
export function getUserMenuTree(userId: number): Promise<ApiResponse<MenuTreeNode[]>> {
  return request({
    url: `/api/menus/user/${userId}/tree`,
    method: 'get'
  })
}

/**
 * 创建菜单
 * @param data 菜单表单数据
 * @returns Promise<ApiResponse<void>>
 */
export function createMenu(data: MenuFormData): Promise<ApiResponse<void>> {
  return request({
    url: '/api/menus',
    method: 'post',
    data
  })
}

/**
 * 更新菜单
 * @param id 菜单ID
 * @param data 菜单表单数据
 * @returns Promise<ApiResponse<void>>
 */
export function updateMenu(id: number, data: MenuFormData): Promise<ApiResponse<void>> {
  return request({
    url: `/api/menus/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除菜单
 * @param id 菜单ID
 * @returns Promise<ApiResponse<void>>
 */
export function deleteMenu(id: number): Promise<ApiResponse<void>> {
  return request({
    url: `/api/menus/${id}`,
    method: 'delete'
  })
}

/**
 * 获取菜单关联的权限列表
 * @param menuId 菜单ID
 * @returns Promise<ApiResponse<number[]>>
 */
export function getMenuPermissions(menuId: number): Promise<ApiResponse<number[]>> {
  return request({
    url: `/api/menus/${menuId}/permissions`,
    method: 'get'
  })
}

/**
 * 关联菜单和权限
 * @param menuId 菜单ID
 * @param permissionId 权限ID
 * @returns Promise<ApiResponse<void>>
 */
export function associateMenuPermission(
  menuId: number,
  permissionId: number
): Promise<ApiResponse<void>> {
  return request({
    url: `/api/menus/${menuId}/permissions/${permissionId}`,
    method: 'post'
  })
}

/**
 * 取消菜单和权限的关联
 * @param menuId 菜单ID
 * @param permissionId 权限ID
 * @returns Promise<ApiResponse<void>>
 */
export function disassociateMenuPermission(
  menuId: number,
  permissionId: number
): Promise<ApiResponse<void>> {
  return request({
    url: `/api/menus/${menuId}/permissions/${permissionId}`,
    method: 'delete'
  })
}
