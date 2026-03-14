<template>
  <div class="search-bar">
    <el-form :inline="true" :model="formData" class="search-form">
      <slot name="fields" :form-data="formData"></slot>
      
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'

interface Props {
  modelValue?: Record<string, any>
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'search', value: Record<string, any>): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = reactive(props.modelValue || {})

const handleSearch = () => {
  emit('update:modelValue', formData)
  emit('search', formData)
}

const handleReset = () => {
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  emit('update:modelValue', formData)
  emit('reset')
}
</script>

<style scoped lang="scss">
.search-bar {
  margin-bottom: 16px;
  padding: 20px 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-form {
  margin: 0;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

@media (max-width: 768px) {
  .search-bar {
    padding: 16px;
  }

  .search-form {
    :deep(.el-form-item) {
      width: 100%;
      margin-right: 0 !important;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>
