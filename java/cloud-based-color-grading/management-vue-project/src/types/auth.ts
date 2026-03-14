/**
 * 登录表单数据
 */
export interface LoginFormData {
  username: string; // 手机号或邮箱
  password: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string; // 手机号或邮箱
  password: string;
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string;
  userId: number;  // 修改为 number 类型
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
  menus: MenuItem[];
}

/**
 * 用户信息（存储在 Store 中）
 */
export interface UserInfo {
  token: string;
  userId: number;  // 修改为 number 类型
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
  menus: MenuItem[];
}
