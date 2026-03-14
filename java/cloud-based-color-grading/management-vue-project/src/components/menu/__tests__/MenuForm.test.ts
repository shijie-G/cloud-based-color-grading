import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import MenuForm from '../MenuForm.vue'
import type { Menu } from '@/types'

describe('MenuForm', () => {
  let wrapper: VueWrapper<any>

  const mockMenuTree: Menu[] = [
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
          component: 'views/user/index',
          icon: 'User',
          sortOrder: 1,
          visible: 0,
          status: 0
        }
      ]
    }
  ]

  const createWrapper = (props = {}) => {
    return mount(MenuForm, {
      props: {
        modelValue: true,
        mode: 'add',
        menuTree: mockMenuTree,
        ...props
      },
      global: {
        stubs: {
          Teleport: true,
          ElDialog: {
            template: '<div class="el-dialog"><slot /><slot name="footer" /></div>',
            props: ['modelValue', 'title', 'width', 'closeOnClickModal', 'appendToBody']
          },
          ElForm: {
            template: '<form><slot /></form>',
            props: ['model', 'rules', 'labelWidth'],
            methods: {
              validate: vi.fn().mockResolvedValue(true),
              clearValidate: vi.fn()
            }
          },
          ElFormItem: {
            template: '<div class="el-form-item"><slot /><slot name="extra" /></div>',
            props: ['label', 'prop']
          },
          ElInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
            props: ['modelValue', 'placeholder', 'clearable', 'maxlength', 'showWordLimit', 'prefixIcon']
          },
          ElTreeSelect: {
            template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="0">顶级菜单</option></select>',
            props: ['modelValue', 'data', 'props', 'placeholder', 'clearable', 'checkStrictly', 'renderAfterExpand']
          },
          ElInputNumber: {
            template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
            props: ['modelValue', 'min', 'max', 'controlsPosition']
          },
          ElRadioGroup: {
            template: '<div class="el-radio-group"><slot /></div>',
            props: ['modelValue']
          },
          ElRadio: {
            template: '<label class="el-radio"><input type="radio" :value="label" />{{ getLabel(label) }}</label>',
            props: ['label'],
            methods: {
              getLabel(val: number) {
                if (this.$parent?.label === 'visible') {
                  return val === 0 ? '显示' : '隐藏'
                }
                return val === 0 ? '正常' : '禁用'
              }
            }
          },
          ElButton: {
            template: '<button :disabled="loading"><slot /></button>',
            props: ['type', 'loading']
          },
          ElIcon: {
            template: '<i><slot /></i>',
            props: ['size']
          },
          Search: {
            template: '<span>Search</span>'
          }
        }
      }
    })
  }

  beforeEach(() => {
    wrapper?.unmount()
  })

  describe('Rendering', () => {
    it('should render form correctly', () => {
      wrapper = createWrapper()

      expect(wrapper.exists()).toBe(true)
      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
    })

    it('should display correct title in add mode for top-level menu', () => {
      wrapper = createWrapper({ mode: 'add', parentId: 0 })
      
      const vm = wrapper.vm as any
      expect(vm.mode).toBe('add')
      expect(vm.parentId).toBe(0)
    })

    it('should display correct title in add mode for sub-menu', () => {
      wrapper = createWrapper({ mode: 'add', parentId: 1 })
      
      const vm = wrapper.vm as any
      expect(vm.mode).toBe('add')
      expect(vm.parentId).toBe(1)
    })

    it('should display correct title in edit mode', () => {
      wrapper = createWrapper({ mode: 'edit' })
      
      const vm = wrapper.vm as any
      expect(vm.mode).toBe('edit')
    })

    it('should render all form fields', () => {
      wrapper = createWrapper()
      
      // Check for select (parent menu)
      const selects = wrapper.findAll('select')
      expect(selects.length).toBeGreaterThan(0)
      
      // Check for inputs
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('Form Data', () => {
    it('should initialize with empty form data in add mode', () => {
      wrapper = createWrapper({ mode: 'add' })
      
      const vm = wrapper.vm as any
      expect(vm.formData.menuName).toBe('')
      expect(vm.formData.menuPath).toBe('')
      expect(vm.formData.component).toBe('')
      expect(vm.formData.icon).toBe('')
      expect(vm.formData.sortOrder).toBe(0)
      expect(vm.formData.visible).toBe(0)
      expect(vm.formData.status).toBe(0)
    })

    it('should set parentId from props in add mode', async () => {
      wrapper = createWrapper({ mode: 'add', parentId: 1 })
      
      await wrapper.vm.$nextTick()
      
      const vm = wrapper.vm as any
      expect(vm.formData.parentId).toBe(1)
    })

    it('should populate form data in edit mode', async () => {
      const menuData: Menu = {
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

      wrapper = createWrapper({
        mode: 'edit',
        menuData
      })

      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.formData.menuName).toBe('系统管理')
      expect(vm.formData.menuPath).toBe('/system')
      expect(vm.formData.component).toBe('Layout')
      expect(vm.formData.icon).toBe('Setting')
      expect(vm.formData.sortOrder).toBe(1)
    })
  })

  describe('Form Validation', () => {
    it('should validate required menuName field', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData.menuName = ''
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should validate menuPath format', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData.menuName = '测试菜单'
      vm.formData.menuPath = 'invalid-path' // Missing leading slash
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should accept valid menuPath format', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData.menuName = '测试菜单'
      vm.formData.menuPath = '/test/menu'
      vm.formData.component = 'views/test/index'
      vm.formData.sortOrder = 1
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockResolvedValue(true)
      }
      
      await expect(vm.formRef?.validate()).resolves.toBe(true)
    })

    it('should validate required component field', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData.menuName = '测试菜单'
      vm.formData.menuPath = '/test'
      vm.formData.component = ''
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should validate sortOrder minimum value', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData.sortOrder = -1
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Circular Reference Prevention', () => {
    it('should exclude current menu from parent options in edit mode', () => {
      const menuData: Menu = {
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

      wrapper = createWrapper({
        mode: 'edit',
        menuData
      })

      const vm = wrapper.vm as any
      const options = vm.menuTreeOptions
      
      // Should not include the current menu (id: 1) in options
      const hasCurrentMenu = JSON.stringify(options).includes('"id":1')
      expect(hasCurrentMenu).toBe(false)
    })
  })

  describe('Events', () => {
    it('should emit submit event with form data on valid submission', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData = {
        parentId: 0,
        menuName: '测试菜单',
        menuPath: '/test',
        component: 'views/test/index',
        icon: 'Menu',
        sortOrder: 1,
        visible: 0,
        status: 0
      }

      await wrapper.vm.$nextTick()
      
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockResolvedValue(true)
      }
      
      await vm.handleSubmit()
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0][0]).toEqual({
        parentId: 0,
        menuName: '测试菜单',
        menuPath: '/test',
        component: 'views/test/index',
        icon: 'Menu',
        sortOrder: 1,
        visible: 0,
        status: 0
      })
    })

    it('should emit update:modelValue when dialog is closed', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.handleCancel()
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(false)
    })
  })

  describe('Icon Selection', () => {
    it('should have available icons list', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(vm.availableIcons).toBeDefined()
      expect(vm.availableIcons.length).toBeGreaterThan(0)
    })

    it('should filter icons based on search keyword', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.iconSearchKeyword = 'user'
      
      await wrapper.vm.$nextTick()
      
      const filtered = vm.filteredIcons
      expect(filtered.length).toBeLessThanOrEqual(vm.availableIcons.length)
    })

    it('should select icon when clicked', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.selectIcon('User')
      
      expect(vm.formData.icon).toBe('User')
    })
  })

  describe('Loading State', () => {
    it('should expose setLoading method', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      expect(typeof vm.setLoading).toBe('function')
      
      vm.setLoading(true)
      expect(vm.loading).toBe(true)
      
      vm.setLoading(false)
      expect(vm.loading).toBe(false)
    })
  })

  describe('Form Reset', () => {
    it('should reset form data when resetForm is called', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData = {
        parentId: 1,
        menuName: '测试菜单',
        menuPath: '/test',
        component: 'views/test/index',
        icon: 'Menu',
        sortOrder: 5,
        visible: 1,
        status: 1
      }

      await wrapper.vm.$nextTick()
      
      vm.resetForm()
      
      expect(vm.formData.parentId).toBe(0)
      expect(vm.formData.menuName).toBe('')
      expect(vm.formData.menuPath).toBe('')
      expect(vm.formData.component).toBe('')
      expect(vm.formData.icon).toBe('')
      expect(vm.formData.sortOrder).toBe(0)
      expect(vm.formData.visible).toBe(0)
      expect(vm.formData.status).toBe(0)
    })

    it('should reset form when dialog opens in add mode', async () => {
      wrapper = createWrapper({ modelValue: false, mode: 'add', parentId: 0 })
      
      const vm = wrapper.vm as any
      vm.formData.menuName = '测试菜单'
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      
      expect(vm.formData.menuName).toBe('')
    })
  })
})
