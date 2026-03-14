import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../PageHeader.vue'

describe('PageHeader', () => {
  it('should render title correctly', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '角色管理'
      }
    })
    
    expect(wrapper.find('.page-title').text()).toBe('角色管理')
  })

  it('should render description when provided', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '角色管理',
        description: '管理系统角色和权限'
      }
    })
    
    expect(wrapper.find('.page-description').exists()).toBe(true)
    expect(wrapper.find('.page-description').text()).toBe('管理系统角色和权限')
  })

  it('should not render description when not provided', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '角色管理'
      }
    })
    
    expect(wrapper.find('.page-description').exists()).toBe(false)
  })

  it('should render actions slot', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: '角色管理'
      },
      slots: {
        actions: '<button>新增</button>'
      }
    })
    
    expect(wrapper.find('.header-right button').exists()).toBe(true)
    expect(wrapper.find('.header-right button').text()).toBe('新增')
  })
})
