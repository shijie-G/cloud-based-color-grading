import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useUserStore } from '../stores/userStore';
import router from '../router';

/**
 * 创建 Axios 实例
 * 配置 baseURL 和 timeout
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',  // 使用网关端口
  timeout: 10000,
  withCredentials: true,  // 支持CORS凭证
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 请求拦截器
 * 自动添加 Authorization 和 X-User-Id 请求头
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    
    // 添加 Authorization header
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    
    // 添加 X-User-Id header
    if (userStore.userId) {
      config.headers['X-User-Id'] = userStore.userId;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 处理 401 错误：清除 token 并重定向到登录页
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 错误处理：清除 token 并重定向到登录页
    if (error.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserInfo();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
