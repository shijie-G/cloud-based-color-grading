/**
 * 表单验证工具函数
 * 提供各种输入验证和清理功能
 */

/**
 * 验证角色标识格式
 * 格式要求：ROLE_ 开头，后跟大写字母和下划线
 * @param value 角色标识
 * @returns 是否有效
 */
export function validateRoleKey(value: string): boolean {
  if (!value) return false
  return /^ROLE_[A-Z_]+$/.test(value)
}

/**
 * 验证菜单路径格式
 * 格式要求：以 / 开头，只包含小写字母、数字、斜杠和连字符
 * @param value 菜单路径
 * @returns 是否有效
 */
export function validateMenuPath(value: string): boolean {
  if (!value) return false
  return /^\/[a-z0-9/-]*$/.test(value)
}

/**
 * 清理输入，移除潜在危险字符
 * @param value 输入字符串
 * @returns 清理后的字符串
 */
export function sanitizeInput(value: string): string {
  if (!value) return ''
  // 移除 HTML 特殊字符
  return value.replace(/[<>"']/g, '')
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param phone 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证 URL 格式
 * @param url URL 地址
 * @returns 是否有效
 */
export function validateUrl(url: string): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证权限标识格式
 * 格式要求：小写字母、数字、冒号和下划线
 * 例如：system:role:view
 * @param value 权限标识
 * @returns 是否有效
 */
export function validatePermissionKey(value: string): boolean {
  if (!value) return false
  return /^[a-z0-9:_]+$/.test(value)
}

/**
 * 验证排序号
 * @param value 排序号
 * @returns 是否有效
 */
export function validateSortOrder(value: number): boolean {
  return typeof value === 'number' && value >= 0 && Number.isInteger(value)
}
