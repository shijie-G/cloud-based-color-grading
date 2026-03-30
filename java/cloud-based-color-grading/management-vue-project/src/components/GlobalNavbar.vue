<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 导航菜单项
const navItems = [
  { name: '工作站', path: '/workstation' },
  { name: '图库', path: '/gallery' }
]

// 判断当前激活的菜单
const isActive = (path: string) => {
  return route.path === path
}

// 导航跳转
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <nav class="global-navbar">
    <div class="navbar-container">
      <!-- Logo 区域 -->
      <div class="navbar-logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="logo-text">调色管理系统</span>
      </div>

      <!-- 导航菜单 -->
      <div class="navbar-menu">
        <div
          v-for="item in navItems"
          :key="item.path"
          :class="['menu-item', { active: isActive(item.path) }]"
          @click="navigateTo(item.path)"
        >
          <!-- 工作站图标 -->
          <svg v-if="item.path === '/workstation'" class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- 图库图标 -->
          <svg v-else-if="item.path === '/gallery'" class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 16l5-5 4 4 5-5 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          </svg>
          <span class="menu-text">{{ item.name }}</span>
        </div>
      </div>

      <!-- 右侧用户区域 -->
      <div class="navbar-user">
        <div class="user-avatar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.global-navbar {
  height: 5vh;
  width: 100%;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.navbar-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  max-width: 100%;
}

/* Logo 区域 */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.navbar-logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 20px;
  height: 20px;
  color: #5b6af0;
  flex-shrink: 0;
}

.logo-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e4e9;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* 导航菜单 */
.navbar-menu {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  justify-content: center;
  align-items: center;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #9ca3af;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e4e9;
}

.menu-item.active {
  background: rgba(91, 106, 240, 0.12);
  color: #5b6af0;
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.menu-text {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

/* 用户区域 */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.user-avatar svg {
  width: 18px;
  height: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }

  .logo-text {
    display: none;
  }

  .menu-text {
    font-size: 0.85rem;
  }

  .menu-item {
    padding: 0.4rem 1rem;
  }
}
</style>
