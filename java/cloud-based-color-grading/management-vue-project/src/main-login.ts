import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import LoginApp from './LoginApp.vue'
import loginRouter from './router/loginRouter'
import { setupRouterGuards } from './router/guards'
import { useUserStore } from './stores/userStore'

// ============================================
// Login 实例 (history 模式)
// 访问路径：/login
// 挂载节点：#app-login
// ============================================

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
