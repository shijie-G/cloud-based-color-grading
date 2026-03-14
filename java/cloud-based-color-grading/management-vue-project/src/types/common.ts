/**
 * 通用类型定义
 */

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PageParams {
  current: number
  size: number
}

// 分页响应
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 表格列配置
export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  formatter?: (row: any, column: any, cellValue: any) => string
}
