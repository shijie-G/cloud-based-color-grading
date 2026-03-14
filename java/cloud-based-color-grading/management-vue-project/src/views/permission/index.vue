<template>
  <div class="permission-management">
    <!-- 页面头部 -->
    <PageHeader title="权限管理" description="管理系统权限及其资源配置">
      <template #actions>
        <el-button type="primary" class="tech-button" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增权限
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索栏 -->
    <SearchBar v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <template #fields="{ formData }">
        <el-form-item label="权限名称">
          <el-input
            v-model="formData.permissionName"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input
            v-model="formData.permissionKey"
            placeholder="请输入权限标识"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select
            v-model="formData.resourceType"
            placeholder="请选择资源类型"
            clearable
            style="width: 150px"
          >
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="API" value="api" />
          </el-select>
        </el-form-item>
      </template>
    </SearchBar>

    <!-- 数据表格 -->
    <div class="table-container tech-card">
      <el-table
        :data="filteredTableData"
        :loading="loading"
        class="tech-table"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="permissionName" label="权限名称" min-width="150" />
        <el-table-column prop="permissionKey" label="权限标识" min-width="180" />
        <el-table-column prop="resourceType" label="资源类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getResourceTypeTagType(row.resourceType)"
              class="tech-tag"
            >
              {{ getResourceTypeLabel(row.resourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourcePath" label="资源路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="method" label="HTTP方法" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.method"
              :type="getMethodTagType(row.method)"
              class="tech-tag"
            >
              {{ row.method }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              class="tech-link-button"
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              class="tech-link-button"
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" />
        </template>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          class="tech-pagination"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 权限表单对话框 -->
    <PermissionForm
      v-model="dialogVisible"
      :mode="dialogMode"
      :permission-data="currentPermission"
      @submit="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import PermissionForm from '@/components/permission/PermissionForm.vue'
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/api/permission'
import type { Permission, PermissionFormData } from '@/types/permission'

// 搜索表单
const searchForm = reactive({
  permissionName: '',
  permissionKey: '',
  resourceType: '' as '' | 'menu' | 'button' | 'api'
})

// 表格数据
const tableData = ref<Permission[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentPermission = ref<Permission | null>(null)

// 过滤后的表格数据（用于搜索和筛选）
const filteredTableData = computed(() => {
  let data = tableData.value

  // 按权限名称搜索
  if (searchForm.permissionName) {
    data = data.filter(item =>
      item.permissionName.toLowerCase().includes(searchForm.permissionName.toLowerCase())
    )
  }

  // 按权限标识搜索
  if (searchForm.permissionKey) {
    data = data.filter(item =>
      item.permissionKey.toLowerCase().includes(searchForm.permissionKey.toLowerCase())
    )
  }

  // 按资源类型筛选
  if (searchForm.resourceType) {
    data = data.filter(item => item.resourceType === searchForm.resourceType)
  }

  // 更新总数
  total.value = data.length

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// 获取资源类型标签类型
const getResourceTypeTagType = (type: string) => {
  const typeMap: Record<string, any> = {
    menu: 'primary',
    button: 'success',
    api: 'warning'
  }
  return typeMap[type] || ''
}

// 获取资源类型标签文本
const getResourceTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: 'API'
  }
  return labelMap[type] || type
}

// 获取HTTP方法标签类型
const getMethodTagType = (method: string) => {
  const methodMap: Record<string, any> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger'
  }
  return methodMap[method] || ''
}

// 加载权限列表
const loadPermissions = async () => {
  loading.value = true
  try {
    const response = await getPermissions()
    tableData.value = response.data || []
    total.value = tableData.value.length
  } catch (error) {
    ElMessage.error('加载权限列表失败')
    console.error(error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchForm.permissionName = ''
  searchForm.permissionKey = ''
  searchForm.resourceType = ''
  currentPage.value = 1
}

// 新增权限
const handleAdd = () => {
  dialogMode.value = 'add'
  currentPermission.value = null
  dialogVisible.value = true
}

// 编辑权限
const handleEdit = (permission: Permission) => {
  dialogMode.value = 'edit'
  currentPermission.value = permission
  dialogVisible.value = true
}

// 保存权限（新增或编辑）
const handleSave = async (formData: PermissionFormData) => {
  try {
    if (dialogMode.value === 'add') {
      // 创建权限
      await createPermission(formData)
      ElMessage.success('权限创建成功')
    } else {
      // 编辑权限
      if (!currentPermission.value?.id) {
        ElMessage.error('权限ID不存在')
        return
      }
      await updatePermission(currentPermission.value.id, formData)
      ElMessage.success('权限更新成功')
    }
    
    // 关闭对话框并刷新列表
    dialogVisible.value = false
    await loadPermissions()
  } catch (error: any) {
    // 处理错误
    const errorMessage = error?.response?.data?.message || error?.message || '操作失败'
    
    // 检查是否是权限标识已存在的错误
    if (errorMessage.includes('已存在') || errorMessage.includes('duplicate')) {
      ElMessage.error('权限标识已存在，请使用其他标识')
    } else {
      ElMessage.error(errorMessage)
    }
    
    console.error('保存权限失败:', error)
  }
}

// 删除权限
const handleDelete = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限"${permission.permissionName}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除 API
    if (!permission.id) {
      ElMessage.error('权限ID不存在')
      return
    }
    
    await deletePermission(permission.id)
    ElMessage.success('删除成功')
    await loadPermissions()
  } catch (error: any) {
    // 检查是否是用户取消操作
    if (error === 'cancel') {
      return
    }
    
    // 处理删除失败的错误
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败'
    ElMessage.error(errorMessage)
    console.error('删除权限失败:', error)
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// 初始化
onMounted(() => {
  loadPermissions()
})
</script>

<style scoped lang="scss">
.permission-management {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  // 科技感背景效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(138, 43, 226, 0.3) 0%, transparent 50%);
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

// 科技感卡片
.tech-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.18);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 
      0 12px 48px rgba(31, 38, 135, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.25),
      0 0 20px rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  }
}

// 科技感表格
.tech-table {
  :deep(.el-table__header) {
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      font-weight: 600;
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  :deep(.el-table__body) {
    tr {
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        transform: scale(1.01);
      }
    }

    td {
      border-color: rgba(102, 126, 234, 0.1);
    }
  }
}

// 科技感标签
.tech-tag {
  font-weight: 600;
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

// 科技感按钮
.tech-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: translateY(0);
  }
}

// 科技感链接按钮
.tech-link-button {
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    text-shadow: 0 0 8px currentColor;
  }
}

// 分页容器
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

// 科技感分页
.tech-pagination {
  :deep(.el-pager) {
    li {
      border-radius: 6px;
      transition: all 0.3s ease;

      &.is-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      }

      &:hover:not(.is-active) {
        background: rgba(102, 126, 234, 0.1);
        transform: scale(1.1);
      }
    }
  }

  :deep(.btn-prev),
  :deep(.btn-next) {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: scale(1.1);
    }
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .permission-management {
    padding: 16px;
  }

  .table-container {
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .permission-management {
    padding: 12px;
  }

  .tech-card {
    padding: 16px;
  }

  .pagination-container {
    justify-content: center;
  }

  :deep(.el-pagination) {
    .el-pagination__sizes,
    .el-pagination__jump {
      display: none;
    }
  }
}
</style>
