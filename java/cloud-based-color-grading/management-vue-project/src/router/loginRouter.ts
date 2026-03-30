import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// Login 实例路由配置 (history 模式)
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginPage.vue'),
    meta: {
      requiresAuth: false
    }
  }
]

// 创建 login 路由实例 - history 模式
const loginRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default loginRouter
