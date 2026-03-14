import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { setupRouterGuards } from './router/guards'
import { useUserStore } from './stores/userStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 从 localStorage 恢复用户信息 (需求 5.3) - 在路由守卫之前
const userStore = useUserStore()
userStore.restoreUserInfo()
console.log('应用初始化时的登录状态:', userStore.isLoggedIn)
console.log('应用初始化时的 token:', userStore.token)

app.use(router)
app.use(ElementPlus)

// 设置路由守卫 (需求 6.1) - 在用户信息恢复之后
setupRouterGuards(router)

app.mount('#app')
