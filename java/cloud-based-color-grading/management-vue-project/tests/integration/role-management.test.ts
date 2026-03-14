import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import RoleManagement from '@/views/role/index.vue'
import * as roleApi from '@/api/role'
import type { Role, RoleFormData } from '@/types/role'

// Mock Element Plus components
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  }
})

// Mock API module
vi.mock('@/api/role', () => ({
  getRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  getRolePermissions: vi.fn(),
  assignPermissionsToRole: vi.fn()
}))

describe('Role Management Integration Tests', () => {
  let wrapper: any
  
  // Mock data
  const mockRoles: Role[] = [
    {
      id: 1,
      roleName: '管理员',
      roleKey: 'ROLE_ADMIN',
      description: '系统管理员',
      status: 0,
      createTime: '2024-01-01 10:00:00'
    },
    {
      id: 2,
      roleName: '普通用户',
      roleKey: 'ROLE_USER',
      description: '普通用户角色',
      status: 0,
      createTime: '2024-01-02 10:00:00'
    }
  ]

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup Pinia
    const pinia = createPinia()
    setActivePinia(pinia)
    
    // Setup default API responses
    vi.mocked(roleApi.getRoles).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockRoles
    })
  })

  /**
   * Test: Complete CRUD Workflow
   * Validates Requirements: 1.1, 2.1, 3.1, 4.1
   */
  describe('Complete CRUD Workflow', () => {
    it('should load and display role list on mount', async () => {
      // Mount component
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      // Wait for async operations
      await flushPromises()

      // Verify API was called
      expect(roleApi.getRoles).toHaveBeenCalledTimes(1)

      // Verify data is loaded
      expect(wrapper.vm.tableData).toEqual(mockRoles)
      expect(wrapper.vm.total).toBe(2)
      expect(wrapper.vm.loading).toBe(false)
    })

    it('should handle empty data state', async () => {
      // Mock empty response
      vi.mocked(roleApi.getRoles).mockResolvedValue({
        code: 200,
        message: 'success',
        data: []
      })

      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      expect(wrapper.vm.tableData).toEqual([])
      expect(wrapper.vm.total).toBe(0)
    })

    it('should handle API error when loading roles', async () => {
      // Mock API error
      vi.mocked(roleApi.getRoles).mockRejectedValue(new Error('Network error'))

      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Verify error message was shown
      expect(ElMessage.error).toHaveBeenCalledWith('加载角色列表失败')
      expect(wrapper.vm.tableData).toEqual([])
      expect(wrapper.vm.total).toBe(0)
    })

    it('should create a new role successfully', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock create API
      const newRole: Role = {
        id: 3,
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试角色描述',
        status: 0,
        createTime: '2024-01-03 10:00:00'
      }

      vi.mocked(roleApi.createRole).mockResolvedValue({
        code: 200,
        message: 'success',
        data: newRole
      })

      // Mock updated list
      vi.mocked(roleApi.getRoles).mockResolvedValue({
        code: 200,
        message: 'success',
        data: [...mockRoles, newRole]
      })

      // Open add dialog
      wrapper.vm.handleAdd()
      expect(wrapper.vm.dialogVisible).toBe(true)
      expect(wrapper.vm.dialogMode).toBe('add')
      expect(wrapper.vm.currentRole).toBeNull()

      // Submit form
      const formData: RoleFormData = {
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试角色描述',
        status: 0
      }

      await wrapper.vm.handleSave(formData)
      await flushPromises()

      // Verify API was called
      expect(roleApi.createRole).toHaveBeenCalledWith(formData)
      expect(ElMessage.success).toHaveBeenCalledWith('角色创建成功')

      // Verify dialog is closed
      expect(wrapper.vm.dialogVisible).toBe(false)

      // Verify list is refreshed
      expect(roleApi.getRoles).toHaveBeenCalledTimes(2)
    })

    it('should handle duplicate role key error when creating', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock duplicate error
      vi.mocked(roleApi.createRole).mockRejectedValue({
        response: {
          data: {
            message: '角色标识已存在'
          }
        }
      })

      // Submit form
      const formData: RoleFormData = {
        roleName: '测试角色',
        roleKey: 'ROLE_ADMIN', // Duplicate key
        description: '测试角色描述',
        status: 0
      }

      await wrapper.vm.handleSave(formData)
      await flushPromises()

      // Verify error message
      expect(ElMessage.error).toHaveBeenCalledWith('角色标识已存在，请使用其他标识')
    })

    it('should edit an existing role successfully', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock update API
      vi.mocked(roleApi.updateRole).mockResolvedValue({
        code: 200,
        message: 'success',
        data: { ...mockRoles[0], roleName: '更新后的管理员' }
      })

      // Open edit dialog
      wrapper.vm.handleEdit(mockRoles[0])
      expect(wrapper.vm.dialogVisible).toBe(true)
      expect(wrapper.vm.dialogMode).toBe('edit')
      expect(wrapper.vm.currentRole).toEqual(mockRoles[0])

      // Submit form
      const formData: RoleFormData = {
        roleName: '更新后的管理员',
        roleKey: 'ROLE_ADMIN',
        description: '系统管理员',
        status: 0
      }

      await wrapper.vm.handleSave(formData)
      await flushPromises()

      // Verify API was called
      expect(roleApi.updateRole).toHaveBeenCalledWith(1, formData)
      expect(ElMessage.success).toHaveBeenCalledWith('角色更新成功')

      // Verify dialog is closed
      expect(wrapper.vm.dialogVisible).toBe(false)

      // Verify list is refreshed
      expect(roleApi.getRoles).toHaveBeenCalledTimes(2)
    })

    it('should delete a role successfully after confirmation', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock confirmation dialog
      vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any)

      // Mock delete API
      vi.mocked(roleApi.deleteRole).mockResolvedValue({
        code: 200,
        message: 'success',
        data: undefined
      })

      // Mock updated list
      vi.mocked(roleApi.getRoles).mockResolvedValue({
        code: 200,
        message: 'success',
        data: [mockRoles[1]] // Only second role remains
      })

      // Delete role
      await wrapper.vm.handleDelete(mockRoles[0])
      await flushPromises()

      // Verify confirmation was shown
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要删除角色"管理员"吗？删除后将解除所有用户与该角色的关联。',
        '删除确认',
        expect.objectContaining({
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      )

      // Verify API was called
      expect(roleApi.deleteRole).toHaveBeenCalledWith(1)
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功')

      // Verify list is refreshed
      expect(roleApi.getRoles).toHaveBeenCalledTimes(2)
    })

    it('should not delete role when user cancels confirmation', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock user canceling confirmation
      vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')

      // Delete role
      await wrapper.vm.handleDelete(mockRoles[0])
      await flushPromises()

      // Verify delete API was NOT called
      expect(roleApi.deleteRole).not.toHaveBeenCalled()

      // Verify no error message
      expect(ElMessage.error).not.toHaveBeenCalled()
    })
  })

  /**
   * Test: Permission Assignment Workflow
   * Validates Requirement: 9.1
   */
  describe('Permission Assignment Workflow', () => {
    it('should open permission selector with existing permissions', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock get role permissions API
      const mockPermissionIds = [1, 2, 3]
      vi.mocked(roleApi.getRolePermissions).mockResolvedValue({
        code: 200,
        message: 'success',
        data: mockPermissionIds
      })

      // Open permission assignment dialog
      await wrapper.vm.handleAssignPermissions(mockRoles[0])
      await flushPromises()

      // Verify API was called
      expect(roleApi.getRolePermissions).toHaveBeenCalledWith(1)

      // Verify dialog state
      expect(wrapper.vm.permissionDialogVisible).toBe(true)
      expect(wrapper.vm.currentAssignRole).toEqual(mockRoles[0])
      expect(wrapper.vm.selectedPermissionIds).toEqual(mockPermissionIds)
    })

    it('should handle error when loading role permissions', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Mock API error
      vi.mocked(roleApi.getRolePermissions).mockRejectedValue({
        response: {
          data: {
            message: '加载权限失败'
          }
        }
      })

      // Open permission assignment dialog
      await wrapper.vm.handleAssignPermissions(mockRoles[0])
      await flushPromises()

      // Verify error message
      expect(ElMessage.error).toHaveBeenCalledWith('加载权限失败')
    })

    it('should assign permissions to role successfully', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Setup current role
      wrapper.vm.currentAssignRole = mockRoles[0]

      // Mock assign permissions API
      vi.mocked(roleApi.assignPermissionsToRole).mockResolvedValue({
        code: 200,
        message: 'success',
        data: undefined
      })

      // Confirm permissions
      const newPermissionIds = [1, 2, 3, 4, 5]
      await wrapper.vm.handleConfirmPermissions(newPermissionIds)
      await flushPromises()

      // Verify API was called
      expect(roleApi.assignPermissionsToRole).toHaveBeenCalledWith(1, newPermissionIds)
      expect(ElMessage.success).toHaveBeenCalledWith('权限分配成功')

      // Verify dialog is closed
      expect(wrapper.vm.permissionDialogVisible).toBe(false)
    })

    it('should handle error when assigning permissions', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Setup current role
      wrapper.vm.currentAssignRole = mockRoles[0]

      // Mock API error
      vi.mocked(roleApi.assignPermissionsToRole).mockRejectedValue({
        response: {
          data: {
            message: '权限分配失败'
          }
        }
      })

      // Confirm permissions
      const newPermissionIds = [1, 2, 3]
      await wrapper.vm.handleConfirmPermissions(newPermissionIds)
      await flushPromises()

      // Verify error message
      expect(ElMessage.error).toHaveBeenCalledWith('权限分配失败')
    })
  })

  /**
   * Test: Search and Filter Functionality
   */
  describe('Search and Filter Functionality', () => {
    it('should trigger search when handleSearch is called', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Clear previous calls
      vi.clearAllMocks()

      // Set search form
      wrapper.vm.searchForm.roleName = '管理员'

      // Trigger search
      wrapper.vm.handleSearch()
      await flushPromises()

      // Verify page is reset to 1
      expect(wrapper.vm.currentPage).toBe(1)

      // Verify API is called
      expect(roleApi.getRoles).toHaveBeenCalledTimes(1)
    })

    it('should reset search form and reload data', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Set search form
      wrapper.vm.searchForm.roleName = '管理员'
      wrapper.vm.searchForm.roleKey = 'ROLE_ADMIN'
      wrapper.vm.searchForm.status = 0

      // Clear previous calls
      vi.clearAllMocks()

      // Trigger reset
      wrapper.vm.handleReset()
      await flushPromises()

      // Verify form is reset
      expect(wrapper.vm.searchForm.roleName).toBe('')
      expect(wrapper.vm.searchForm.roleKey).toBe('')
      expect(wrapper.vm.searchForm.status).toBeUndefined()

      // Verify page is reset to 1
      expect(wrapper.vm.currentPage).toBe(1)

      // Verify API is called
      expect(roleApi.getRoles).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * Test: Pagination Functionality
   */
  describe('Pagination Functionality', () => {
    it('should handle page change', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Clear previous calls
      vi.clearAllMocks()

      // Change page
      wrapper.vm.handlePageChange(2)
      await flushPromises()

      // Verify page is updated
      expect(wrapper.vm.currentPage).toBe(2)

      // Verify API is called
      expect(roleApi.getRoles).toHaveBeenCalledTimes(1)
    })

    it('should handle page size change', async () => {
      wrapper = mount(RoleManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            RoleForm: true,
            PermissionSelector: true,
            ElButton: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElTag: true,
            ElIcon: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // Clear previous calls
      vi.clearAllMocks()

      // Change page size
      wrapper.vm.handleSizeChange(20)
      await flushPromises()

      // Verify page size is updated
      expect(wrapper.vm.pageSize).toBe(20)

      // Verify page is reset to 1
      expect(wrapper.vm.currentPage).toBe(1)

      // Verify API is called
      expect(roleApi.getRoles).toHaveBeenCalledTimes(1)
    })
  })
})
