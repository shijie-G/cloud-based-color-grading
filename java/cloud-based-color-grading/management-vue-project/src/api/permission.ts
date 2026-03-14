import request from '@/utils/request'
import type { Permission, PermissionFormData, ApiResponse } from '@/types'

/**
 * 获取所有权限
 * @returns Promise<ApiResponse<Permission[]>>
 */
export function getPermissions(): Promise<ApiResponse<Permission[]>> {
  return request({
    url: '/api/permissions',
    method: 'get'
  })
}

/**
 * 获取权限详情
 * @param id 权限ID
 * @returns Promise<ApiResponse<Permission>>
 */
export function getPermissionById(id: number): Promise<ApiResponse<Permission>> {
  return request({
    url: `/api/permissions/${id}`,
    method: 'get'
  })
}

/**
 * 获取用户所有权限
 * @param userId 用户ID
 * @returns Promise<ApiResponse<Permission[]>>
 */
export function getUserPermissions(userId: number): Promise<ApiResponse<Permission[]>> {
  return request({
    url: `/api/permissions/user/${userId}`,
    method: 'get'
  })
}

/**
 * 创建权限
 * @param data 权限表单数据
 * @returns Promise<ApiResponse<Permission>>
 */
export function createPermission(data: PermissionFormData): Promise<ApiResponse<Permission>> {
  return request({
    url: '/api/permissions',
    method: 'post',
    data
  })
}

/**
 * 更新权限
 * @param id 权限ID
 * @param data 权限表单数据
 * @returns Promise<ApiResponse<Permission>>
 */
export function updatePermission(
  id: number,
  data: PermissionFormData
): Promise<ApiResponse<Permission>> {
  return request({
    url: `/api/permissions/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除权限
 * @param id 权限ID
 * @returns Promise<ApiResponse<void>>
 */
export function deletePermission(id: number): Promise<ApiResponse<void>> {
  return request({
    url: `/api/permissions/${id}`,
    method: 'delete'
  })
}
