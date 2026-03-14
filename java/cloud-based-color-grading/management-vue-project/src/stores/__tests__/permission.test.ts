/**
 * 权限 Store 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionStore } from '../permission'
import type { MenuTreeNode } from '@/types'

describe('Permission Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State', () => {
    it('should initialize with empty state', () => {
      const store = usePermissionStore()
      
      expect(store.menuTree).toEqual([])
      expect(store.flatMenus).toEqual([])
    })
  })

  describe('Actions', () => {
    describe('setMenuTree', () => {
      it('should set menu tree and flatten it', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: [
              {
                id: 2,
                parentId: 1,
                menuName: '角色管理',
                menuPath: '/system/role',
                component: 'role/index',
                icon: 'user',
                sortOrder: 1,
                children: []
              },
              {
                id: 3,
                parentId: 1,
                menuName: '菜单管理',
                menuPath: '/system/menu',
                component: 'menu/index',
                icon: 'menu',
                sortOrder: 2,
                children: []
              }
            ]
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        expect(store.menuTree).toEqual(mockMenuTree)
        expect(store.flatMenus).toHaveLength(3)
        expect(store.flatMenus[0].id).toBe(1)
        expect(store.flatMenus[1].id).toBe(2)
        expect(store.flatMenus[2].id).toBe(3)
      })

      it('should handle deeply nested menu tree', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: 'Level 1',
            menuPath: '/level1',
            component: 'Layout',
            icon: 'folder',
            sortOrder: 1,
            children: [
              {
                id: 2,
                parentId: 1,
                menuName: 'Level 2',
                menuPath: '/level1/level2',
                component: 'level2/index',
                icon: 'folder',
                sortOrder: 1,
                children: [
                  {
                    id: 3,
                    parentId: 2,
                    menuName: 'Level 3',
                    menuPath: '/level1/level2/level3',
                    component: 'level3/index',
                    icon: 'file',
                    sortOrder: 1,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        expect(store.flatMenus).toHaveLength(3)
        expect(store.flatMenus.map(m => m.id)).toEqual([1, 2, 3])
      })
    })

    describe('clearMenuTree', () => {
      it('should clear menu tree and flat menus', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: []
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        expect(store.menuTree).toHaveLength(1)
        expect(store.flatMenus).toHaveLength(1)
        
        store.clearMenuTree()
        
        expect(store.menuTree).toEqual([])
        expect(store.flatMenus).toEqual([])
      })
    })

    describe('findMenuById', () => {
      it('should find menu by id', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: [
              {
                id: 2,
                parentId: 1,
                menuName: '角色管理',
                menuPath: '/system/role',
                component: 'role/index',
                icon: 'user',
                sortOrder: 1,
                children: []
              }
            ]
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        const menu = store.findMenuById(2)
        expect(menu).toBeDefined()
        expect(menu?.menuName).toBe('角色管理')
      })

      it('should return undefined for non-existent id', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: []
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        const menu = store.findMenuById(999)
        expect(menu).toBeUndefined()
      })
    })

    describe('findMenuByPath', () => {
      it('should find menu by path', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: [
              {
                id: 2,
                parentId: 1,
                menuName: '角色管理',
                menuPath: '/system/role',
                component: 'role/index',
                icon: 'user',
                sortOrder: 1,
                children: []
              }
            ]
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        const menu = store.findMenuByPath('/system/role')
        expect(menu).toBeDefined()
        expect(menu?.menuName).toBe('角色管理')
      })

      it('should return undefined for non-existent path', () => {
        const store = usePermissionStore()
        const mockMenuTree: MenuTreeNode[] = [
          {
            id: 1,
            parentId: 0,
            menuName: '系统管理',
            menuPath: '/system',
            component: 'Layout',
            icon: 'setting',
            sortOrder: 1,
            children: []
          }
        ]
        
        store.setMenuTree(mockMenuTree)
        
        const menu = store.findMenuByPath('/non-existent')
        expect(menu).toBeUndefined()
      })
    })
  })
})
