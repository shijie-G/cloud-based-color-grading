import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

// Station 实例路由配置 (hash 模式)
const routes: RouteRecordRaw[] = [
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
    path: '/personalize',
    name: 'Personalize',
    component: () => import('../views/personalize/PersonalizePage.vue'),
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
  },
  {
    path: '/',
    redirect: '/home'
  }
]

// 创建 station 路由实例 - hash 模式，base 为 '/station/'
const stationRouter = createRouter({
  history: createWebHashHistory('/station/'),
  routes
})

export default stationRouter
