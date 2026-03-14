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
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取 Token
 * @returns JWT Token 或 null
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
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
