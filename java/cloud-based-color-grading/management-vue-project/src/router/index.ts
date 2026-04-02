import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

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
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/home/Home.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/workstation',
    name: 'Workstation',
    component: () => import('../views/workstation/WorkstationPage.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/gallery/GalleryPage.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/album/:id',
    name: 'AlbumDetail',
    component: () => import('../views/album/AlbumDetailPage.vue'),
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
