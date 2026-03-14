/**
 * HTTP 请求封装
 * 基于 Axios 实现请求拦截、响应拦截、错误处理等功能
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import type { ApiResponse } from '@/types'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    
    // 检查是否有新 Token（自动刷新）
    const newToken = response.headers['authorization']
    if (newToken) {
      // Token 刷新逻辑可以在这里处理
      // 例如：setToken(newToken.replace('Bearer ', ''))
    }
    
    // 业务错误处理
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res as any
  },
  (error) => {
    console.error('Response error:', error)
    
    // 401 未授权
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      removeToken()
      // 跳转到登录页
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 403 无权限
    if (error.response?.status === 403) {
      ElMessage.error('无权限访问该资源')
      return Promise.reject(error)
    }
    
    // 其他错误
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
