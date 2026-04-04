<template>
  <div class="filter-panel">
    <div class="panel-section">
      <h3 class="section-title">滤镜效果</h3>
      <p class="section-desc">滤镜功能开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 滤镜面板组件 - 内容暂且为空
</script>

<style scoped>
.filter-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
}

.panel-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin-bottom: 0.5rem;
}

.section-desc {
  font-size: 0.875rem;
  color: #9ca3af;
  line-height: 1.5;
}

/* 滚动条样式 */
.filter-panel::-webkit-scrollbar {
  width: 6px;
}

.filter-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.filter-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.filter-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
