import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/role',
    component: () => import('@/layout/index.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'role',
        name: 'RoleManagement',
        component: () => import('@/views/role/index.vue'),
        meta: { 
          title: '角色管理', 
          icon: 'user',
          permission: 'system:role:view'
        }
      },
      {
        path: 'menu',
        name: 'MenuManagement',
        component: () => import('@/views/menu/MenuManagement.vue'),
        meta: { 
          title: '菜单管理', 
          icon: 'menu',
          permission: 'system:menu:view'
        }
      },
      {
        path: 'permission',
        name: 'PermissionManagement',
        component: () => import('@/views/permission/index.vue'),
        meta: { 
          title: '权限管理', 
          icon: 'lock',
          permission: 'system:permission:view'
        }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
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

export default router
