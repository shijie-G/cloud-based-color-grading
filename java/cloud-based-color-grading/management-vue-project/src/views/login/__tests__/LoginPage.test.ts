import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../LoginPage.vue'

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}))

vi.mock('../../../api/authApi', () => ({
  login: mockLogin,
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>()
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { expose, slots }) {
    expose({
      validate: vi.fn().mockResolvedValue(true),
    })

    return () => slots.default?.()
  },
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'keyup'],
  setup(_props, { expose }) {
    expose({
      focus: vi.fn(),
    })

    return {}
  },
  template: `
    <input
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target && $event.target.value)"
      @keyup="$emit('keyup', $event)"
    />
  `,
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  props: {
    disabled: Boolean,
    loading: Boolean,
  },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
})

async function mountLoginPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        component: LoginPage,
      },
    ],
  })

  await router.push('/login')
  await router.isReady()

  return mount(LoginPage, {
    global: {
      plugins: [router, createPinia()],
      stubs: {
        ElForm: ElFormStub,
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: ElInputStub,
        ElButton: ElButtonStub,
        ElIcon: { template: '<span><slot /></span>' },
      },
    },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockLogin.mockReset()
    mockLogin.mockResolvedValue({
      token: 'token',
      userId: 1,
      username: 'admin',
      nickname: 'Admin',
      roles: [],
      permissions: [],
      menus: [],
    })
  })

  it('submits valid credentials to the backend login API', async () => {
    const wrapper = await mountLoginPage()
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('admin')
    await inputs[1].setValue('admin123')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith({
      username: 'admin',
      password: 'admin123',
    })
  })
})
