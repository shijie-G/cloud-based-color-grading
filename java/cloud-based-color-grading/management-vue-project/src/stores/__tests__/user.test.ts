/**
 * 用户 Store 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import * as authUtils from '@/utils/auth'

// Mock auth utils
vi.mock('@/utils/auth', () => ({
  getToken: vi.fn(() => ''),
  setToken: vi.fn(),
  removeToken: vi.fn()
}))

describe('User Store', () => {
  beforeEach(() => {
    // 为每个测试创建新的 Pinia 实例
    setActivePinia(createPinia())
    // 清除 mock 调用记录
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should initialize with empty state', () => {
      const store = useUserStore()
      
      expect(store.token).toBe('')
      expect(store.userId).toBeNull()
      expect(store.username).toBe('')
      expect(store.nickname).toBe('')
      expect(store.roles).toEqual([])
      expect(store.permissions).toEqual([])
    })

    it('should initialize with token from storage', () => {
      vi.mocked(authUtils.getToken).mockReturnValue('stored-token')
      
      const store = useUserStore()
      
      expect(store.token).toBe('stored-token')
    })
  })

  describe('Getters', () => {
    it('isLoggedIn should return false when no token', () => {
      vi.mocked(authUtils.getToken).mockReturnValue('')
      const store = useUserStore()
      
      expect(store.isLoggedIn).toBe(false)
    })

    it('isLoggedIn should return true when token exists', () => {
      const store = useUserStore()
      store.token = 'test-token'
      
      expect(store.isLoggedIn).toBe(true)
    })

    it('hasRole should check if user has specific role', () => {
      const store = useUserStore()
      store.roles = ['ROLE_ADMIN', 'ROLE_USER']
      
      expect(store.hasRole('ROLE_ADMIN')).toBe(true)
      expect(store.hasRole('ROLE_GUEST')).toBe(false)
    })

    it('hasPermission should check if user has specific permission', () => {
      const store = useUserStore()
      store.permissions = ['system:role:view', 'system:menu:view']
      
      expect(store.hasPermission('system:role:view')).toBe(true)
      expect(store.hasPermission('system:user:delete')).toBe(false)
    })
  })

  describe('Actions', () => {
    describe('login', () => {
      it('should set user data and save token on successful login', async () => {
        const store = useUserStore()
        const loginData = { username: 'admin', password: 'password' }
        
        await store.login(loginData)
        
        expect(store.token).toBeTruthy()
        expect(store.userId).toBe(1)
        expect(store.username).toBe('admin')
        expect(store.nickname).toBe('admin')
        expect(store.roles).toContain('ROLE_ADMIN')
        expect(store.permissions.length).toBeGreaterThan(0)
        expect(authUtils.setToken).toHaveBeenCalledWith(expect.any(String))
      })
    })

    describe('logout', () => {
      it('should clear user data and remove token', async () => {
        const store = useUserStore()
        
        // 先设置一些数据
        store.token = 'test-token'
        store.userId = 1
        store.username = 'admin'
        store.nickname = 'Admin'
        store.roles = ['ROLE_ADMIN']
        store.permissions = ['system:role:view']
        
        await store.logout()
        
        expect(store.token).toBe('')
        expect(store.userId).toBeNull()
        expect(store.username).toBe('')
        expect(store.nickname).toBe('')
        expect(store.roles).toEqual([])
        expect(store.permissions).toEqual([])
        expect(authUtils.removeToken).toHaveBeenCalled()
      })
    })

    describe('setToken', () => {
      it('should update token in state and storage', () => {
        const store = useUserStore()
        const newToken = 'new-test-token'
        
        store.setToken(newToken)
        
        expect(store.token).toBe(newToken)
        expect(authUtils.setToken).toHaveBeenCalledWith(newToken)
      })
    })

    describe('getUserInfo', () => {
      it('should load user information', async () => {
        const store = useUserStore()
        
        await store.getUserInfo()
        
        expect(store.userId).toBe(1)
        expect(store.username).toBe('admin')
        expect(store.nickname).toBe('管理员')
        expect(store.roles).toContain('ROLE_ADMIN')
        expect(store.permissions.length).toBeGreaterThan(0)
      })
    })
  })
})
