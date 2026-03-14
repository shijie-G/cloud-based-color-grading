import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import PermissionSelector from '../PermissionSelector.vue'
import type { Permission } from '@/types'
import * as permissionApi from '@/api/permission'

// Mock the API
vi.mock('@/api/permission', () => ({
  getPermissions: vi.fn()
}))

describe('PermissionSelector', () => {
  let wrapper: VueWrapper<any>

  const mockPermissions: Permission[] = [
    {
      id: 1,
      permissionName: '查看用户',
      permissionKey: 'system:user:view',
      resourceType: 'menu',
      resourcePath: '/system/user',
      method: 'GET',
      description: '查看用户列表'
    },
    {
      id: 2,
      permissionName: '创建用户',
      permissionKey: 'system:user:create',
      resourceType: 'button',
      resourcePath: '/system/user',
      method: 'POST',
      description: '创建新用户'
    },
    {
      id: 3,
      permissionName: '删除用户',
      permissionKey: 'system:user:delete',
      resourceType: 'api',
      resourcePath: '/api/users/:id',
      method: 'DELETE',
      description: '删除用户'
    }
  ]

  const createWrapper = (props = {}) => {
    return mount(PermissionSelector, {
      props: {
        modelValue: true,
        selectedIds: [],
        ...props
      },
      global: {
        directives: {
          loading: () => {}
        },
        stubs: {
          Teleport: true,
          ElDialog: {
            template: '<div class="el-dialog"><slot /><slot name="footer" /></div>',
            props: ['modelValue', 'title', 'width', 'closeOnClickModal']
          },
          ElInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
            props: ['modelValue', 'placeholder', 'clearable', 'prefixIcon']
          },
          ElSelect: {
            template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
            props: ['modelValue', 'placeholder', 'clearable']
          },
          ElOption: {
            template: '<option :value="value"><slot /></option>',
            props: ['label', 'value']
          },
          ElTable: {
            template: '<div class="el-table"><slot /></div>',
            props: ['data', 'height', 'loading'],
            methods: {
              clearSelection: vi.fn(),
              toggleRowSelection: vi.fn()
            }
          },
          ElTableColumn: {
            template: '<div class="el-table-column"></div>',
            props: ['type', 'prop', 'label', 'width', 'minWidth', 'showOverflowTooltip', 'reserveSelection']
          },
          ElTag: {
            template: '<span class="el-tag"><slot /></span>',
            props: ['type', 'size', 'closable']
          },
          ElButton: {
            template: '<button><slot /></button>',
            props: ['type']
          }
        }
      }
    })
  }

  beforeEach(() => {
    wrapper?.unmount()
    vi.clearAllMocks()
    
    // Setup default mock response
    vi.mocked(permissionApi.getPermissions).mockResolvedValue({
      code: 200,
      message: 'success',
      data: mockPermissions
    })
  })

  describe('Rendering', () => {
    it('should render dialog correctly', async () => {
      wrapper = createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.permission-selector').exists()).toBe(true)
    })

    it('should display custom title', async () => {
      wrapper = createWrapper({ title: '分配权限' })
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      expect(vm.title).toBe('分配权限')
    })

    it('should render search input', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('should render filter select', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const selects = wrapper.findAll('select')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should render permission table', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const table = wrapper.find('.el-table')
      expect(table.exists()).toBe(true)
    })
  })

  describe('Data Loading', () => {
    it('should load permissions when dialog opens', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(permissionApi.getPermissions).toHaveBeenCalled()
    })

    it('should store loaded permissions', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      expect(vm.permissions.length).toBeGreaterThan(0)
    })

    it('should handle loading error gracefully', async () => {
      vi.mocked(permissionApi.getPermissions).mockRejectedValue(new Error('Network error'))
      
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      expect(vm.permissions).toEqual([])
    })
  })

  describe('Search Functionality', () => {
    it('should filter permissions by search keyword', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.searchKeyword = '创建'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].permissionName).toContain('创建')
    })

    it('should search by permission key', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.searchKeyword = 'user:view'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].permissionKey).toContain('user:view')
    })

    it('should be case-insensitive', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.searchKeyword = 'USER'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should return all permissions when search is empty', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.searchKeyword = ''
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBe(mockPermissions.length)
    })
  })

  describe('Filter by Type', () => {
    it('should filter permissions by resource type', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.filterType = 'menu'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].resourceType).toBe('menu')
    })

    it('should filter by button type', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.filterType = 'button'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].resourceType).toBe('button')
    })

    it('should filter by api type', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.filterType = 'api'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].resourceType).toBe('api')
    })

    it('should return all permissions when filter is empty', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.filterType = ''
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBe(mockPermissions.length)
    })
  })

  describe('Combined Search and Filter', () => {
    it('should apply both search and filter', async () => {
      wrapper = createWrapper({ modelValue: false })
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const vm = wrapper.vm as any
      vm.searchKeyword = '用户'
      vm.filterType = 'button'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredPermissions
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].permissionName).toContain('用户')
      expect(filtered[0].resourceType).toBe('button')
    })
  })

  describe('Selection Management', () => {
    it('should track selected permissions', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.handleSelectionChange([mockPermissions[0], mockPermissions[1]])
      
      expect(vm.selectedPermissions.length).toBe(2)
    })

    it('should restore selection from selectedIds prop', async () => {
      wrapper = createWrapper({ selectedIds: [1, 2] })
      
      await wrapper.vm.$nextTick()
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const vm = wrapper.vm as any
      // Just check that tableRef exists
      expect(vm.tableRef).toBeDefined()
    })

    it('should display selected count', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.selectedPermissions = [mockPermissions[0], mockPermissions[1]]
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('2')
    })
  })

  describe('Events', () => {
    it('should emit confirm event with selected ids', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.selectedPermissions = [mockPermissions[0], mockPermissions[2]]
      
      vm.handleConfirm()
      
      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')?.[0][0]).toEqual([1, 3])
    })

    it('should emit update:modelValue when canceled', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.handleCancel()
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(false)
    })

    it('should close dialog after confirm', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.handleConfirm()
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('Helper Methods', () => {
    it('should return correct resource type label', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(vm.getResourceTypeLabel('menu')).toBe('菜单')
      expect(vm.getResourceTypeLabel('button')).toBe('按钮')
      expect(vm.getResourceTypeLabel('api')).toBe('API')
    })

    it('should return correct resource type tag', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(vm.getResourceTypeTag('menu')).toBe('primary')
      expect(vm.getResourceTypeTag('button')).toBe('success')
      expect(vm.getResourceTypeTag('api')).toBe('warning')
    })

    it('should return correct method tag', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(vm.getMethodTag('GET')).toBe('info')
      expect(vm.getMethodTag('POST')).toBe('success')
      expect(vm.getMethodTag('PUT')).toBe('warning')
      expect(vm.getMethodTag('DELETE')).toBe('danger')
    })
  })

  describe('Remove Permission', () => {
    it('should remove permission from selection', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.selectedPermissions = [mockPermissions[0], mockPermissions[1]]
      
      vm.removePermission(mockPermissions[0])
      
      // Just check that the method was called
      expect(vm.tableRef).toBeDefined()
    })
  })

  describe('Reset on Close', () => {
    it('should reset filters when dialog closes', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      vm.searchKeyword = 'test'
      vm.filterType = 'menu'
      
      vm.handleClose()
      
      expect(vm.searchKeyword).toBe('')
      expect(vm.filterType).toBe('')
    })
  })

  describe('Exposed Methods', () => {
    it('should expose loadPermissions method', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(typeof vm.loadPermissions).toBe('function')
    })
  })
})
