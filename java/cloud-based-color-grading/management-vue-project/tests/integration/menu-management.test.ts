import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import MenuManagement from '@/views/menu/MenuManagement.vue'
import * as menuApi from '@/api/menu'
import type { Menu } from '@/types/menu'

// Mock Element Plus
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
vi.mock('@/api/menu')

describe('MenuManagement - Task 9.2: 实现菜单树加载', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该调用 getMenus API 加载数据 (Requirement 5.2)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证 API 被调用
    expect(menuApi.getMenus).toHaveBeenCalledTimes(1)
  })

  it('应该构建树形结构 (Requirement 5.3, 5.4)', async () => {
    // Arrange: 准备扁平的菜单列表
    const flatMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      },
      {
        id: 2,
        parentId: 1,
        menuName: '用户管理',
        menuPath: '/system/user',
        component: 'system/user/index',
        icon: 'User',
        sortOrder: 1,
        visible: 0,
        status: 0
      },
      {
        id: 3,
        parentId: 1,
        menuName: '角色管理',
        menuPath: '/system/role',
        component: 'system/role/index',
        icon: 'UserFilled',
        sortOrder: 2,
        visible: 0,
        status: 0
      }
    ]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: flatMenus
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证树形结构被正确构建
    const tableData = (wrapper.vm as any).tableData
    expect(tableData).toHaveLength(1) // 只有一个顶级菜单
    expect(tableData[0].id).toBe(1)
    expect(tableData[0].children).toHaveLength(2) // 有两个子菜单
    expect(tableData[0].children[0].id).toBe(2)
    expect(tableData[0].children[1].id).toBe(3)
  })

  it('应该按排序号排序菜单 (Requirement 5.4)', async () => {
    // Arrange: 准备乱序的菜单列表
    const unorderedMenus: Menu[] = [
      {
        id: 3,
        parentId: 0,
        menuName: '菜单3',
        menuPath: '/menu3',
        component: 'Layout',
        icon: 'Menu',
        sortOrder: 3,
        visible: 0,
        status: 0
      },
      {
        id: 1,
        parentId: 0,
        menuName: '菜单1',
        menuPath: '/menu1',
        component: 'Layout',
        icon: 'Menu',
        sortOrder: 1,
        visible: 0,
        status: 0
      },
      {
        id: 2,
        parentId: 0,
        menuName: '菜单2',
        menuPath: '/menu2',
        component: 'Layout',
        icon: 'Menu',
        sortOrder: 2,
        visible: 0,
        status: 0
      }
    ]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: unorderedMenus
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证菜单按排序号排序
    const tableData = (wrapper.vm as any).tableData
    expect(tableData[0].sortOrder).toBe(1)
    expect(tableData[1].sortOrder).toBe(2)
    expect(tableData[2].sortOrder).toBe(3)
  })

  it('应该显示加载状态 (Requirement 5.3)', async () => {
    // Arrange: 模拟延迟的 API 响应
    vi.mocked(menuApi.getMenus).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            code: 200,
            message: 'success',
            data: []
          })
        }, 100)
      })
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // Assert: 验证加载状态为 true
    expect((wrapper.vm as any).loading).toBe(true)

    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()

    // Assert: 验证加载状态变为 false
    expect((wrapper.vm as any).loading).toBe(false)
  })

  it('应该处理空数据状态 (Requirement 5.6)', async () => {
    // Arrange: 返回空数据
    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证表格数据为空
    const tableData = (wrapper.vm as any).tableData
    expect(tableData).toHaveLength(0)
  })

  it('应该处理 API 错误 (Requirement 5.3)', async () => {
    // Arrange: 模拟 API 错误
    vi.mocked(menuApi.getMenus).mockRejectedValue(new Error('Network error'))

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('加载菜单列表失败')
    
    // Assert: 验证表格数据为空
    const tableData = (wrapper.vm as any).tableData
    expect(tableData).toHaveLength(0)
  })

  it('应该处理已经是树形结构的数据', async () => {
    // Arrange: 准备已经是树形结构的数据
    const treeMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0,
        children: [
          {
            id: 2,
            parentId: 1,
            menuName: '用户管理',
            menuPath: '/system/user',
            component: 'system/user/index',
            icon: 'User',
            sortOrder: 1,
            visible: 0,
            status: 0
          }
        ]
      }
    ]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: treeMenus
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Assert: 验证树形结构被保留
    const tableData = (wrapper.vm as any).tableData
    expect(tableData).toHaveLength(1)
    expect(tableData[0].children).toBeDefined()
    expect(tableData[0].children).toHaveLength(1)
  })
})

