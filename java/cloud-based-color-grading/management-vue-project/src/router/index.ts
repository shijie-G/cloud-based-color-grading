import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginPage.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Home',
    redirect: () => {
      // 动态重定向：根据登录状态决定跳转目标
      const userStore = useUserStore();
      return userStore.isLoggedIn ? '/workstation' : '/login';
    }
  },
  {
    path: '/workstation',
    name: 'Workstation',
    component: () => import('../views/WorkstationPage.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
