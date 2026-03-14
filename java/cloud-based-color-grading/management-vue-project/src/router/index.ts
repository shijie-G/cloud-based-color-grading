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
          permission: 'system:role:query'
        }
      },
      {
        path: 'menu',
        name: 'MenuManagement',
        component: () => import('@/views/menu/MenuManagement.vue'),
        meta: { 
          title: '菜单管理', 
          icon: 'menu',
          permission: 'system:menu:query'
        }
      },
      {
        path: 'permission',
        name: 'PermissionManagement',
        component: () => import('@/views/permission/index.vue'),
        meta: { 
          title: '权限管理', 
          icon: 'lock',
          permission: 'system:permission:query'
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
  
  console.log('=== 路由守卫调试 ===')
  console.log('目标路由:', to.path)
  console.log('是否登录:', userStore.isLoggedIn)
  console.log('权限列表:', userStore.permissions)
  console.log('权限列表长度:', userStore.permissions.length)
  console.log('所需权限:', to.meta.permission)
  
  // 设置页面标题
  document.title = `${to.meta.title || ''} - 管理系统`
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    console.log('❌ 未登录，跳转到登录页')
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查权限
  if (to.meta.permission) {
    const hasPermissionFn = userStore.hasPermission
    console.log('需要权限检查，权限列表长度:', userStore.permissions.length)
    
    // 如果用户有权限列表但没有该权限，则拒绝访问
    // 如果用户权限列表为空（后端未实现），则暂时允许访问
    if (userStore.permissions.length > 0 && !hasPermissionFn(to.meta.permission as string)) {
      console.log('❌ 权限列表不为空但缺少所需权限，跳转到403')
      ElMessage.error('无权限访问该页面')
      next({ path: '/403' })
      return
    } else if (userStore.permissions.length === 0) {
      console.log('⚠️ 权限列表为空，允许访问（开发模式）')
    } else {
      console.log('✅ 有所需权限')
    }
  }
  
  console.log('✅ 通过路由守卫，继续导航')
  next()
})

export default router
