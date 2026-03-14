<template>
  <div class="menu-management">
    <!-- 页面头部 -->
    <PageHeader title="菜单管理" description="管理系统菜单及其层级结构">
      <template #actions>
        <el-button type="primary" class="tech-button" @click="handleAddRoot">
          <el-icon><Plus /></el-icon>
          新增顶级菜单
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索栏 -->
    <SearchBar v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <template #fields="{ formData }">
        <el-form-item label="菜单名称">
          <el-input
            v-model="formData.menuName"
            placeholder="请输入菜单名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input
            v-model="formData.menuPath"
            placeholder="请输入路由路径"
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

    <!-- 树形表格 -->
    <div class="table-container tech-card">
      <el-table
        :data="tableData"
        :loading="loading"
        class="tech-table"
        stripe
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        style="width: 100%"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="200">
          <template #default="{ row }">
            <div class="menu-name-cell">
              <el-icon v-if="row.icon" class="menu-icon">
                <component :is="row.icon" />
              </el-icon>
              <span>{{ row.menuName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="menuPath" label="路由路径" min-width="180" />
        <el-table-column prop="component" label="组件路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon" :size="20">
              <component :is="row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序号" width="100" align="center" />
        <el-table-column prop="visible" label="可见性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === 0 ? 'success' : 'info'" class="tech-tag">
              {{ row.visible === 0 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" class="tech-tag">
              {{ row.status === 0 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              link
              size="small"
              class="tech-link-button"
              @click="handleAddChild(row)"
            >
              <el-icon><Plus /></el-icon>
              新增子菜单
            </el-button>
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
              @click="handleAssociatePermissions(row)"
            >
              <el-icon><Key /></el-icon>
              关联权限
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
          <el-empty description="暂无菜单数据" />
        </template>
      </el-table>
    </div>

    <!-- 菜单表单对话框 -->
    <MenuForm
      v-model="dialogVisible"
      :mode="dialogMode"
      :menu-data="currentMenu"
      :parent-id="parentId"
      @submit="handleSave"
    />

    <!-- 权限选择对话框 -->
    <PermissionSelector
      v-model="permissionDialogVisible"
      :selected-ids="selectedPermissionIds"
      title="关联菜单权限"
      @confirm="handlePermissionConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Key } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import MenuForm from '@/components/menu/MenuForm.vue'
import PermissionSelector from '@/components/permission/PermissionSelector.vue'
import { getMenus, createMenu, updateMenu, deleteMenu, getMenuPermissions, associateMenuPermission, disassociateMenuPermission } from '@/api/menu'
import type { Menu, MenuFormData } from '@/types/menu'

// 搜索表单
const searchForm = reactive({
  menuName: '',
  menuPath: '',
  status: undefined as number | undefined
})

// 表格数据
const tableData = ref<Menu[]>([])
const loading = ref(false)

// 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentMenu = ref<Menu | null>(null)
const parentId = ref<number>(0)

// 权限关联对话框状态
const permissionDialogVisible = ref(false)
const selectedPermissionIds = ref<number[]>([])
const currentMenuForPermission = ref<Menu | null>(null)

/**
 * 构建树形结构
 * 将扁平的菜单列表转换为树形结构
 * @param menus 扁平的菜单列表
 * @param parentId 父菜单ID，默认为0（顶级菜单）
 * @returns 树形结构的菜单列表
 */
const buildMenuTree = (menus: Menu[], parentId: number = 0): Menu[] => {
  const tree: Menu[] = []
  
  // 找出所有父菜单为 parentId 的菜单
  const children = menus.filter(menu => menu.parentId === parentId)
  
  // 对每个子菜单递归构建其子树
  for (const child of children) {
    const childWithChildren = {
      ...child,
      children: buildMenuTree(menus, child.id)
    }
    tree.push(childWithChildren)
  }
  
  // 按排序号排序
  return tree.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 加载菜单树
 * 调用 API 获取菜单数据并构建树形结构
 */
const loadMenuTree = async () => {
  loading.value = true
  try {
    const response = await getMenus()
    const menus = response.data || []
    
    // 如果 API 返回的是扁平列表，则构建树形结构
    // 如果 API 已经返回树形结构，则直接使用
    if (menus.length > 0 && menus[0].children === undefined) {
      // 扁平列表，需要构建树形结构
      tableData.value = buildMenuTree(menus)
    } else {
      // 已经是树形结构
      tableData.value = menus
    }
  } catch (error) {
    ElMessage.error('加载菜单列表失败')
    console.error(error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  loadMenuTree()
}

// 重置
const handleReset = () => {
  searchForm.menuName = ''
  searchForm.menuPath = ''
  searchForm.status = undefined
  loadMenuTree()
}

// 新增顶级菜单
const handleAddRoot = () => {
  dialogMode.value = 'add'
  currentMenu.value = null
  parentId.value = 0
  dialogVisible.value = true
}

// 新增子菜单
const handleAddChild = (menu: Menu) => {
  dialogMode.value = 'add'
  currentMenu.value = null
  parentId.value = menu.id
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (menu: Menu) => {
  dialogMode.value = 'edit'
  currentMenu.value = menu
  parentId.value = menu.parentId
  dialogVisible.value = true
}

// 保存菜单（新增或编辑）
const handleSave = async (formData: MenuFormData) => {
  try {
    if (dialogMode.value === 'add') {
      // 创建菜单
      await createMenu(formData)
      ElMessage.success('菜单创建成功')
    } else {
      // 编辑菜单
      if (!currentMenu.value?.id) {
        ElMessage.error('菜单ID不存在')
        return
      }
      await updateMenu(currentMenu.value.id, formData)
      ElMessage.success('菜单更新成功')
    }
    
    // 关闭对话框并刷新列表
    dialogVisible.value = false
    await loadMenuTree()
  } catch (error: any) {
    // 处理错误
    const errorMessage = error?.response?.data?.message || error?.message || '操作失败'
    ElMessage.error(errorMessage)
    console.error('保存菜单失败:', error)
  }
}

// 打开权限关联对话框
const handleAssociatePermissions = async (menu: Menu) => {
  currentMenuForPermission.value = menu
  
  try {
    // 加载该菜单已关联的权限
    const response = await getMenuPermissions(menu.id)
    selectedPermissionIds.value = response.data || []
    permissionDialogVisible.value = true
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '加载权限失败'
    ElMessage.error(errorMessage)
    console.error('加载菜单权限失败:', error)
  }
}

// 确认权限关联
const handlePermissionConfirm = async (newPermissionIds: number[]) => {
  if (!currentMenuForPermission.value?.id) {
    ElMessage.error('菜单ID不存在')
    return
  }

  const menuId = currentMenuForPermission.value.id
  const oldPermissionIds = selectedPermissionIds.value

  try {
    // 找出需要新增的权限（在新列表中但不在旧列表中）
    const toAdd = newPermissionIds.filter(id => !oldPermissionIds.includes(id))
    
    // 找出需要删除的权限（在旧列表中但不在新列表中）
    const toRemove = oldPermissionIds.filter(id => !newPermissionIds.includes(id))

    // 执行新增操作
    for (const permissionId of toAdd) {
      await associateMenuPermission(menuId, permissionId)
    }

    // 执行删除操作
    for (const permissionId of toRemove) {
      await disassociateMenuPermission(menuId, permissionId)
    }

    ElMessage.success('权限关联更新成功')
    permissionDialogVisible.value = false
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '权限关联失败'
    ElMessage.error(errorMessage)
    console.error('权限关联失败:', error)
  }
}

// 删除菜单
const handleDelete = async (menu: Menu) => {
  // 检查是否有子菜单
  if (menu.children && menu.children.length > 0) {
    ElMessage.error('该菜单包含子菜单，请先删除子菜单')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除菜单"${menu.menuName}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除 API
    if (!menu.id) {
      ElMessage.error('菜单ID不存在')
      return
    }
    
    await deleteMenu(menu.id)
    ElMessage.success('删除成功')
    await loadMenuTree()
  } catch (error: any) {
    // 检查是否是用户取消操作
    if (error === 'cancel') {
      return
    }
    
    // 处理删除失败的错误
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败'
    ElMessage.error(errorMessage)
    console.error('删除菜单失败:', error)
  }
}

// 初始化
onMounted(() => {
  loadMenuTree()
})
</script>

<style scoped lang="scss">
.menu-management {
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

  // 树形表格展开图标样式
  :deep(.el-table__expand-icon) {
    color: #667eea;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
      color: #764ba2;
      transform: scale(1.2);
    }
  }
}

// 菜单名称单元格
.menu-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .menu-icon {
    color: #667eea;
    font-size: 18px;
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

// 响应式布局
@media (max-width: 1200px) {
  .menu-management {
    padding: 16px;
  }

  .table-container {
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .menu-management {
    padding: 12px;
  }

  .tech-card {
    padding: 16px;
  }
}
</style>
