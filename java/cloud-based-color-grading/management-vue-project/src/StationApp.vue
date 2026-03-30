<script setup lang="ts">
// StationApp.vue - Station 实例的根组件
import GlobalNavbar from './components/GlobalNavbar.vue'
</script>

<template>
  <div class="station-app">
    <!-- 全局导航栏 -->
    <GlobalNavbar />

    <!-- 主内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.station-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin-top: 5vh; /* 导航栏高度 */
  height: calc(100vh - 5vh);
  overflow: hidden;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
