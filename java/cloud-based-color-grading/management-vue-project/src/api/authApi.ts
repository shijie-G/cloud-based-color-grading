import axiosInstance from '../utils/axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

/**
 * 后端统一响应格式
 */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 用户登录 API
 * 向后端认证服务发送登录请求
 * 
 * @param data - 登录请求参数（username 和 password）
 * @returns Promise<LoginResponse> - 登录响应数据
 * 
 * 需求: 3.1, 3.2
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', data);
  
  // 检查响应格式
  if (response.data.code !== 200) {
    throw new Error(response.data.message || '登录失败');
  }
  
  return response.data.data;
}
