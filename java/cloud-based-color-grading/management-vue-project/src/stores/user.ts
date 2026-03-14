/**
 * 用户状态管理 Store
 * 管理用户登录状态、用户信息、角色和权限
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken as saveToken, removeToken } from '@/utils/auth'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { getUserInfo as getUserInfoApi } from '@/api/user'
import type { UserInfo } from '@/api/user'

// 重新导出类型供外部使用
export type { LoginRequest, LoginResponse } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(getToken() || '')
  const userId = ref<number | null>(null)
  const username = ref<string>('')
  const nickname = ref<string>('')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  
  const hasRole = computed(() => (role: string) => {
    return roles.value.includes(role)
  })
  
  const hasPermission = computed(() => (permission: string) => {
    return permissions.value.includes(permission)
  })
  
  // Actions
  
  /**
   * 登录操作
   * @param loginData 登录数据
   */
  async function login(loginData: LoginRequest): Promise<void> {
    try {
      console.log('=== 开始登录 ===')
      console.log('登录数据:', loginData)
      
      // 调用登录 API
      const response = await loginApi(loginData)
      console.log('登录响应:', response)
      
      const data: LoginResponse = response.data
      console.log('登录数据:', data)
      
      // 保存用户信息
      token.value = data.token
      userId.value = data.userId
      username.value = data.username
      nickname.value = data.nickname || data.username
      roles.value = data.roles || []
      permissions.value = data.permissions || []
      
      console.log('保存的权限列表:', permissions.value)
      console.log('权限列表长度:', permissions.value.length)
      
      // 保存 Token 到 localStorage
      saveToken(data.token)
      
      console.log('=== 登录完成 ===')
    } catch (error) {
      console.error('=== 登录失败 ===', error)
      // 清理状态
      token.value = ''
      userId.value = null
      username.value = ''
      nickname.value = ''
      roles.value = []
      permissions.value = []
      removeToken()
      
      throw error
    }
  }
  
  /**
   * 登出操作
   */
  async function logout(): Promise<void> {
    try {
      // 调用登出 API
      await logoutApi()
    } catch (error) {
      console.error('Logout API failed:', error)
      // 即使 API 失败也要清理本地状态
    } finally {
      // 清理状态
      token.value = ''
      userId.value = null
      username.value = ''
      nickname.value = ''
      roles.value = []
      permissions.value = []
      
      removeToken()
    }
  }
  
  /**
   * 设置 Token
   * @param newToken 新的 Token
   */
  function setToken(newToken: string): void {
    token.value = newToken
    saveToken(newToken)
  }
  
  /**
   * 获取用户信息
   */
  async function getUserInfo(): Promise<void> {
    try {
      // 调用获取用户信息 API
      const response = await getUserInfoApi()
      const data: UserInfo = response.data
      
      userId.value = data.userId
      username.value = data.username
      nickname.value = data.nickname || data.username
      roles.value = data.roles || []
      permissions.value = data.permissions || []
    } catch (error) {
      console.error('Get user info failed:', error)
      throw error
    }
  }
  
  return {
    // State
    token,
    userId,
    username,
    nickname,
    roles,
    permissions,
    // Getters
    isLoggedIn,
    hasRole,
    hasPermission,
    // Actions
    login,
    logout,
    setToken,
    getUserInfo
  }
})
