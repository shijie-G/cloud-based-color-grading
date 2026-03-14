<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-description">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goBack">返回上一页</el-button>
      <el-button @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.error-content {
  text-align: center;
}

.error-code {
  margin: 0;
  font-size: 120px;
  font-weight: 700;
  color: #faad14;
  line-height: 1;
}

.error-title {
  margin: 24px 0 16px;
  font-size: 32px;
  font-weight: 600;
  color: #1a1a1a;
}

.error-description {
  margin: 0 0 32px;
  font-size: 16px;
  color: #8e8e93;
}

.el-button {
  margin: 0 8px;
}
</style>
