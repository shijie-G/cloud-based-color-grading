import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as roleApi from '../role'
import * as menuApi from '../menu'
import * as permissionApi from '../permission'
import request from '@/utils/request'

// Mock the request utility
vi.mock('@/utils/request', () => ({
  default: vi.fn()
}))

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role API', () => {
    it('should have all required role API functions', () => {
      expect(roleApi.getRoles).toBeDefined()
      expect(roleApi.getRoleById).toBeDefined()
      expect(roleApi.createRole).toBeDefined()
      expect(roleApi.updateRole).toBeDefined()
      expect(roleApi.deleteRole).toBeDefined()
      expect(roleApi.assignPermissionsToRole).toBeDefined()
      expect(roleApi.assignRolesToUser).toBeDefined()
      expect(roleApi.removeRoleFromUser).toBeDefined()
    })

    it('should call getRoles with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'success', data: [] }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await roleApi.getRoles()

      expect(request).toHaveBeenCalledWith({
        url: '/api/roles',
        method: 'get'
      })
    })

    it('should call createRole with correct parameters', async () => {
      const mockData = {
        roleName: 'Test Role',
        roleKey: 'ROLE_TEST',
        description: 'Test Description',
        status: 0
      }
      const mockResponse = { code: 200, message: 'success', data: { id: 1, ...mockData } }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await roleApi.createRole(mockData)

      expect(request).toHaveBeenCalledWith({
        url: '/api/roles',
        method: 'post',
        data: mockData
      })
    })

    it('should call deleteRole with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'success', data: null }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await roleApi.deleteRole(1)

      expect(request).toHaveBeenCalledWith({
        url: '/api/roles/1',
        method: 'delete'
      })
    })
  })

  describe('Menu API', () => {
    it('should have all required menu API functions', () => {
      expect(menuApi.getMenus).toBeDefined()
      expect(menuApi.getMenuById).toBeDefined()
      expect(menuApi.getUserMenuTree).toBeDefined()
      expect(menuApi.createMenu).toBeDefined()
      expect(menuApi.updateMenu).toBeDefined()
      expect(menuApi.deleteMenu).toBeDefined()
      expect(menuApi.associateMenuPermission).toBeDefined()
      expect(menuApi.disassociateMenuPermission).toBeDefined()
    })

    it('should call getMenus with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'success', data: [] }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await menuApi.getMenus()

      expect(request).toHaveBeenCalledWith({
        url: '/api/menus',
        method: 'get'
      })
    })

    it('should call getUserMenuTree with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'success', data: [] }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await menuApi.getUserMenuTree(1)

      expect(request).toHaveBeenCalledWith({
        url: '/api/menus/user/1/tree',
        method: 'get'
      })
    })
  })

  describe('Permission API', () => {
    it('should have all required permission API functions', () => {
      expect(permissionApi.getPermissions).toBeDefined()
      expect(permissionApi.getPermissionById).toBeDefined()
      expect(permissionApi.getUserPermissions).toBeDefined()
      expect(permissionApi.createPermission).toBeDefined()
      expect(permissionApi.updatePermission).toBeDefined()
      expect(permissionApi.deletePermission).toBeDefined()
    })

    it('should call getPermissions with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'success', data: [] }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await permissionApi.getPermissions()

      expect(request).toHaveBeenCalledWith({
        url: '/api/permissions',
        method: 'get'
      })
    })

    it('should call createPermission with correct parameters', async () => {
      const mockData = {
        permissionName: 'Test Permission',
        permissionKey: 'test:permission',
        resourceType: 'api' as const,
        resourcePath: '/api/test',
        method: 'GET',
        description: 'Test Description'
      }
      const mockResponse = { code: 200, message: 'success', data: { id: 1, ...mockData } }
      vi.mocked(request).mockResolvedValue(mockResponse)

      await permissionApi.createPermission(mockData)

      expect(request).toHaveBeenCalledWith({
        url: '/api/permissions',
        method: 'post',
        data: mockData
      })
    })
  })
})
