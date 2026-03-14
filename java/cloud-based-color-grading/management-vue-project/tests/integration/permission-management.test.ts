import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import PermissionManagement from '@/views/permission/index.vue'
import * as permissionApi from '@/api/permission'
import type { Permission } from '@/types/permission'

// Mock Element Plus 组件
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  }
})

// Mock API
vi.mock('@/api/permission')

describe('PermissionManagement Integration Tests', () => {
  // 模拟权限数据
  const mockPermissions: Permission[] = [
    {
      id: 1,
      permissionName: '用户查看',
      permissionKey: 'system:user:view',
      resourceType: 'menu',
      resourcePath: '/system/user',
      method: '',
      description: '查看用户列表'
    },
    {
      id: 2,
      permissionName: '用户新增',
      permissionKey: 'system:user:add',
      resourceType: 'button',
      resourcePath: '/system/user/add',
      method: '',
      description: '新增用户按钮'
    },
    {
      id: 3,
      permissionName: '用户列表API',
      permissionKey: 'api:user:list',
      resourceType: 'api',
      resourcePath: '/api/users',
      method: 'GET',
      description: '获取用户列表API'
    }
  ]

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 默认 API 响应
    vi.mocked(permissionApi.getPermissions).mockResolvedValue({
      code: 200,
      message: '成功',
      data: mockPermissions
    })
  })

  describe('权限列表加载', () => {
    it('应该在组件挂载时加载权限列表', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 验证 API 被调用
      expect(permissionApi.getPermissions).toHaveBeenCalledTimes(1)

      // 验证数据被加载
      expect(wrapper.vm.tableData).toHaveLength(3)
      expect(wrapper.vm.total).toBe(3)
    })

    it('应该在加载失败时显示错误提示', async () => {
      // Mock API 失败
      vi.mocked(permissionApi.getPermissions).mockRejectedValue(
        new Error('网络错误')
      )

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 验证错误提示
      expect(ElMessage.error).toHaveBeenCalledWith('加载权限列表失败')
      expect(wrapper.vm.tableData).toHaveLength(0)
    })

    it('应该在数据为空时显示空状态', async () => {
      // Mock 空数据
      vi.mocked(permissionApi.getPermissions).mockResolvedValue({
        code: 200,
        message: '成功',
        data: []
      })

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      expect(wrapper.vm.tableData).toHaveLength(0)
      expect(wrapper.vm.total).toBe(0)
    })
  })

  describe('权限新增功能', () => {
    it('应该成功创建新权限', async () => {
      const newPermission = {
        permissionName: '角色管理',
        permissionKey: 'system:role:view',
        resourceType: 'menu' as const,
        resourcePath: '/system/role',
        method: '',
        description: '角色管理菜单'
      }

      vi.mocked(permissionApi.createPermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: { id: 4, ...newPermission }
      })

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 打开新增对话框
      wrapper.vm.handleAdd()
      expect(wrapper.vm.dialogVisible).toBe(true)
      expect(wrapper.vm.dialogMode).toBe('add')

      // 提交表单
      await wrapper.vm.handleSave(newPermission)
      await flushPromises()

      // 验证 API 被调用
      expect(permissionApi.createPermission).toHaveBeenCalledWith(newPermission)

      // 验证成功提示
      expect(ElMessage.success).toHaveBeenCalledWith('权限创建成功')

      // 验证对话框关闭
      expect(wrapper.vm.dialogVisible).toBe(false)

      // 验证列表刷新
      expect(permissionApi.getPermissions).toHaveBeenCalledTimes(2)
    })

    it('应该在权限标识已存在时显示错误', async () => {
      const duplicatePermission = {
        permissionName: '用户查看',
        permissionKey: 'system:user:view',
        resourceType: 'menu' as const,
        resourcePath: '/system/user',
        method: '',
        description: '重复的权限'
      }

      vi.mocked(permissionApi.createPermission).mockRejectedValue({
        response: {
          data: {
            message: '权限标识已存在'
          }
        }
      })

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 提交重复的权限
      await wrapper.vm.handleSave(duplicatePermission)
      await flushPromises()

      // 验证错误提示
      expect(ElMessage.error).toHaveBeenCalledWith('权限标识已存在，请使用其他标识')
    })
  })

  describe('权限编辑功能', () => {
    it('应该成功编辑权限', async () => {
      const updatedPermission = {
        permissionName: '用户查看（已更新）',
        permissionKey: 'system:user:view',
        resourceType: 'menu' as const,
        resourcePath: '/system/user',
        method: '',
        description: '更新后的描述'
      }

      vi.mocked(permissionApi.updatePermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: { id: 1, ...updatedPermission }
      })

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 打开编辑对话框
      wrapper.vm.handleEdit(mockPermissions[0])
      expect(wrapper.vm.dialogVisible).toBe(true)
      expect(wrapper.vm.dialogMode).toBe('edit')
      expect(wrapper.vm.currentPermission).toEqual(mockPermissions[0])

      // 提交表单
      await wrapper.vm.handleSave(updatedPermission)
      await flushPromises()

      // 验证 API 被调用
      expect(permissionApi.updatePermission).toHaveBeenCalledWith(1, updatedPermission)

      // 验证成功提示
      expect(ElMessage.success).toHaveBeenCalledWith('权限更新成功')

      // 验证对话框关闭
      expect(wrapper.vm.dialogVisible).toBe(false)
    })
  })

  describe('权限删除功能', () => {
    it('应该成功删除权限', async () => {
      // Mock 确认对话框
      vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any)

      vi.mocked(permissionApi.deletePermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: undefined
      })

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 删除权限
      await wrapper.vm.handleDelete(mockPermissions[0])
      await flushPromises()

      // 验证确认对话框被调用
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要删除权限"用户查看"吗？',
        '删除确认',
        expect.any(Object)
      )

      // 验证 API 被调用
      expect(permissionApi.deletePermission).toHaveBeenCalledWith(1)

      // 验证成功提示
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功')

      // 验证列表刷新
      expect(permissionApi.getPermissions).toHaveBeenCalledTimes(2)
    })

    it('应该在用户取消删除时不执行删除操作', async () => {
      // Mock 用户取消
      vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 尝试删除权限
      await wrapper.vm.handleDelete(mockPermissions[0])
      await flushPromises()

      // 验证 API 未被调用
      expect(permissionApi.deletePermission).not.toHaveBeenCalled()

      // 验证列表未刷新
      expect(permissionApi.getPermissions).toHaveBeenCalledTimes(1)
    })
  })

  describe('权限筛选和搜索', () => {
    it('应该按资源类型筛选权限', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 筛选 API 类型
      wrapper.vm.searchForm.resourceType = 'api'
      await wrapper.vm.$nextTick()

      // 验证筛选结果
      const filtered = wrapper.vm.filteredTableData
      expect(filtered).toHaveLength(1)
      expect(filtered[0].resourceType).toBe('api')
    })

    it('应该按权限名称搜索', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 搜索"新增"
      wrapper.vm.searchForm.permissionName = '新增'
      await wrapper.vm.$nextTick()

      // 验证搜索结果
      const filtered = wrapper.vm.filteredTableData
      expect(filtered).toHaveLength(1)
      expect(filtered[0].permissionName).toContain('新增')
    })

    it('应该按权限标识搜索', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 搜索"api:user"
      wrapper.vm.searchForm.permissionKey = 'api:user'
      await wrapper.vm.$nextTick()

      // 验证搜索结果
      const filtered = wrapper.vm.filteredTableData
      expect(filtered).toHaveLength(1)
      expect(filtered[0].permissionKey).toContain('api:user')
    })

    it('应该支持组合筛选和搜索', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 组合筛选：资源类型为 menu，名称包含"用户"
      wrapper.vm.searchForm.resourceType = 'menu'
      wrapper.vm.searchForm.permissionName = '用户'
      await wrapper.vm.$nextTick()

      // 验证筛选结果
      const filtered = wrapper.vm.filteredTableData
      expect(filtered).toHaveLength(1)
      expect(filtered[0].resourceType).toBe('menu')
      expect(filtered[0].permissionName).toContain('用户')
    })

    it('应该在重置时清空搜索条件', async () => {
      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 设置搜索条件
      wrapper.vm.searchForm.permissionName = '用户'
      wrapper.vm.searchForm.resourceType = 'menu'
      await wrapper.vm.$nextTick()

      // 重置
      wrapper.vm.handleReset()
      await wrapper.vm.$nextTick()

      // 验证搜索条件被清空
      expect(wrapper.vm.searchForm.permissionName).toBe('')
      expect(wrapper.vm.searchForm.permissionKey).toBe('')
      expect(wrapper.vm.searchForm.resourceType).toBe('')

      // 验证显示所有数据
      expect(wrapper.vm.filteredTableData).toHaveLength(3)
    })
  })

  describe('完整CRUD流程', () => {
    it('应该完成完整的增删改查流程', async () => {
      // Mock 所有 API
      const newPermission = {
        permissionName: '测试权限',
        permissionKey: 'test:permission',
        resourceType: 'button' as const,
        resourcePath: '/test',
        method: '',
        description: '测试用权限'
      }

      vi.mocked(permissionApi.createPermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: { id: 4, ...newPermission }
      })

      vi.mocked(permissionApi.updatePermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: { id: 4, ...newPermission, permissionName: '测试权限（已更新）' }
      })

      vi.mocked(permissionApi.deletePermission).mockResolvedValue({
        code: 200,
        message: '成功',
        data: undefined
      })

      vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any)

      const wrapper = mount(PermissionManagement, {
        global: {
          stubs: {
            PageHeader: true,
            SearchBar: true,
            PermissionForm: true,
            ElTable: true,
            ElTableColumn: true,
            ElPagination: true,
            ElButton: true,
            ElIcon: true,
            ElTag: true,
            ElEmpty: true
          }
        }
      })

      await flushPromises()

      // 1. 查询 - 验证初始数据加载
      expect(wrapper.vm.tableData).toHaveLength(3)

      // 2. 新增 - 创建新权限
      await wrapper.vm.handleSave(newPermission)
      await flushPromises()
      expect(permissionApi.createPermission).toHaveBeenCalled()
      expect(ElMessage.success).toHaveBeenCalledWith('权限创建成功')

      // 3. 编辑 - 更新权限
      wrapper.vm.handleEdit(mockPermissions[0])
      await wrapper.vm.handleSave({
        ...newPermission,
        permissionName: '测试权限（已更新）'
      })
      await flushPromises()
      expect(permissionApi.updatePermission).toHaveBeenCalled()
      expect(ElMessage.success).toHaveBeenCalledWith('权限更新成功')

      // 4. 删除 - 删除权限
      await wrapper.vm.handleDelete(mockPermissions[0])
      await flushPromises()
      expect(permissionApi.deletePermission).toHaveBeenCalled()
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功')

      // 验证整个流程中列表被刷新了3次（初始加载 + 新增后刷新 + 编辑后刷新 + 删除后刷新）
      expect(permissionApi.getPermissions).toHaveBeenCalledTimes(4)
    })
  })
})
