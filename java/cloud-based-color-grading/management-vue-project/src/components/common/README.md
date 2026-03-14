# Common Components

This directory contains reusable common components for the menu-role management system.

## Components

### PageHeader

A page header component that displays the page title, optional description, and action buttons.

**Props:**
- `title` (string, required): The page title
- `description` (string, optional): Optional description text

**Slots:**
- `actions`: Slot for action buttons (e.g., "Add" button)

**Example:**
```vue
<template>
  <PageHeader title="角色管理" description="管理系统角色和权限">
    <template #actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </template>
  </PageHeader>
</template>

<script setup lang="ts">
import { PageHeader } from '@/components/common'
import { Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // Handle add action
}
</script>
```

### SearchBar

A search bar component with customizable search fields and search/reset buttons.

**Props:**
- `modelValue` (Record<string, any>, optional): The form data object

**Emits:**
- `update:modelValue`: Emitted when form data changes
- `search`: Emitted when search button is clicked
- `reset`: Emitted when reset button is clicked

**Slots:**
- `fields`: Slot for search form fields (receives `form-data` as slot prop)

**Example:**
```vue
<template>
  <SearchBar v-model="searchForm" @search="handleSearch" @reset="handleReset">
    <template #fields="{ formData }">
      <el-form-item label="角色名称">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option label="正常" :value="0" />
          <el-option label="禁用" :value="1" />
        </el-select>
      </el-form-item>
    </template>
  </SearchBar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchBar } from '@/components/common'

const searchForm = ref({
  roleName: '',
  status: ''
})

const handleSearch = (data: Record<string, any>) => {
  console.log('Search with:', data)
  // Perform search
}

const handleReset = () => {
  console.log('Reset search')
  // Reset and reload data
}
</script>
```

### EmptyState

An empty state component that displays when there's no data to show.

**Props:**
- `text` (string, optional, default: '暂无数据'): The main empty state text
- `description` (string, optional): Optional description text
- `icon` (Component, optional, default: Document): The icon to display
- `iconSize` (number, optional, default: 80): The size of the icon

**Slots:**
- `actions`: Slot for action buttons (e.g., "Add Data" button)

**Example:**
```vue
<template>
  <EmptyState
    text="暂无角色数据"
    description="请点击新增按钮创建第一个角色"
    :icon="FolderOpened"
  >
    <template #actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </template>
  </EmptyState>
</template>

<script setup lang="ts">
import { EmptyState } from '@/components/common'
import { FolderOpened, Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // Handle add action
}
</script>
```

## Usage

Import components from the common components directory:

```typescript
import { PageHeader, SearchBar, EmptyState } from '@/components/common'
```

Or import individually:

```typescript
import PageHeader from '@/components/common/PageHeader.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
```

## Testing

All components have unit tests located in the `__tests__` directory. Run tests with:

```bash
npm test -- src/components/common/__tests__/
```

## Requirements

These components satisfy the following requirements:
- **Requirement 10.1**: PageHeader provides consistent page layout
- **Requirement 1.1**: SearchBar enables search functionality
- **Requirement 1.3**: EmptyState displays when no data is available
