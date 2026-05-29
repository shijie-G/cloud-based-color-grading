import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

// Login 实例路由配置 (history 模式)
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginPage.vue'),
    meta: {
      requiresAuth: false
    }
  }
]

// 创建 login 路由实例 - hash 模式，确保 /login.html 能直接承载登录页
const loginRouter = createRouter({
  history: createWebHashHistory('/login.html'),
  routes
})

export default loginRouter
