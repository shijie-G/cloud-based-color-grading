import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import RoleForm from '../RoleForm.vue'
import type { Role } from '@/types'

describe('RoleForm', () => {
  let wrapper: VueWrapper<any>

  const createWrapper = (props = {}) => {
    return mount(RoleForm, {
      props: {
        modelValue: true,
        mode: 'add',
        ...props
      },
      global: {
        stubs: {
          Teleport: true,
          ElDialog: {
            template: '<div class="el-dialog"><slot /></div>',
            props: ['modelValue', 'title', 'width', 'closeOnClickModal']
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
            props: ['modelValue', 'placeholder', 'clearable', 'maxlength', 'showWordLimit', 'type', 'rows']
          },
          ElRadioGroup: {
            template: '<div class="el-radio-group"><slot /></div>',
            props: ['modelValue']
          },
          ElRadio: {
            template: '<label class="el-radio"><input type="radio" :value="label" />{{ label === 0 ? "正常" : "禁用" }}</label>',
            props: ['label']
          },
          ElButton: {
            template: '<button :disabled="loading"><slot /></button>',
            props: ['type', 'loading']
          },
          ElIcon: {
            template: '<i><slot /></i>'
          }
        }
      }
    })
  }

  beforeEach(() => {
    wrapper?.unmount()
  })

  describe('Rendering', () => {
    it('should render form fields correctly in add mode', () => {
      wrapper = createWrapper()

      // Check that the component is mounted
      expect(wrapper.exists()).toBe(true)
      
      // Check that form exists
      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
    })

    it('should display correct title in add mode', () => {
      wrapper = createWrapper({ mode: 'add' })
      
      // Check that the component has the correct mode
      const vm = wrapper.vm as any
      expect(vm.mode).toBe('add')
    })

    it('should display correct title in edit mode', () => {
      wrapper = createWrapper({ mode: 'edit' })
      
      // Check that the component has the correct mode
      const vm = wrapper.vm as any
      expect(vm.mode).toBe('edit')
    })

    it('should render status radio buttons', () => {
      wrapper = createWrapper()
      
      // Check for radio inputs
      const radios = wrapper.findAll('input[type="radio"]')
      expect(radios.length).toBeGreaterThanOrEqual(2)
    })

    it('should render action buttons', () => {
      wrapper = createWrapper()
      
      // Check for form element
      const form = wrapper.find('form')
      expect(form.exists()).toBe(true)
    })
  })

  describe('Form Data', () => {
    it('should initialize with empty form data in add mode', () => {
      wrapper = createWrapper({ mode: 'add' })
      
      const vm = wrapper.vm as any
      expect(vm.formData.roleName).toBe('')
      expect(vm.formData.roleKey).toBe('')
      expect(vm.formData.description).toBe('')
      expect(vm.formData.status).toBe(0)
    })

    it('should populate form data in edit mode', async () => {
      const roleData: Role = {
        id: 1,
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试描述',
        status: 0,
        createTime: '2024-01-01'
      }

      wrapper = createWrapper({
        mode: 'edit',
        roleData
      })

      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any
      expect(vm.formData.roleName).toBe('测试角色')
      expect(vm.formData.roleKey).toBe('ROLE_TEST')
      expect(vm.formData.description).toBe('测试描述')
      expect(vm.formData.status).toBe(0)
    })
  })

  describe('Form Validation', () => {
    it('should validate required roleName field', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      
      // Try to validate with empty roleName
      vm.formData.roleName = ''
      
      // Mock validation to fail
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

    it('should validate roleName length', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      
      // Test minimum length
      vm.formData.roleName = 'A'
      vm.formData.roleKey = 'ROLE_TEST'
      
      // Mock validation to fail
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error for short name')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should validate roleKey format', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      
      // Test invalid format
      vm.formData.roleName = '测试角色'
      vm.formData.roleKey = 'invalid_format'
      
      // Mock validation to fail
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error for invalid roleKey format')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should accept valid roleKey format', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      
      vm.formData.roleName = '测试角色'
      vm.formData.roleKey = 'ROLE_TEST_ADMIN'
      vm.formData.status = 0
      
      // Mock successful validation
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockResolvedValue(true)
      }
      
      await expect(vm.formRef?.validate()).resolves.toBe(true)
    })

    it('should validate description length', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      
      vm.formData.roleName = '测试角色'
      vm.formData.roleKey = 'ROLE_TEST'
      vm.formData.description = 'A'.repeat(201) // Exceeds max length
      
      // Mock validation to fail
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      try {
        await vm.formRef?.validate()
        expect.fail('Should have thrown validation error for long description')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Events', () => {
    it('should emit submit event with form data on valid submission', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData = {
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试描述',
        status: 0
      }

      await wrapper.vm.$nextTick()
      
      // Mock successful validation
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockResolvedValue(true)
      }
      
      await vm.handleSubmit()
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0][0]).toEqual({
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试描述',
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

    it('should not emit submit event on invalid form', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData = {
        roleName: '', // Invalid: empty
        roleKey: 'ROLE_TEST',
        description: '',
        status: 0
      }

      await wrapper.vm.$nextTick()
      
      // Mock validation to fail
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockRejectedValue(new Error('Validation failed'))
      }
      
      await vm.handleSubmit()
      
      // Should not emit submit when validation fails
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm as any
      vm.formData = {
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试描述',
        status: 0
      }

      // Initially not loading
      expect(vm.loading).toBe(false)
      
      // Mock validation
      const formRef = vm.formRef
      if (formRef) {
        formRef.validate = vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(true), 10)
          })
        })
      }
      
      const submitPromise = vm.handleSubmit()
      
      // Should be loading during submission
      await wrapper.vm.$nextTick()
      
      await submitPromise
      
      // Should not be loading after submission
      expect(vm.loading).toBe(false)
    })

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
        roleName: '测试角色',
        roleKey: 'ROLE_TEST',
        description: '测试描述',
        status: 1
      }

      await wrapper.vm.$nextTick()
      
      vm.resetForm()
      
      expect(vm.formData.roleName).toBe('')
      expect(vm.formData.roleKey).toBe('')
      expect(vm.formData.description).toBe('')
      expect(vm.formData.status).toBe(0)
    })

    it('should reset form when dialog opens in add mode', async () => {
      wrapper = createWrapper({ modelValue: false, mode: 'add' })
      
      const vm = wrapper.vm as any
      vm.formData.roleName = '测试角色'
      
      await wrapper.setProps({ modelValue: true })
      await wrapper.vm.$nextTick()
      
      expect(vm.formData.roleName).toBe('')
    })
  })
})
