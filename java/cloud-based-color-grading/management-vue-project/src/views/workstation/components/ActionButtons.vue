<template>
  <div class="action-buttons">
    <button 
      id="select-image-btn" 
      @click="handleSelectImage"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      选择图片
    </button>
    <div class="secondary-row">
      <button 
        id="reset-btn" 
        @click="handleReset"
        :disabled="!canReset"
      >
        重置参数
      </button>
      <button 
        id="save-btn" 
        @click="handleSave"
        :disabled="!canSave"
      >
        保存图片
      </button>
      <div class="format-select-wrap" v-if="canSave">
        <select v-model="saveFormat" class="format-select" title="导出格式">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>
    </div>
    
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
  'action:save': [format: 'png' | 'jpeg']
  'action:reset': []
  'action:selectImage': [file: File]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ActionButtonsProps>()
const emit = defineEmits<ActionButtonsEvents>()

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)
const saveFormat = ref<'png' | 'jpeg'>('png')

// 处理重置操作
const handleReset = () => {
  if (props.canReset) {
    emit('action:reset')
  }
}

// 处理保存操作
const handleSave = () => {
  if (props.canSave) {
    emit('action:save', saveFormat.value)
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 主按钮（选择图片） */
#select-image-btn {
  width: 100%;
  padding: 10px;
  background: #5b6af0;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s ease, transform 0.1s ease;
  outline: none;
}

#select-image-btn:hover {
  background: #6b7af5;
}

#select-image-btn:active {
  transform: scale(0.98);
}

/* 次级按钮行 */
.secondary-row {
  display: flex;
  gap: 8px;
}

#reset-btn,
#save-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  outline: none;
}

#reset-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
}

#reset-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
  border-color: rgba(255, 255, 255, 0.15);
}

#reset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

#save-btn {
  background: rgba(52, 199, 89, 0.12);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.2);
}

#save-btn:hover:not(:disabled) {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.35);
}

#save-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.format-select-wrap {
  display: flex;
  align-items: stretch;
}

.format-select {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.2);
  border-radius: 8px;
  padding: 0 8px;
  font-size: 11px;
  cursor: pointer;
  outline: none;
  height: 100%;
  min-height: 34px;
  appearance: none;
  -webkit-appearance: none;
  text-align: center;
}

.format-select:hover {
  background: rgba(52, 199, 89, 0.18);
  border-color: rgba(52, 199, 89, 0.35);
}
</style>