import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElForm, ElFormItem, ElButton } from 'element-plus'
import SearchBar from '../SearchBar.vue'

describe('SearchBar', () => {
  it('should render search and reset buttons', () => {
    const wrapper = mount(SearchBar, {
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElButton
        }
      }
    })
    
    const buttons = wrapper.findAllComponents(ElButton)
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('should emit search event when search button is clicked', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: { keyword: 'test' }
      },
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElButton
        }
      }
    })
    
    await wrapper.vm.handleSearch()
    
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should emit reset event when reset button is clicked', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: { keyword: 'test' }
      },
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElButton
        }
      }
    })
    
    await wrapper.vm.handleReset()
    
    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should clear form data when reset is called', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        modelValue: { keyword: 'test', status: '1' }
      },
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElButton
        }
      }
    })
    
    await wrapper.vm.handleReset()
    
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    if (emitted) {
      const emittedData = emitted[0][0] as Record<string, any>
      expect(emittedData.keyword).toBe('')
      expect(emittedData.status).toBe('')
    }
  })
})
