/**
 * 路由守卫单元测试
 * 测试登录状态检查和权限检查
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory, RouteRecordRaw } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}))

// 创建测试路由
const createTestRouter = () => {
  const routes: RouteRecordRaw[] = [
    {
      path: '/login',
      name: 'Login',
      component: { template: '<div>Login</div>' },
      meta: { title: '登录', requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/role',
      component: { template: '<div>Layout</div>' },
      meta: { requiresAuth: true },
      children: [
        {
          path: 'role',
          name: 'RoleManagement',
          component: { template: '<div>Role</div>' },
          meta: { 
            title: '角色管理',
            permission: 'system:role:view'
          }
        },
        {
          path: 'menu',
          name: 'MenuManagement',
          component: { template: '<div>Menu</div>' },
          meta: { 
            title: '菜单管理',
            permission: 'system:menu:view'
          }
        }
      ]
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: { template: '<div>403</div>' },
      meta: { title: '无权限' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: { template: '<div>404</div>' },
      meta: { title: '404' }
    }
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })

  // 添加路由守卫
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    
    // 设置页面标题
    document.title = `${to.meta.title || ''} - 管理系统`
    
    // 检查是否需要登录
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    
    // 检查权限
    if (to.meta.permission && !userStore.hasPermission(to.meta.permission as string)) {
      ElMessage.error('无权限访问该页面')
      next({ path: '/403' })
      return
    }
    
    next()
  })

  return router
}

describe('Router Guards', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    
    // 清除 mock 调用记录
    vi.clearAllMocks()
    
    // 清除 localStorage 中的 token
    localStorage.clear()
  })

  describe('Authentication Guard', () => {
    it('should redirect to login when accessing protected route without authentication', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 确保用户未登录
      expect(userStore.isLoggedIn).toBe(false)
      
      // 尝试访问需要认证的页面
      await router.push('/role')
      
      // 应该被重定向到登录页
      expect(router.currentRoute.value.path).toBe('/login')
      expect(router.currentRoute.value.query.redirect).toBe('/role')
      
      // 应该显示警告消息
      expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
    })

    it('should allow access to protected route when authenticated', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 模拟用户登录
      await userStore.login({ username: 'admin', password: 'admin123' })
      
      // 确保用户已登录
      expect(userStore.isLoggedIn).toBe(true)
      
      // 访问需要认证的页面
      await router.push('/role')
      
      // 应该成功访问
      expect(router.currentRoute.value.path).toBe('/role')
      
      // 不应该显示警告消息
      expect(ElMessage.warning).not.toHaveBeenCalled()
    })

    it('should allow access to public routes without authentication', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 确保用户未登录
      expect(userStore.isLoggedIn).toBe(false)
      
      // 访问公共页面（登录页）
      await router.push('/login')
      
      // 应该成功访问
      expect(router.currentRoute.value.path).toBe('/login')
      
      // 不应该显示警告消息
      expect(ElMessage.warning).not.toHaveBeenCalled()
    })
  })

  describe('Permission Guard', () => {
    it('should redirect to 403 when accessing route without required permission', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 模拟用户登录但没有特定权限
      await userStore.login({ username: 'user', password: 'user123' })
      
      // 清除默认权限，模拟无权限用户
      userStore.permissions = []
      
      // 尝试访问需要权限的页面
      await router.push('/role')
      
      // 应该被重定向到 403 页面
      expect(router.currentRoute.value.path).toBe('/403')
      
      // 应该显示错误消息
      expect(ElMessage.error).toHaveBeenCalledWith('无权限访问该页面')
    })

    it('should allow access to route when user has required permission', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 模拟用户登录并有相应权限
      await userStore.login({ username: 'admin', password: 'admin123' })
      
      // 确保用户有权限
      expect(userStore.hasPermission('system:role:view')).toBe(true)
      
      // 访问需要权限的页面
      await router.push('/role')
      
      // 应该成功访问
      expect(router.currentRoute.value.path).toBe('/role')
      
      // 不应该显示错误消息
      expect(ElMessage.error).not.toHaveBeenCalled()
    })

    it('should check different permissions for different routes', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 模拟用户登录但只有角色管理权限
      await userStore.login({ username: 'admin', password: 'admin123' })
      userStore.permissions = ['system:role:view']
      
      // 访问有权限的页面
      await router.push('/role')
      expect(router.currentRoute.value.path).toBe('/role')
      
      // 尝试访问无权限的页面
      await router.push('/menu')
      
      // 应该被重定向到 403 页面
      expect(router.currentRoute.value.path).toBe('/403')
      expect(ElMessage.error).toHaveBeenCalledWith('无权限访问该页面')
    })
  })

  describe('Page Title', () => {
    it('should set page title when navigating', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 模拟用户登录
      await userStore.login({ username: 'admin', password: 'admin123' })
      
      // 访问角色管理页面
      await router.push('/role')
      
      // 检查页面标题
      expect(document.title).toBe('角色管理 - 管理系统')
    })

    it('should set page title for login page', async () => {
      const router = createTestRouter()
      
      // 访问登录页面
      await router.push('/login')
      
      // 检查页面标题
      expect(document.title).toBe('登录 - 管理系统')
    })
  })

  describe('Combined Guards', () => {
    it('should check authentication before permission', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 确保用户未登录
      expect(userStore.isLoggedIn).toBe(false)
      
      // 尝试访问需要认证和权限的页面
      await router.push('/role')
      
      // 应该先被重定向到登录页（认证检查优先）
      expect(router.currentRoute.value.path).toBe('/login')
      expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
      
      // 不应该检查权限（因为已经在认证检查失败）
      expect(ElMessage.error).not.toHaveBeenCalled()
    })

    it('should preserve redirect query parameter', async () => {
      const router = createTestRouter()
      const userStore = useUserStore()
      
      // 确保用户未登录
      expect(userStore.isLoggedIn).toBe(false)
      
      // 尝试访问需要认证的页面
      await router.push('/role')
      
      // 检查重定向参数
      expect(router.currentRoute.value.query.redirect).toBe('/role')
      
      // 模拟用户登录
      await userStore.login({ username: 'admin', password: 'admin123' })
      
      // 从登录页重定向回原页面
      const redirect = router.currentRoute.value.query.redirect as string
      await router.push(redirect)
      
      // 应该成功访问原页面
      expect(router.currentRoute.value.path).toBe('/role')
    })
  })
})
