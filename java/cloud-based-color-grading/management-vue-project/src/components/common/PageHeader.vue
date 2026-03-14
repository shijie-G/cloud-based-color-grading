<template>
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="page-description">{{ description }}</p>
    </div>
    <div class="header-right">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
}

.page-description {
  margin: 8px 0 0;
  font-size: 14px;
  color: #8e8e93;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
