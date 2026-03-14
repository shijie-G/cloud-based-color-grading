<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增权限' : '编辑权限'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="permission-form"
    >
      <el-form-item label="权限名称" prop="permissionName">
        <el-input
          v-model="formData.permissionName"
          placeholder="请输入权限名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="权限标识" prop="permissionKey">
        <el-input
          v-model="formData.permissionKey"
          placeholder="例如: system:user:view"
          clearable
        />
      </el-form-item>

      <el-form-item label="资源类型" prop="resourceType">
        <el-select
          v-model="formData.resourceType"
          placeholder="请选择资源类型"
          style="width: 100%"
        >
          <el-option label="菜单" value="menu" />
          <el-option label="按钮" value="button" />
          <el-option label="API" value="api" />
        </el-select>
      </el-form-item>

      <el-form-item label="资源路径" prop="resourcePath">
        <el-input
          v-model="formData.resourcePath"
          placeholder="例如: /api/users 或 /system/user"
          clearable
        />
      </el-form-item>

      <el-form-item
        v-if="formData.resourceType === 'api'"
        label="HTTP方法"
        prop="method"
      >
        <el-select
          v-model="formData.method"
          placeholder="请选择HTTP方法"
          style="width: 100%"
        >
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Permission, PermissionFormData } from '@/types/permission'

// Props
interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  permissionData?: Permission | null
}

const props = withDefaults(defineProps<Props>(), {
  permissionData: null
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: PermissionFormData): void
}

const emit = defineEmits<Emits>()

// 对话框显示状态
const visible = ref(false)

// 表单引用
const formRef = ref<FormInstance>()

// 提交状态
const submitting = ref(false)

// 表单数据
const formData = reactive<PermissionFormData>({
  permissionName: '',
  permissionKey: '',
  resourceType: 'menu',
  resourcePath: '',
  method: '',
  description: ''
})

// 表单验证规则
const rules: FormRules = {
  permissionName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  permissionKey: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    {
      pattern: /^[a-z0-9:_-]+$/,
      message: '只能包含小写字母、数字、冒号、下划线和连字符',
      trigger: 'blur'
    }
  ],
  resourceType: [
    { required: true, message: '请选择资源类型', trigger: 'change' }
  ],
  resourcePath: [
    { required: true, message: '请输入资源路径', trigger: 'blur' }
  ],
  method: [
    {
      validator: (rule, value, callback) => {
        if (formData.resourceType === 'api' && !value) {
          callback(new Error('API类型权限必须选择HTTP方法'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  description: [
    { max: 200, message: '最多 200 个字符', trigger: 'blur' }
  ]
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      // 打开对话框时初始化表单
      nextTick(() => {
        if (props.mode === 'edit' && props.permissionData) {
          // 编辑模式：填充数据
          Object.assign(formData, {
            permissionName: props.permissionData.permissionName,
            permissionKey: props.permissionData.permissionKey,
            resourceType: props.permissionData.resourceType,
            resourcePath: props.permissionData.resourcePath,
            method: props.permissionData.method || '',
            description: props.permissionData.description || ''
          })
        } else {
          // 新增模式：重置表单
          resetForm()
        }
      })
    }
  }
)

// 监听 visible 变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 重置表单
const resetForm = () => {
  formData.permissionName = ''
  formData.permissionKey = ''
  formData.resourceType = 'menu'
  formData.resourcePath = ''
  formData.method = ''
  formData.description = ''
  formRef.value?.clearValidate()
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    // 设置提交状态
    submitting.value = true

    // 准备提交数据
    const submitData: PermissionFormData = {
      permissionName: formData.permissionName,
      permissionKey: formData.permissionKey,
      resourceType: formData.resourceType,
      resourcePath: formData.resourcePath,
      method: formData.resourceType === 'api' ? formData.method : '',
      description: formData.description
    }

    // 触发提交事件
    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.permission-form {
  padding: 20px 0;

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #333;
  }

  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.el-select) {
    width: 100%;
  }
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: 0;

  .el-dialog__title {
    color: #ffffff;
    font-weight: 600;
    font-size: 18px;
  }

  .el-dialog__headerbtn {
    top: 20px;

    .el-dialog__close {
      color: #ffffff;
      font-size: 20px;

      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

:deep(.el-dialog__body) {
  padding: 20px 30px;
}

:deep(.el-dialog__footer) {
  padding: 15px 30px;
  border-top: 1px solid #e5e5e5;

  .el-button {
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 600;
    transition: all 0.3s ease;

    &--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }

    &--default {
      &:hover {
        border-color: #667eea;
        color: #667eea;
      }
    }
  }
}
</style>
