/**
 * 权限相关类型定义
 */

// 权限
export interface Permission {
  id: number
  permissionName: string
  permissionKey: string
  resourceType: 'menu' | 'button' | 'api'
  resourcePath: string
  method: string              // GET, POST, PUT, DELETE
  description: string
}

// 权限表单数据
export interface PermissionFormData {
  permissionName: string
  permissionKey: string
  resourceType: 'menu' | 'button' | 'api'
  resourcePath: string
  method: string
  description: string
}