describe('MenuManagement - Task 9.6: 实现菜单权限关联功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该打开权限选择对话框并加载已关联权限 (Requirement 13.1, 13.3)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    const mockPermissionIds = [1, 2, 3]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockPermissionIds
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 调用关联权限方法
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Assert: 验证 getMenuPermissions API 被调用
    expect(menuApi.getMenuPermissions).toHaveBeenCalledWith(1)

    // Assert: 验证权限对话框被打开
    expect((wrapper.vm as any).permissionDialogVisible).toBe(true)

    // Assert: 验证已选权限ID被设置
    expect((wrapper.vm as any).selectedPermissionIds).toEqual(mockPermissionIds)

    // Assert: 验证当前菜单被设置
    expect((wrapper.vm as any).currentMenuForPermission).toEqual(mockMenus[0])
  })

  it('应该处理加载权限失败的情况 (Requirement 13.3)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockRejectedValue(new Error('加载失败'))

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 调用关联权限方法
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Assert: 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('加载失败')

    // Assert: 验证权限对话框未被打开
    expect((wrapper.vm as any).permissionDialogVisible).toBe(false)
  })

  it('应该调用 associateMenuPermission API 关联新权限 (Requirement 13.4)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    const oldPermissionIds = [1, 2]
    const newPermissionIds = [1, 2, 3, 4] // 新增了 3 和 4

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: oldPermissionIds
    })

    vi.mocked(menuApi.associateMenuPermission).mockResolvedValue({
      code: 200,
      message: 'success',
      data: undefined
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 打开权限对话框
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Act: 确认权限关联
    await (wrapper.vm as any).handlePermissionConfirm(newPermissionIds)
    await wrapper.vm.$nextTick()

    // Assert: 验证 associateMenuPermission 被调用两次（新增 3 和 4）
    expect(menuApi.associateMenuPermission).toHaveBeenCalledTimes(2)
    expect(menuApi.associateMenuPermission).toHaveBeenCalledWith(1, 3)
    expect(menuApi.associateMenuPermission).toHaveBeenCalledWith(1, 4)

    // Assert: 验证成功消息被显示
    expect(ElMessage.success).toHaveBeenCalledWith('权限关联更新成功')

    // Assert: 验证对话框被关闭
    expect((wrapper.vm as any).permissionDialogVisible).toBe(false)
  })

  it('应该调用 disassociateMenuPermission API 取消关联权限 (Requirement 13.5)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    const oldPermissionIds = [1, 2, 3, 4]
    const newPermissionIds = [1, 2] // 删除了 3 和 4

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: oldPermissionIds
    })

    vi.mocked(menuApi.disassociateMenuPermission).mockResolvedValue({
      code: 200,
      message: 'success',
      data: undefined
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 打开权限对话框
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Act: 确认权限关联
    await (wrapper.vm as any).handlePermissionConfirm(newPermissionIds)
    await wrapper.vm.$nextTick()

    // Assert: 验证 disassociateMenuPermission 被调用两次（删除 3 和 4）
    expect(menuApi.disassociateMenuPermission).toHaveBeenCalledTimes(2)
    expect(menuApi.disassociateMenuPermission).toHaveBeenCalledWith(1, 3)
    expect(menuApi.disassociateMenuPermission).toHaveBeenCalledWith(1, 4)

    // Assert: 验证成功消息被显示
    expect(ElMessage.success).toHaveBeenCalledWith('权限关联更新成功')
  })

  it('应该同时处理新增和删除权限 (Requirement 13.4, 13.5)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    const oldPermissionIds = [1, 2, 3]
    const newPermissionIds = [2, 3, 4, 5] // 删除 1，新增 4 和 5，保留 2 和 3

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: oldPermissionIds
    })

    vi.mocked(menuApi.associateMenuPermission).mockResolvedValue({
      code: 200,
      message: 'success',
      data: undefined
    })

    vi.mocked(menuApi.disassociateMenuPermission).mockResolvedValue({
      code: 200,
      message: 'success',
      data: undefined
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 打开权限对话框
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Act: 确认权限关联
    await (wrapper.vm as any).handlePermissionConfirm(newPermissionIds)
    await wrapper.vm.$nextTick()

    // Assert: 验证新增操作
    expect(menuApi.associateMenuPermission).toHaveBeenCalledTimes(2)
    expect(menuApi.associateMenuPermission).toHaveBeenCalledWith(1, 4)
    expect(menuApi.associateMenuPermission).toHaveBeenCalledWith(1, 5)

    // Assert: 验证删除操作
    expect(menuApi.disassociateMenuPermission).toHaveBeenCalledTimes(1)
    expect(menuApi.disassociateMenuPermission).toHaveBeenCalledWith(1, 1)

    // Assert: 验证成功消息被显示
    expect(ElMessage.success).toHaveBeenCalledWith('权限关联更新成功')
  })

  it('应该处理权限关联失败的情况 (Requirement 13.6)', async () => {
    // Arrange: 准备测试数据
    const mockMenus: Menu[] = [
      {
        id: 1,
        parentId: 0,
        menuName: '系统管理',
        menuPath: '/system',
        component: 'Layout',
        icon: 'Setting',
        sortOrder: 1,
        visible: 0,
        status: 0
      }
    ]

    const oldPermissionIds = [1, 2]
    const newPermissionIds = [1, 2, 3]

    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockMenus
    })

    vi.mocked(menuApi.getMenuPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: oldPermissionIds
    })

    vi.mocked(menuApi.associateMenuPermission).mockRejectedValue(new Error('关联失败'))

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 打开权限对话框
    await (wrapper.vm as any).handleAssociatePermissions(mockMenus[0])
    await wrapper.vm.$nextTick()

    // Act: 确认权限关联
    await (wrapper.vm as any).handlePermissionConfirm(newPermissionIds)
    await wrapper.vm.$nextTick()

    // Assert: 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('关联失败')
  })

  it('应该在菜单ID不存在时显示错误 (Requirement 13.4)', async () => {
    // Arrange: 准备测试数据
    vi.mocked(menuApi.getMenus).mockResolvedValue({
      code: 200,
      message: 'success',
      data: []
    })

    // Act: 挂载组件
    const wrapper = mount(MenuManagement, {
      global: {
        stubs: {
          PageHeader: true,
          SearchBar: true,
          MenuForm: true,
          PermissionSelector: true,
          ElTable: true,
          ElTableColumn: true,
          ElButton: true,
          ElIcon: true,
          ElTag: true,
          ElEmpty: true
        }
      }
    })

    // 等待初始加载完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Act: 设置 currentMenuForPermission 为 null
    ;(wrapper.vm as any).currentMenuForPermission = null

    // Act: 尝试确认权限关联
    await (wrapper.vm as any).handlePermissionConfirm([1, 2, 3])
    await wrapper.vm.$nextTick()

    // Assert: 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('菜单ID不存在')
  })
})
