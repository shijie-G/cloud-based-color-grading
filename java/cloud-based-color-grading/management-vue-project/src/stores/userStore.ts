import { defineStore } from 'pinia';
import { login as authLogin } from '../api/authApi';
import type { LoginRequest, LoginResponse, MenuItem } from '../types/auth';

/**
 * 用户状态接口
 */
interface UserState {
  token: string | null;
  userId: number | null;  // 修改为 number 类型
  username: string | null;
  nickname: string | null;
  roles: string[];
  permissions: string[];
  menus: MenuItem[]; // 仅保存在内存中，不持久化到 localStorage
}

/**
 * localStorage 中存储的用户信息（不包括 menus）
 */
interface StoredUserInfo {
  userId: number;  // 修改为 number 类型
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

/**
 * User Store
 * 管理用户认证状态、用户信息和权限
 * 
 * 需求: 3.4, 5.1, 5.2, 5.3, 5.5
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: null,
    userId: null,
    username: null,
    nickname: null,
    roles: [],
    permissions: [],
    menus: []
  }),

  getters: {
    /**
     * 判断用户是否已登录
     * @returns 如果存在 token 则返回 true
     */
    isLoggedIn: (state): boolean => !!state.token,

    /**
     * 检查用户是否拥有指定权限
     * @param permission - 权限标识
     * @returns 如果用户拥有该权限则返回 true
     */
    hasPermission: (state) => (permission: string): boolean => 
      state.permissions.includes(permission),

    /**
     * 检查用户是否拥有指定角色
     * @param role - 角色标识
     * @returns 如果用户拥有该角色则返回 true
     */
    hasRole: (state) => (role: string): boolean => 
      state.roles.includes(role)
  },

  actions: {
    /**
     * 设置用户信息
     * 保存登录响应数据到 state 和 localStorage
     * 注意：menus 仅保存到 state，不保存到 localStorage
     * 
     * @param data - 登录响应数据
     * 需求: 3.4, 5.1, 5.2
     */
    setUserInfo(data: LoginResponse): void {
      console.log('setUserInfo 被调用，数据:', data);
      console.log('setUserInfo 数据类型:', typeof data);
      console.log('setUserInfo token:', data.token);
      console.log('setUserInfo token 类型:', typeof data.token);
      
      // 保存到 state
      this.token = data.token;
      this.userId = data.userId;
      this.username = data.username;
      this.nickname = data.nickname;
      this.roles = data.roles;
      this.permissions = data.permissions;
      this.menus = data.menus;

      console.log('状态更新后 token:', this.token);
      console.log('状态更新后 token 类型:', typeof this.token);
      console.log('状态更新后 isLoggedIn:', this.isLoggedIn);

      // 保存 token 到 localStorage
      console.log('准备保存到 localStorage 的 token:', data.token);
      localStorage.setItem('user_token', data.token);
      console.log('已保存到 localStorage，验证读取:', localStorage.getItem('user_token'));

      // 保存用户信息到 localStorage（不包括 menus）
      const userInfo: StoredUserInfo = {
        userId: data.userId,
        username: data.username,
        nickname: data.nickname,
        roles: data.roles,
        permissions: data.permissions
      };
      console.log('准备保存到 localStorage 的用户信息:', userInfo);
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      console.log('已保存用户信息到 localStorage，验证读取:', localStorage.getItem('user_info'));
      console.log('用户信息已保存到 localStorage');
    },

    /**
     * 从 localStorage 恢复用户信息
     * 恢复 token 和用户信息（userId、username、nickname、roles、permissions）
     * 注意：不恢复 menus，menus 需要重新从后端获取
     * 
     * 需求: 5.3
     */
    restoreUserInfo(): void {
      console.log('开始恢复用户信息...');
      // 恢复 token
      const token = localStorage.getItem('user_token');
      console.log('从 localStorage 读取的 token:', token);
      if (token) {
        this.token = token;
        console.log('token 已恢复到 store');
      }

      // 恢复用户信息
      const userInfoStr = localStorage.getItem('user_info');
      console.log('从 localStorage 读取的用户信息:', userInfoStr);
      if (userInfoStr) {
        try {
          const userInfo: StoredUserInfo = JSON.parse(userInfoStr);
          this.userId = userInfo.userId;
          this.username = userInfo.username;
          this.nickname = userInfo.nickname;
          this.roles = userInfo.roles;
          this.permissions = userInfo.permissions;
          console.log('用户信息已恢复到 store');
          // menus 不从 localStorage 恢复，保持为空数组
        } catch (error) {
          console.error('Failed to parse user info from localStorage:', error);
          // 解析失败时清除无效数据
          this.clearUserInfo();
        }
      }
      console.log('恢复完成，当前登录状态:', this.isLoggedIn);
    },

    /**
     * 清除用户信息
     * 清除 state 和 localStorage 中的所有用户数据
     * 
     * 需求: 5.5
     */
    clearUserInfo(): void {
      // 清除 state
      this.token = null;
      this.userId = null;
      this.username = null;
      this.nickname = null;
      this.roles = [];
      this.permissions = [];
      this.menus = [];

      // 清除 localStorage
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_info');
    },

    /**
     * 用户登录
     * 调用 authApi.login 并保存登录结果
     * 
     * @param credentials - 登录凭证（username 和 password）
     * @throws 登录失败时抛出错误
     * 需求: 3.4
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
      console.log('userStore.login 开始，凭证:', credentials);
      const response = await authLogin(credentials);
      console.log('API 响应原始数据:', response);
      console.log('API 响应类型:', typeof response);
      console.log('API 响应 token:', response.token);
      console.log('API 响应 token 类型:', typeof response.token);
      
      this.setUserInfo(response);
      console.log('userStore.login 完成，当前状态:', {
        token: this.token,
        isLoggedIn: this.isLoggedIn
      });
      
      return response;
    }
  }
});
