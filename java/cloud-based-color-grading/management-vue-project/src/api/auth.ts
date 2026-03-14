/**
 * 认证相关 API
 * 提供登录、登出、Token刷新等接口
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/types'

// 登录请求参数
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  userId: number
  username: string
  nickname?: string
  roles: string[]
  permissions: string[]
  menus?: any[]
}

/**
 * 用户登录
 * @param data 登录信息
 */
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户登出
 */
export function logout(): Promise<ApiResponse<void>> {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 刷新 Token
 */
export function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}
