import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '../api/authApi';
import axiosInstance from '../utils/axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

// Mock axios instance
vi.mock('../utils/axios', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should send POST request to /auth/login with correct data', async () => {
      const mockRequest: LoginRequest = {
        username: '13800138000',
        password: 'password123'
      };

      const mockResponse: LoginResponse = {
        token: 'mock-jwt-token',
        userId: 123,  // 修改为 number 类型
        username: '13800138000',
        nickname: 'Test User',
        roles: ['user'],
        permissions: ['read'],
        menus: []
      };

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockResponse });

      const result = await login(mockRequest);

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should return complete login response with all fields', async () => {
      const mockRequest: LoginRequest = {
        username: 'user@example.com',
        password: 'securepass'
      };

      const mockResponse: LoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        userId: 456,  // 修改为 number 类型
        username: 'user@example.com',
        nickname: 'John Doe',
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'delete'],
        menus: [
          { id: '1', name: 'Dashboard', path: '/dashboard' },
          { id: '2', name: 'Settings', path: '/settings' }
        ]
      };

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockResponse });

      const result = await login(mockRequest);

      expect(result.token).toBe(mockResponse.token);
      expect(result.userId).toBe(mockResponse.userId);
      expect(result.username).toBe(mockResponse.username);
      expect(result.nickname).toBe(mockResponse.nickname);
      expect(result.roles).toEqual(mockResponse.roles);
      expect(result.permissions).toEqual(mockResponse.permissions);
      expect(result.menus).toEqual(mockResponse.menus);
    });

    it('should throw error when API request fails', async () => {
      const mockRequest: LoginRequest = {
        username: 'invalid@example.com',
        password: 'wrongpass'
      };

      const mockError = new Error('Network error');
      vi.mocked(axiosInstance.post).mockRejectedValue(mockError);

      await expect(login(mockRequest)).rejects.toThrow('Network error');
    });
  });
});
