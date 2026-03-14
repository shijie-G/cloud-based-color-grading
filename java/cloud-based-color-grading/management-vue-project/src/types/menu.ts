/**
 * 菜单相关类型定义
 */

// 菜单
export interface Menu {
  id: number
  parentId: number
  menuName: string
  menuPath: string
  component: string
  icon: string
  sortOrder: number
  visible: number             // 0-显示 1-隐藏
  status: number              // 0-正常 1-禁用
  children?: Menu[]
}

// 菜单表单数据
export interface MenuFormData {
  parentId: number
  menuName: string
  menuPath: string
  component: string
  icon: string
  sortOrder: number
  visible: number
  status: number
}

// 菜单树节点
export interface MenuTreeNode {
  id: number
  parentId: number
  menuName: string
  menuPath: string
  component: string
  icon: string
  sortOrder: number
  children: MenuTreeNode[]
}
