<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="permission-selector">
      <!-- Search and Filter Bar -->
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索权限名称或标识..."
          clearable
          prefix-icon="Search"
          style="width: 300px"
          @input="handleSearch"
        />
        
        <el-select
          v-model="filterType"
          placeholder="按资源类型筛选"
          clearable
          style="width: 200px; margin-left: 12px"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="菜单权限" value="menu" />
          <el-option label="按钮权限" value="button" />
          <el-option label="API权限" value="api" />
        </el-select>

        <div class="selected-count">
          已选择 <span class="count">{{ selectedPermissions.length }}</span> 项
        </div>
      </div>

      <!-- Permission Table -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="filteredPermissions"
        :height="400"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          :reserve-selection="true"
        />
        
        <el-table-column
          prop="permissionName"
          label="权限名称"
          min-width="150"
        />
        
        <el-table-column
          prop="permissionKey"
          label="权限标识"
          min-width="180"
        >
          <template #default="{ row }">
            <code class="permission-key">{{ row.permissionKey }}</code>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="resourceType"
          label="资源类型"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="getResourceTypeTag(row.resourceType)"
              size="small"
            >
              {{ getResourceTypeLabel(row.resourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="resourcePath"
          label="资源路径"
          min-width="150"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="method"
          label="HTTP方法"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.method"
              :type="getMethodTag(row.method)"
              size="small"
            >
              {{ row.method }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="description"
          label="描述"
          min-width="150"
          show-overflow-tooltip
        />
      </el-table>

      <!-- Selected Permissions Summary -->
      <div v-if="selectedPermissions.length > 0" class="selected-summary">
        <div class="summary-title">已选权限：</div>
        <div class="selected-tags">
          <el-tag
            v-for="permission in selectedPermissions"
            :key="permission.id"
            closable
            @close="removePermission(permission)"
          >
            {{ permission.permissionName }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
        >
          确定（{{ selectedPermissions.length }}）
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { ElTable } from 'element-plus'
import type { Permission } from '@/types'
import { getPermissions } from '@/api/permission'

// Props
interface Props {
  modelValue: boolean
  selectedIds: number[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  selectedIds: () => [],
  title: '选择权限'
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', ids: number[]): void
}

const emit = defineEmits<Emits>()

// Refs
const tableRef = ref<InstanceType<typeof ElTable>>()
const loading = ref(false)
const searchKeyword = ref('')
const filterType = ref<string>('')
const permissions = ref<Permission[]>([])
const selectedPermissions = ref<Permission[]>([])

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredPermissions = computed(() => {
  let result = permissions.value

  // Filter by type
  if (filterType.value) {
    result = result.filter(p => p.resourceType === filterType.value)
  }

  // Filter by search keyword
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.permissionName.toLowerCase().includes(keyword) ||
      p.permissionKey.toLowerCase().includes(keyword)
    )
  }

  return result
})

// Watch for dialog visibility
watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await loadPermissions()
      await nextTick()
      restoreSelection()
    }
  }
)

// Watch for selectedIds changes
watch(
  () => props.selectedIds,
  () => {
    if (props.modelValue) {
      restoreSelection()
    }
  }
)

// Methods
const loadPermissions = async () => {
  try {
    loading.value = true
    const response = await getPermissions()
    permissions.value = response.data
  } catch (error) {
    console.error('Failed to load permissions:', error)
    permissions.value = []
  } finally {
    loading.value = false
  }
}

const restoreSelection = () => {
  if (!tableRef.value) return

  // Clear all selections first
  tableRef.value.clearSelection()

  // Restore selections based on selectedIds
  const selectedPerms: Permission[] = []
  permissions.value.forEach(permission => {
    if (props.selectedIds.includes(permission.id)) {
      tableRef.value?.toggleRowSelection(permission, true)
      selectedPerms.push(permission)
    }
  })
  
  selectedPermissions.value = selectedPerms
}

const handleSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection
}

const handleSearch = () => {
  // Search is handled by computed property
}

const handleFilterChange = () => {
  // Filter is handled by computed property
}

const removePermission = (permission: Permission) => {
  if (tableRef.value) {
    tableRef.value.toggleRowSelection(permission, false)
  }
}

const handleConfirm = () => {
  const ids = selectedPermissions.value.map(p => p.id)
  emit('confirm', ids)
  dialogVisible.value = false
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClose = () => {
  // Reset filters
  searchKeyword.value = ''
  filterType.value = ''
}

const getResourceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: 'API'
  }
  return labels[type] || type
}

const getResourceTypeTag = (type: string): string => {
  const tags: Record<string, string> = {
    menu: 'primary',
    button: 'success',
    api: 'warning'
  }
  return tags[type] || ''
}

const getMethodTag = (method: string): string => {
  const tags: Record<string, string> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger'
  }
  return tags[method] || ''
}

// Expose methods for parent component
defineExpose({
  loadPermissions
})
</script>

<style scoped lang="scss">
.permission-selector {
  .toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .selected-count {
      margin-left: auto;
      font-size: 14px;
      color: #606266;

      .count {
        font-weight: 600;
        color: #409eff;
      }
    }
  }

  .permission-key {
    padding: 2px 6px;
    background-color: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #606266;
  }

  .selected-summary {
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;

    .summary-title {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
