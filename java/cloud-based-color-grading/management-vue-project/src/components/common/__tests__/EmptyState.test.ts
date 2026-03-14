import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Document, FolderOpened } from '@element-plus/icons-vue'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('should render default text when no props provided', () => {
    const wrapper = mount(EmptyState)
    
    expect(wrapper.find('.empty-text').text()).toBe('暂无数据')
  })

  it('should render custom text when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        text: '没有找到角色'
      }
    })
    
    expect(wrapper.find('.empty-text').text()).toBe('没有找到角色')
  })

  it('should render description when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        text: '暂无数据',
        description: '请点击新增按钮创建数据'
      }
    })
    
    expect(wrapper.find('.empty-description').exists()).toBe(true)
    expect(wrapper.find('.empty-description').text()).toBe('请点击新增按钮创建数据')
  })

  it('should not render description when not provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        text: '暂无数据'
      }
    })
    
    expect(wrapper.find('.empty-description').exists()).toBe(false)
  })

  it('should render default icon', () => {
    const wrapper = mount(EmptyState)
    
    expect(wrapper.find('.empty-icon').exists()).toBe(true)
  })

  it('should render custom icon when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: FolderOpened
      }
    })
    
    expect(wrapper.find('.empty-icon').exists()).toBe(true)
  })

  it('should render actions slot when provided', () => {
    const wrapper = mount(EmptyState, {
      slots: {
        actions: '<button>新增数据</button>'
      }
    })
    
    expect(wrapper.find('.empty-actions').exists()).toBe(true)
    expect(wrapper.find('.empty-actions button').text()).toBe('新增数据')
  })

  it('should not render actions slot when not provided', () => {
    const wrapper = mount(EmptyState)
    
    expect(wrapper.find('.empty-actions').exists()).toBe(false)
  })

  it('should use custom icon size when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        iconSize: 100
      }
    })
    
    expect(wrapper.find('.empty-icon').exists()).toBe(true)
  })
})
