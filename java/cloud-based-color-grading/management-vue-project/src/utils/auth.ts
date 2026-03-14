/**
 * 认证工具函数
 * 提供 Token 存储、获取、删除等功能
 */

const TOKEN_KEY = 'access_token'

/**
 * 设置 Token
 * @param token JWT Token
 */
export function setToken(token: string): void {
  console.log('=== setToken ===')
  console.log('保存Token到localStorage, key:', TOKEN_KEY)
  console.log('Token:', token.substring(0, 50) + '...')
  localStorage.setItem(TOKEN_KEY, token)
  console.log('保存后验证:', localStorage.getItem(TOKEN_KEY) ? '成功' : '失败')
}

/**
 * 获取 Token
 * @returns JWT Token 或 null
 */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  console.log('=== getToken ===')
  console.log('从localStorage获取Token, key:', TOKEN_KEY)
  console.log('获取到的Token:', token ? token.substring(0, 50) + '...' : 'null')
  return token
}

/**
 * 删除 Token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 检查是否已登录
 * @returns 是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}
