<template>
  <div class="role-management">
    <!-- 页面头部 -->
    <PageHeader title="角色管理" description="管理系统角色及其权限配置">
      <template #actions>
        <el-button type="primary" class="tech-button" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索栏 -->
    <SearchBar v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <template #fields="{ formData }">
        <el-form-item label="角色名称">
          <el-input
            v-model="formData.roleName"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="角色标识">
          <el-input
            v-model="formData.roleKey"
            placeholder="请输入角色标识"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="formData.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
      </template>
    </SearchBar>

    <!-- 数据表格 -->
    <div class="table-container tech-card">
      <el-table
        :data="tableData"
        :loading="loading"
        class="tech-table"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column prop="roleKey" label="角色标识" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" class="tech-tag">
              {{ row.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
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
              type="warning"
              link
              size="small"
              class="tech-link-button"
              @click="handleAssignPermissions(row)"
            >
              <el-icon><Setting /></el-icon>
              分配权限
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

    <!-- 角色表单对话框 -->
    <RoleForm
      v-model="dialogVisible"
      :mode="dialogMode"
      :role-data="currentRole"
      @submit="handleSave"
    />

    <!-- 权限分配对话框 -->
    <PermissionSelector
      v-model="permissionDialogVisible"
      :selected-ids="selectedPermissionIds"
      :title="`为角色「${currentAssignRole?.roleName || ''}」分配权限`"
      @confirm="handleConfirmPermissions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Setting } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import RoleForm from '@/components/role/RoleForm.vue'
import PermissionSelector from '@/components/permission/PermissionSelector.vue'
import { getRoles, createRole, updateRole, deleteRole, getRolePermissions, assignPermissionsToRole } from '@/api/role'
import type { Role, RoleFormData } from '@/types/role'

// 搜索表单
const searchForm = reactive({
  roleName: '',
  roleKey: '',
  status: undefined as number | undefined
})

// 表格数据
const tableData = ref<Role[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentRole = ref<Role | null>(null)

// 权限分配对话框状态
const permissionDialogVisible = ref(false)
const selectedPermissionIds = ref<number[]>([])
const currentAssignRole = ref<Role | null>(null)

// 加载角色列表
const loadRoles = async () => {
  loading.value = true
  try {
    const response = await getRoles()
    tableData.value = response.data || []
    total.value = tableData.value.length
  } catch (error) {
    ElMessage.error('加载角色列表失败')
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
  loadRoles()
}

// 重置
const handleReset = () => {
  searchForm.roleName = ''
  searchForm.roleKey = ''
  searchForm.status = undefined
  currentPage.value = 1
  loadRoles()
}

// 新增角色
const handleAdd = () => {
  dialogMode.value = 'add'
  currentRole.value = null
  dialogVisible.value = true
}

// 编辑角色
const handleEdit = (role: Role) => {
  dialogMode.value = 'edit'
  currentRole.value = role
  dialogVisible.value = true
}

// 保存角色（新增或编辑）
const handleSave = async (formData: RoleFormData) => {
  try {
    if (dialogMode.value === 'add') {
      // 创建角色
      await createRole(formData)
      ElMessage.success('角色创建成功')
    } else {
      // 编辑角色
      if (!currentRole.value?.id) {
        ElMessage.error('角色ID不存在')
        return
      }
      await updateRole(currentRole.value.id, formData)
      ElMessage.success('角色更新成功')
    }
    
    // 关闭对话框并刷新列表
    dialogVisible.value = false
    await loadRoles()
  } catch (error: any) {
    // 处理错误
    const errorMessage = error?.response?.data?.message || error?.message || '操作失败'
    
    // 检查是否是角色标识已存在的错误
    if (errorMessage.includes('已存在') || errorMessage.includes('duplicate')) {
      ElMessage.error('角色标识已存在，请使用其他标识')
    } else {
      ElMessage.error(errorMessage)
    }
    
    console.error('保存角色失败:', error)
  }
}

// 删除角色
const handleDelete = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色"${role.roleName}"吗？删除后将解除所有用户与该角色的关联。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除 API
    if (!role.id) {
      ElMessage.error('角色ID不存在')
      return
    }
    
    await deleteRole(role.id)
    ElMessage.success('删除成功')
    await loadRoles()
  } catch (error: any) {
    // 检查是否是用户取消操作
    if (error === 'cancel') {
      return
    }
    
    // 处理删除失败的错误
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败'
    ElMessage.error(errorMessage)
    console.error('删除角色失败:', error)
  }
}

// 分配权限
const handleAssignPermissions = async (role: Role) => {
  try {
    currentAssignRole.value = role
    
    // 加载该角色已有的权限
    const response = await getRolePermissions(role.id)
    selectedPermissionIds.value = response.data || []
    
    // 打开权限选择对话框
    permissionDialogVisible.value = true
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '加载角色权限失败'
    ElMessage.error(errorMessage)
    console.error('加载角色权限失败:', error)
  }
}

// 确认分配权限
const handleConfirmPermissions = async (permissionIds: number[]) => {
  if (!currentAssignRole.value?.id) {
    ElMessage.error('角色ID不存在')
    return
  }

  try {
    // 调用 API 分配权限
    await assignPermissionsToRole(currentAssignRole.value.id, permissionIds)
    ElMessage.success('权限分配成功')
    
    // 关闭对话框
    permissionDialogVisible.value = false
    
    // 可选：刷新角色列表
    // await loadRoles()
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '权限分配失败'
    ElMessage.error(errorMessage)
    console.error('权限分配失败:', error)
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadRoles()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadRoles()
}

// 初始化
onMounted(() => {
  loadRoles()
})
</script>

<style scoped lang="scss">
.role-management {
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
  .role-management {
    padding: 16px;
  }

  .table-container {
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .role-management {
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
