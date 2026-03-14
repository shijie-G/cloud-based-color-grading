<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'add' ? (parentId === 0 ? '新增顶级菜单' : '新增子菜单') : '编辑菜单'"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="父菜单" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="menuTreeOptions"
          :props="treeProps"
          placeholder="请选择父菜单（不选则为顶级菜单）"
          clearable
          check-strictly
          :render-after-expand="false"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="菜单名称" prop="menuName">
        <el-input
          v-model="formData.menuName"
          placeholder="请输入菜单名称"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="路由路径" prop="menuPath">
        <el-input
          v-model="formData.menuPath"
          placeholder="请输入路由路径，格式：/path"
          clearable
          maxlength="100"
        />
        <template #extra>
          <span class="form-tip">格式为 /path，小写字母、数字、斜杠和连字符</span>
        </template>
      </el-form-item>

      <el-form-item label="组件路径" prop="component">
        <el-input
          v-model="formData.component"
          placeholder="请输入组件路径，如：views/user/index"
          clearable
          maxlength="200"
        />
      </el-form-item>

      <el-form-item label="菜单图标" prop="icon">
        <el-input
          v-model="formData.icon"
          placeholder="请选择或输入图标名称"
          clearable
        >
          <template #append>
            <el-button @click="showIconSelector = true">
              <el-icon><Search /></el-icon>
              选择图标
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="排序号" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="0"
          :max="9999"
          controls-position="right"
          style="width: 100%"
        />
        <template #extra>
          <span class="form-tip">数字越小越靠前</span>
        </template>
      </el-form-item>

      <el-form-item label="是否可见" prop="visible">
        <el-radio-group v-model="formData.visible">
          <el-radio :label="0">显示</el-radio>
          <el-radio :label="1">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="0">正常</el-radio>
          <el-radio :label="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </div>
    </template>

    <!-- Icon Selector Dialog -->
    <el-dialog
      v-model="showIconSelector"
      title="选择图标"
      width="800px"
      append-to-body
    >
      <div class="icon-selector">
        <el-input
          v-model="iconSearchKeyword"
          placeholder="搜索图标..."
          clearable
          prefix-icon="Search"
          style="margin-bottom: 16px"
        />
        <div class="icon-list">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            class="icon-item"
            :class="{ active: formData.icon === icon }"
            @click="selectIcon(icon)"
          >
            <el-icon :size="24">
              <component :is="icon" />
            </el-icon>
            <span class="icon-name">{{ icon }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showIconSelector = false">取消</el-button>
        <el-button type="primary" @click="confirmIconSelection">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { Menu, MenuFormData } from '@/types'

// Props
interface Props {
  modelValue: boolean
  menuData?: Menu | null
  parentId?: number
  mode: 'add' | 'edit'
  menuTree?: Menu[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  menuData: null,
  parentId: 0,
  mode: 'add',
  menuTree: () => []
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: MenuFormData): void
}

const emit = defineEmits<Emits>()

// Refs
const formRef = ref<FormInstance>()
const loading = ref(false)
const showIconSelector = ref(false)
const iconSearchKeyword = ref('')

// Available icons (Element Plus icons)
const availableIcons = [
  'Menu', 'Setting', 'User', 'Lock', 'Document', 'Folder', 'Files',
  'Grid', 'List', 'Calendar', 'Message', 'Bell', 'Star', 'Search',
  'Plus', 'Edit', 'Delete', 'View', 'Hide', 'Upload', 'Download',
  'Share', 'Link', 'Picture', 'VideoCamera', 'Headset', 'Phone',
  'Location', 'Timer', 'Warning', 'InfoFilled', 'SuccessFilled',
  'CircleCheck', 'CircleClose', 'QuestionFilled', 'House', 'Shop',
  'Goods', 'Management', 'Monitor', 'DataAnalysis', 'TrendCharts'
]

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredIcons = computed(() => {
  if (!iconSearchKeyword.value) {
    return availableIcons
  }
  return availableIcons.filter(icon =>
    icon.toLowerCase().includes(iconSearchKeyword.value.toLowerCase())
  )
})

// Tree props for parent menu selection
const treeProps = {
  label: 'menuName',
  value: 'id',
  children: 'children'
}

// Build menu tree options (exclude current menu and its descendants in edit mode)
const menuTreeOptions = computed(() => {
  const options = [
    {
      id: 0,
      menuName: '顶级菜单',
      children: buildMenuTree(props.menuTree)
    }
  ]
  
  // In edit mode, filter out current menu and its descendants
  if (props.mode === 'edit' && props.menuData) {
    return filterMenuTree(options, props.menuData.id)
  }
  
  return options
})

// Form data
const formData = ref<MenuFormData>({
  parentId: 0,
  menuName: '',
  menuPath: '',
  component: '',
  icon: '',
  sortOrder: 0,
  visible: 0,
  status: 0
})

// Validation rules
const rules: FormRules<MenuFormData> = {
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  menuPath: [
    { required: true, message: '请输入路由路径', trigger: 'blur' },
    {
      pattern: /^\/[a-z0-9/-]*$/,
      message: '格式为 /path（小写字母、数字、斜杠和连字符）',
      trigger: 'blur'
    }
  ],
  component: [
    { required: true, message: '请输入组件路径', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序号', trigger: 'blur' },
    { type: 'number', min: 0, message: '排序号不能小于0', trigger: 'blur' }
  ]
}

// Helper functions
function buildMenuTree(menus: Menu[]): any[] {
  return menus.map(menu => ({
    id: menu.id,
    menuName: menu.menuName,
    children: menu.children ? buildMenuTree(menu.children) : []
  }))
}

function filterMenuTree(tree: any[], excludeId: number): any[] {
  return tree
    .filter(node => node.id !== excludeId)
    .map(node => ({
      ...node,
      children: node.children ? filterMenuTree(node.children, excludeId) : []
    }))
}

function getMenuDescendants(menuId: number, menus: Menu[]): number[] {
  const descendants: number[] = []
  
  function traverse(nodes: Menu[]) {
    for (const node of nodes) {
      if (node.parentId === menuId) {
        descendants.push(node.id)
        if (node.children) {
          traverse(node.children)
        }
      }
    }
  }
  
  traverse(menus)
  return descendants
}

// Watch for menuData changes (edit mode)
watch(
  () => props.menuData,
  (newData) => {
    if (newData && props.mode === 'edit') {
      formData.value = {
        parentId: newData.parentId,
        menuName: newData.menuName,
        menuPath: newData.menuPath,
        component: newData.component,
        icon: newData.icon,
        sortOrder: newData.sortOrder,
        visible: newData.visible,
        status: newData.status
      }
    }
  },
  { immediate: true }
)

// Watch for parentId changes (add mode)
watch(
  () => props.parentId,
  (newParentId) => {
    if (props.mode === 'add') {
      formData.value.parentId = newParentId
    }
  },
  { immediate: true }
)

// Watch for dialog visibility changes
watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.mode === 'add') {
      // Reset form for add mode
      resetForm()
      formData.value.parentId = props.parentId
    }
  }
)

// Methods
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    emit('submit', { ...formData.value })
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClose = () => {
  resetForm()
}

const resetForm = () => {
  formData.value = {
    parentId: 0,
    menuName: '',
    menuPath: '',
    component: '',
    icon: '',
    sortOrder: 0,
    visible: 0,
    status: 0
  }
  formRef.value?.clearValidate()
}

const selectIcon = (icon: string) => {
  formData.value.icon = icon
}

const confirmIconSelection = () => {
  showIconSelector.value = false
}

// Expose methods for parent component
defineExpose({
  resetForm,
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.icon-selector {
  .icon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      background-color: #ecf5ff;
    }

    &.active {
      border-color: #409eff;
      background-color: #409eff;
      color: #fff;

      .icon-name {
        color: #fff;
      }
    }

    .icon-name {
      margin-top: 8px;
      font-size: 12px;
      color: #606266;
      text-align: center;
      word-break: break-all;
    }
  }
}
</style>
