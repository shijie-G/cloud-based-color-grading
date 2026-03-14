import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import type { LoginResponse } from '../types/auth';

// Mock authApi
vi.mock('../api/authApi', () => ({
  login: vi.fn()
}));

describe('userStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have null/empty initial state', () => {
      const store = useUserStore();
      
      expect(store.token).toBeNull();
      expect(store.userId).toBeNull();
      expect(store.username).toBeNull();
      expect(store.nickname).toBeNull();
      expect(store.roles).toEqual([]);
      expect(store.permissions).toEqual([]);
      expect(store.menus).toEqual([]);
    });
  });

  describe('getters', () => {
    it('isLoggedIn should return false when no token', () => {
      const store = useUserStore();
      expect(store.isLoggedIn).toBe(false);
    });

    it('isLoggedIn should return true when token exists', () => {
      const store = useUserStore();
      store.token = 'mock-token';
      expect(store.isLoggedIn).toBe(true);
    });

    it('hasPermission should check if user has specific permission', () => {
      const store = useUserStore();
      store.permissions = ['read', 'write'];
      
      expect(store.hasPermission('read')).toBe(true);
      expect(store.hasPermission('write')).toBe(true);
      expect(store.hasPermission('delete')).toBe(false);
    });

    it('hasRole should check if user has specific role', () => {
      const store = useUserStore();
      store.roles = ['admin', 'user'];
      
      expect(store.hasRole('admin')).toBe(true);
      expect(store.hasRole('user')).toBe(true);
      expect(store.hasRole('guest')).toBe(false);
    });
  });

  describe('setUserInfo', () => {
    it('should save all user data to state', () => {
      const store = useUserStore();
      const mockData: LoginResponse = {
        token: 'test-token',
        userId: 'user-123',
        username: 'test@example.com',
        nickname: 'Test User',
        roles: ['admin'],
        permissions: ['read', 'write'],
        menus: [{ id: '1', name: 'Dashboard', path: '/dashboard' }]
      };

      store.setUserInfo(mockData);

      expect(store.token).toBe(mockData.token);
      expect(store.userId).toBe(mockData.userId);
      expect(store.username).toBe(mockData.username);
      expect(store.nickname).toBe(mockData.nickname);
      expect(store.roles).toEqual(mockData.roles);
      expect(store.permissions).toEqual(mockData.permissions);
      expect(store.menus).toEqual(mockData.menus);
    });

    it('should save token to localStorage', () => {
      const store = useUserStore();
      const mockData: LoginResponse = {
        token: 'test-token',
        userId: 'user-123',
        username: 'test@example.com',
        nickname: 'Test User',
        roles: ['admin'],
        permissions: ['read'],
        menus: []
      };

      store.setUserInfo(mockData);

      expect(localStorage.getItem('user_token')).toBe('test-token');
    });

    it('should save user info to localStorage without menus', () => {
      const store = useUserStore();
      const mockData: LoginResponse = {
        token: 'test-token',
        userId: 'user-123',
        username: 'test@example.com',
        nickname: 'Test User',
        roles: ['admin'],
        permissions: ['read', 'write'],
        menus: [{ id: '1', name: 'Dashboard', path: '/dashboard' }]
      };

      store.setUserInfo(mockData);

      const storedUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      expect(storedUserInfo.userId).toBe('user-123');
      expect(storedUserInfo.username).toBe('test@example.com');
      expect(storedUserInfo.nickname).toBe('Test User');
      expect(storedUserInfo.roles).toEqual(['admin']);
      expect(storedUserInfo.permissions).toEqual(['read', 'write']);
      expect(storedUserInfo.menus).toBeUndefined(); // menus should NOT be in localStorage
    });
  });

  describe('restoreUserInfo', () => {
    it('should restore token from localStorage', () => {
      localStorage.setItem('user_token', 'stored-token');
      
      const store = useUserStore();
      store.restoreUserInfo();

      expect(store.token).toBe('stored-token');
    });

    it('should restore user info from localStorage', () => {
      const storedUserInfo = {
        userId: 'user-456',
        username: 'restored@example.com',
        nickname: 'Restored User',
        roles: ['user'],
        permissions: ['read']
      };
      
      localStorage.setItem('user_token', 'stored-token');
      localStorage.setItem('user_info', JSON.stringify(storedUserInfo));
      
      const store = useUserStore();
      store.restoreUserInfo();

      expect(store.token).toBe('stored-token');
      expect(store.userId).toBe('user-456');
      expect(store.username).toBe('restored@example.com');
      expect(store.nickname).toBe('Restored User');
      expect(store.roles).toEqual(['user']);
      expect(store.permissions).toEqual(['read']);
      expect(store.menus).toEqual([]); // menus should remain empty
    });

    it('should handle missing localStorage data gracefully', () => {
      const store = useUserStore();
      store.restoreUserInfo();

      expect(store.token).toBeNull();
      expect(store.userId).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('user_info', 'invalid-json');
      
      const store = useUserStore();
      store.restoreUserInfo();

      // Should clear invalid data
      expect(store.userId).toBeNull();
      expect(localStorage.getItem('user_token')).toBeNull();
      expect(localStorage.getItem('user_info')).toBeNull();
    });
  });

  describe('clearUserInfo', () => {
    it('should clear all state data', () => {
      const store = useUserStore();
      
      // Set some data first
      store.token = 'test-token';
      store.userId = 'user-123';
      store.username = 'test@example.com';
      store.nickname = 'Test User';
      store.roles = ['admin'];
      store.permissions = ['read'];
      store.menus = [{ id: '1', name: 'Dashboard', path: '/dashboard' }];

      store.clearUserInfo();

      expect(store.token).toBeNull();
      expect(store.userId).toBeNull();
      expect(store.username).toBeNull();
      expect(store.nickname).toBeNull();
      expect(store.roles).toEqual([]);
      expect(store.permissions).toEqual([]);
      expect(store.menus).toEqual([]);
    });

    it('should clear localStorage data', () => {
      localStorage.setItem('user_token', 'test-token');
      localStorage.setItem('user_info', JSON.stringify({ userId: 'user-123' }));
      
      const store = useUserStore();
      store.clearUserInfo();

      expect(localStorage.getItem('user_token')).toBeNull();
      expect(localStorage.getItem('user_info')).toBeNull();
    });
  });

  describe('login action', () => {
    it('should call authApi.login and save response', async () => {
      const { login: authLogin } = await import('../api/authApi');
      
      const mockResponse: LoginResponse = {
        token: 'login-token',
        userId: 'user-789',
        username: 'login@example.com',
        nickname: 'Login User',
        roles: ['user'],
        permissions: ['read'],
        menus: []
      };

      vi.mocked(authLogin).mockResolvedValue(mockResponse);

      const store = useUserStore();
      await store.login({ username: 'login@example.com', password: 'password' });

      expect(authLogin).toHaveBeenCalledWith({
        username: 'login@example.com',
        password: 'password'
      });
      expect(store.token).toBe('login-token');
      expect(store.userId).toBe('user-789');
    });
  });
});
