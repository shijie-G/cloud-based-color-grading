<template>
  <div class="home-page">
    <div class="home-content">
      <h1>首页</h1>
      <p>欢迎来到云端调色系统</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首页组件 - 暂时为空白页面
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1d24;
}

.home-content {
  text-align: center;
  color: #e2e4e9;
}

.home-content h1 {
  font-size: 32px;
  margin-bottom: 16px;
  font-weight: 600;
}

.home-content p {
  font-size: 16px;
  color: #9ca3af;
}
</style>
