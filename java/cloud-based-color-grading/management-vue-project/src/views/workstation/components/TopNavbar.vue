<template>
  <div class="top-navbar">
    <!-- 顶部导航栏 - 从 WorkstationPage.vue 提取 -->
  </div>
</template>

<script setup lang="ts">
// TopNavbar 组件 - 顶部导航栏
// 从 WorkstationPage.vue 中提取的导航栏功能

// Props 接口 - 目前导航栏不需要外部数据
interface TopNavbarProps {
  // 导航栏相关的 props - 当前为空，保持简洁
}

// 事件定义 - 目前导航栏不需要向父组件发送事件
interface TopNavbarEvents {
  // 导航栏相关的事件 - 当前为空，保持简洁
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<TopNavbarProps>()
const emit = defineEmits<TopNavbarEvents>()
</script>

<style scoped>
/* 顶部导航栏样式 - 从 WorkstationPage.vue 提取 */
.top-navbar {
  width: 100%;
  height: 5vh;
  background-color: #666;
  flex-shrink: 0;
}
</style>