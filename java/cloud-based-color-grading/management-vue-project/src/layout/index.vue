<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="layout-aside">
        <div class="logo-section">
          <h2>管理系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="layout-menu"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部栏 -->
        <el-header class="layout-header">
          <div class="header-left">
            <h3>{{ currentTitle }}</h3>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                <span>{{ userStore.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Menu, Lock, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 菜单项
const menuItems = computed(() => {
  const items = [
    { path: '/role', title: '角色管理', icon: UserFilled, permission: 'system:role:view' },
    { path: '/menu', title: '菜单管理', icon: Menu, permission: 'system:menu:view' },
    { path: '/permission', title: '权限管理', icon: Lock, permission: 'system:permission:view' }
  ]
  
  // 根据权限过滤菜单
  return items.filter(item => !item.permission || userStore.hasPermission(item.permission))
})

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前页面标题
const currentTitle = computed(() => route.meta.title as string || '')

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      // 用户取消
    }
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.layout-aside {
  background: #001529;
  color: white;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }
}

.layout-menu {
  border-right: none;
  background: #001529;
  
  :deep(.el-menu-item) {
    color: rgba(255, 255, 255, 0.65);
    
    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.08);
    }
    
    &.is-active {
      color: white;
      background: #1890ff;
    }
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1a1a1a;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
}

.layout-main {
  background: #f0f2f5;
  padding: 24px;
}
</style>
