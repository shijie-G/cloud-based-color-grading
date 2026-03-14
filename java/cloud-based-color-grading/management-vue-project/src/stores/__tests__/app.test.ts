/**
 * 应用 Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../app'

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State', () => {
    it('should initialize with default state', () => {
      const store = useAppStore()
      
      expect(store.sidebarCollapsed).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('Actions', () => {
    describe('toggleSidebar', () => {
      it('should toggle sidebar collapsed state', () => {
        const store = useAppStore()
        
        expect(store.sidebarCollapsed).toBe(false)
        
        store.toggleSidebar()
        expect(store.sidebarCollapsed).toBe(true)
        
        store.toggleSidebar()
        expect(store.sidebarCollapsed).toBe(false)
      })
    })

    describe('setSidebarCollapsed', () => {
      it('should set sidebar collapsed state to true', () => {
        const store = useAppStore()
        
        store.setSidebarCollapsed(true)
        expect(store.sidebarCollapsed).toBe(true)
      })

      it('should set sidebar collapsed state to false', () => {
        const store = useAppStore()
        store.sidebarCollapsed = true
        
        store.setSidebarCollapsed(false)
        expect(store.sidebarCollapsed).toBe(false)
      })
    })

    describe('setLoading', () => {
      it('should set loading state to true', () => {
        const store = useAppStore()
        
        store.setLoading(true)
        expect(store.loading).toBe(true)
      })

      it('should set loading state to false', () => {
        const store = useAppStore()
        store.loading = true
        
        store.setLoading(false)
        expect(store.loading).toBe(false)
      })

      it('should handle multiple loading state changes', () => {
        const store = useAppStore()
        
        store.setLoading(true)
        expect(store.loading).toBe(true)
        
        store.setLoading(false)
        expect(store.loading).toBe(false)
        
        store.setLoading(true)
        expect(store.loading).toBe(true)
      })
    })
  })

  describe('Integration', () => {
    it('should handle multiple state changes independently', () => {
      const store = useAppStore()
      
      store.toggleSidebar()
      store.setLoading(true)
      
      expect(store.sidebarCollapsed).toBe(true)
      expect(store.loading).toBe(true)
      
      store.toggleSidebar()
      expect(store.sidebarCollapsed).toBe(false)
      expect(store.loading).toBe(true)
      
      store.setLoading(false)
      expect(store.sidebarCollapsed).toBe(false)
      expect(store.loading).toBe(false)
    })
  })
})
