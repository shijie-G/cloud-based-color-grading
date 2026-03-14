import request from '@/utils/request'
import type { Role, RoleFormData, ApiResponse } from '@/types'

/**
 * 获取所有角色
 * @returns Promise<ApiResponse<Role[]>>
 */
export function getRoles(): Promise<ApiResponse<Role[]>> {
  return request({
    url: '/api/roles',
    method: 'get'
  })
}

/**
 * 获取角色详情
 * @param id 角色ID
 * @returns Promise<ApiResponse<Role>>
 */
export function getRoleById(id: number): Promise<ApiResponse<Role>> {
  return request({
    url: `/api/roles/${id}`,
    method: 'get'
  })
}

/**
 * 创建角色
 * @param data 角色表单数据
 * @returns Promise<ApiResponse<Role>>
 */
export function createRole(data: RoleFormData): Promise<ApiResponse<Role>> {
  return request({
    url: '/api/roles',
    method: 'post',
    data
  })
}

/**
 * 更新角色
 * @param id 角色ID
 * @param data 角色表单数据
 * @returns Promise<ApiResponse<Role>>
 */
export function updateRole(id: number, data: RoleFormData): Promise<ApiResponse<Role>> {
  return request({
    url: `/api/roles/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除角色
 * @param id 角色ID
 * @returns Promise<ApiResponse<void>>
 */
export function deleteRole(id: number): Promise<ApiResponse<void>> {
  return request({
    url: `/api/roles/${id}`,
    method: 'delete'
  })
}

/**
 * 获取角色的权限列表
 * @param roleId 角色ID
 * @returns Promise<ApiResponse<number[]>>
 */
export function getRolePermissions(roleId: number): Promise<ApiResponse<number[]>> {
  return request({
    url: `/api/roles/${roleId}/permissions`,
    method: 'get'
  })
}

/**
 * 为角色分配权限
 * @param roleId 角色ID
 * @param permissionIds 权限ID列表
 * @returns Promise<ApiResponse<void>>
 */
export function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[]
): Promise<ApiResponse<void>> {
  return request({
    url: `/api/roles/${roleId}/permissions`,
    method: 'post',
    data: permissionIds
  })
}

/**
 * 为用户分配角色
 * @param userId 用户ID
 * @param roleIds 角色ID列表
 * @returns Promise<ApiResponse<void>>
 */
export function assignRolesToUser(
  userId: number,
  roleIds: number[]
): Promise<ApiResponse<void>> {
  return request({
    url: `/api/roles/users/${userId}`,
    method: 'post',
    data: roleIds
  })
}

/**
 * 移除用户的角色
 * @param userId 用户ID
 * @param roleId 角色ID
 * @returns Promise<ApiResponse<void>>
 */
export function removeRoleFromUser(
  userId: number,
  roleId: number
): Promise<ApiResponse<void>> {
  return request({
    url: `/api/roles/users/${userId}/roles/${roleId}`,
    method: 'delete'
  })
}
