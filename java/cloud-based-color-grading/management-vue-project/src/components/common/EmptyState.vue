<template>
  <div class="empty-state">
    <div class="empty-icon">
      <el-icon :size="iconSize">
        <component :is="icon" />
      </el-icon>
    </div>
    <p class="empty-text">{{ text }}</p>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import type { Component } from 'vue'

interface Props {
  text?: string
  description?: string
  icon?: Component
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  description: '',
  icon: Document,
  iconSize: 80
})
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  color: #c7c7cc;
  opacity: 0.6;
}

.empty-text {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #4a4a4a;
  line-height: 1.5;
}

.empty-description {
  margin: 0 0 24px;
  font-size: 14px;
  color: #8e8e93;
  line-height: 1.5;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .empty-state {
    padding: 40px 20px;
  }

  .empty-icon {
    :deep(.el-icon) {
      font-size: 60px !important;
    }
  }

  .empty-text {
    font-size: 15px;
  }

  .empty-description {
    font-size: 13px;
  }
}
</style>
