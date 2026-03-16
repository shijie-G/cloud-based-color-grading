<template>
  <div class="action-buttons">
    <button 
      id="reset-btn" 
      @click="handleReset"
      :disabled="!canReset"
    >
      重置参数
    </button>
    <button 
      id="select-image-btn" 
      @click="handleSelectImage"
    >
      📁 选择图片
    </button>
    <button 
      id="save-btn" 
      @click="handleSave"
      :disabled="!canSave"
    >
      保存图片
    </button>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ActionButtons 组件 - 操作按钮

// Props 接口
interface ActionButtonsProps {
  canSave: boolean
  canReset: boolean
}

// 事件定义
interface ActionButtonsEvents {
  'action:save': []
  'action:reset': []
  'action:selectImage': [file: File]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ActionButtonsProps>()
const emit = defineEmits<ActionButtonsEvents>()

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

// 处理重置操作
const handleReset = () => {
  if (props.canReset) {
    emit('action:reset')
  }
}

// 处理保存操作
const handleSave = () => {
  if (props.canSave) {
    emit('action:save')
  }
}

// 处理选择图片按钮点击
const handleSelectImage = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('action:selectImage', file)
  }
  // 清空input值，允许重复选择同一文件
  if (target) {
    target.value = ''
  }
}
</script>

<style scoped>
.action-buttons {
  margin-top: 3vh;
  display: flex;
  gap: 1vw;
}

#reset-btn {
  background-color: #e6a23c;
  color: #fff;
  border: none;
  padding: 1vh 0;
  flex: 1;
  border-radius: 0.4vw;
  cursor: pointer;
  font-size: 14px;
}

#reset-btn:hover:not(:disabled) {
  background-color: #ebb563;
}

#reset-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

#select-image-btn {
  background-color: #409eff;
  color: #fff;
  border: none;
  padding: 1vh 0;
  flex: 1;
  border-radius: 0.4vw;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

#select-image-btn:hover {
  background-color: #66b1ff;
}

#save-btn {
  background-color: #67c23a;
  color: #fff;
  border: none;
  padding: 1vh 0;
  flex: 1;
  border-radius: 0.4vw;
  cursor: pointer;
  font-size: 14px;
}

#save-btn:hover:not(:disabled) {
  background-color: #85ce61;
}

#save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>