import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import StationApp from './StationApp.vue'
import stationRouter from './router/stationRouter'
import { setupRouterGuards } from './router/guards'
import { useUserStore } from './stores/userStore'

// ============================================
// Station 实例 (hash 模式)
// 访问路径：/station/#/workstation
// 挂载节点：#app-station
// 基础路径：base: '/station/'
// ============================================

const stationApp = createApp(StationApp)
const stationPinia = createPinia()

stationApp.use(stationPinia)
stationApp.use(stationRouter)
stationApp.use(ElementPlus)

// 从 localStorage 恢复用户信息
const userStore = useUserStore()
userStore.restoreUserInfo()
console.log('[Station 实例] 登录状态:', userStore.isLoggedIn)
console.log('[Station 实例] token:', userStore.token)

// 设置路由守卫
setupRouterGuards(stationRouter)

stationApp.mount('#app-station')
console.log('[Station 实例] 已挂载到 #app-station')
