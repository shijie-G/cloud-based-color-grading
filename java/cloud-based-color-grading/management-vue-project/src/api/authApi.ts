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
  try {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', data);
    
    // 检查响应格式
    if (response.data.code !== 200) {
      // 创建一个带有响应信息的错误，以便前端能正确处理
      const error = new Error(response.data.message || '登录失败') as any;
      error.response = {
        status: response.data.code === 401 ? 401 : 400,
        data: response.data
      };
      throw error;
    }
    
    return response.data.data;
  } catch (error: any) {
    // 如果是网络错误或其他axios错误，直接抛出
    if (error.response) {
      throw error;
    }
    // 如果是我们自己创建的错误，也直接抛出
    if (error.message) {
      throw error;
    }
    // 其他未知错误
    throw new Error('登录请求失败');
  }
}
