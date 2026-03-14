/**
 * 角色相关类型定义
 */

// 角色
export interface Role {
  id: number
  roleName: string
  roleKey: string
  description: string
  status: number              // 0-正常 1-禁用
  createTime: string
}

// 角色表单数据
export interface RoleFormData {
  roleName: string
  roleKey: string
  description: string
  status: number
}
