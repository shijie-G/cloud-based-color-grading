/**
 * 用户管理相关 API
 * 提供用户信息查询、用户管理等接口
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/types'

// 用户信息
export interface UserInfo {
  userId: number
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status: number
  roles: string[]
  permissions: string[]
  createTime?: string
  updateTime?: string
}

// 用户列表查询参数
export interface UserQueryParams {
  username?: string
  status?: number
  pageNum?: number
  pageSize?: number
}

// 用户列表响应
export interface UserListResponse {
  list: UserInfo[]
  total: number
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/users/info',
    method: 'get'
  })
}

/**
 * 获取用户列表
 * @param params 查询参数
 */
export function getUsers(params?: UserQueryParams): Promise<ApiResponse<UserListResponse>> {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * 根据ID获取用户
 * @param id 用户ID
 */
export function getUserById(id: number): Promise<ApiResponse<UserInfo>> {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

/**
 * 创建用户
 * @param data 用户数据
 */
export function createUser(data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 * @param id 用户ID
 * @param data 用户数据
 */
export function updateUser(id: number, data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户
 * @param id 用户ID
 */
export function deleteUser(id: number): Promise<ApiResponse<void>> {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}
