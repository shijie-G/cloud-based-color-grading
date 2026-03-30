import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import LoginApp from './LoginApp.vue'
import StationApp from './StationApp.vue'
import loginRouter from './router/loginRouter'
import stationRouter from './router/stationRouter'
import { setupRouterGuards } from './router/guards'
import { useUserStore } from './stores/userStore'

// ============================================
// 根据当前路径判断应该挂载哪个实例
// ============================================
const currentPath = window.location.pathname

// ============================================
// 第一个实例：Login 实例 (history 模式)
// 访问路径：/login
// 挂载节点：#app-login
// ============================================
if (currentPath === '/login') {
  const loginApp = createApp(LoginApp)
  const loginPinia = createPinia()

  loginApp.use(loginPinia)
  loginApp.use(loginRouter)
  loginApp.use(ElementPlus)

  // 从 localStorage 恢复用户信息
  const userStore = useUserStore()
  userStore.restoreUserInfo()
  console.log('[Login 实例] 登录状态:', userStore.isLoggedIn)
  console.log('[Login 实例] token:', userStore.token)

  // 设置路由守卫
  setupRouterGuards(loginRouter)

  loginApp.mount('#app-login')
  console.log('[Login 实例] 已挂载到 #app-login')
}

// ============================================
// 第二个实例：Station 实例 (hash 模式)
// 访问路径：/station/#/workstation
// 挂载节点：#app-station
// 基础路径：base: '/station/'
// ============================================
else if (currentPath.startsWith('/station')) {
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
}

// ============================================
// 默认情况：重定向到 login
// ============================================
else {
  console.log('[路由判断] 未匹配到任何实例，重定向到 /login')
  window.location.href = '/login'
}
