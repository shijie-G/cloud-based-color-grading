/**
 * 权限状态管理 Store
 * 管理菜单树和权限相关状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuTreeNode } from '@/types'

export const usePermissionStore = defineStore('permission', () => {
  // State
  const menuTree = ref<MenuTreeNode[]>([])
  const flatMenus = ref<MenuTreeNode[]>([])
  
  // Actions
  
  /**
   * 设置菜单树
   * @param tree 菜单树数据
   */
  function setMenuTree(tree: MenuTreeNode[]): void {
    menuTree.value = tree
    flatMenus.value = flattenMenuTree(tree)
  }
  
  /**
   * 扁平化菜单树
   * 将树形结构转换为一维数组，便于查找和遍历
   * @param tree 菜单树
   * @returns 扁平化的菜单数组
   */
  function flattenMenuTree(tree: MenuTreeNode[]): MenuTreeNode[] {
    const result: MenuTreeNode[] = []
    
    function traverse(nodes: MenuTreeNode[]) {
      nodes.forEach(node => {
        result.push(node)
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    
    traverse(tree)
    return result
  }
  
  /**
   * 清除菜单树
   * 用于登出时清理状态
   */
  function clearMenuTree(): void {
    menuTree.value = []
    flatMenus.value = []
  }
  
  /**
   * 根据 ID 查找菜单
   * @param id 菜单 ID
   * @returns 菜单节点或 undefined
   */
  function findMenuById(id: number): MenuTreeNode | undefined {
    return flatMenus.value.find(menu => menu.id === id)
  }
  
  /**
   * 根据路径查找菜单
   * @param path 菜单路径
   * @returns 菜单节点或 undefined
   */
  function findMenuByPath(path: string): MenuTreeNode | undefined {
    return flatMenus.value.find(menu => menu.menuPath === path)
  }
  
  return {
    // State
    menuTree,
    flatMenus,
    // Actions
    setMenuTree,
    clearMenuTree,
    findMenuById,
    findMenuByPath
  }
})
