<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'add' ? '新增角色' : '编辑角色'"
    width="600px"
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
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="formData.roleName"
          placeholder="请输入角色名称"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="角色标识" prop="roleKey">
        <el-input
          v-model="formData.roleKey"
          placeholder="请输入角色标识，格式：ROLE_XXX"
          clearable
          maxlength="50"
          show-word-limit
        />
        <template #extra>
          <span class="form-tip">格式为 ROLE_ 开头的大写字母和下划线</span>
        </template>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
          maxlength="200"
          show-word-limit
        />
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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Role, RoleFormData } from '@/types'

// Props
interface Props {
  modelValue: boolean
  roleData?: Role | null
  mode: 'add' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  roleData: null,
  mode: 'add'
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: RoleFormData): void
}

const emit = defineEmits<Emits>()

// Refs
const formRef = ref<FormInstance>()
const loading = ref(false)

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form data
const formData = ref<RoleFormData>({
  roleName: '',
  roleKey: '',
  description: '',
  status: 0
})

// Validation rules
const rules: FormRules<RoleFormData> = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    {
      pattern: /^ROLE_[A-Z_]+$/,
      message: '格式为 ROLE_XXX（大写字母和下划线）',
      trigger: 'blur'
    }
  ],
  description: [
    { max: 200, message: '最多 200 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// Watch for roleData changes (edit mode)
watch(
  () => props.roleData,
  (newData) => {
    if (newData && props.mode === 'edit') {
      formData.value = {
        roleName: newData.roleName,
        roleKey: newData.roleKey,
        description: newData.description,
        status: newData.status
      }
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
    roleName: '',
    roleKey: '',
    description: '',
    status: 0
  }
  formRef.value?.clearValidate()
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
</style>
