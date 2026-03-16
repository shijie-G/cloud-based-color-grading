<template>
  <div class="adjust-panel" :style="{ width: rightPanelWidth + '%' }">
    <h2 class="panel-title">图片调整</h2>

    <!-- 上传区域 -->
    <UploadSection
      :acceptedFormats="acceptedFormats"
      :maxFileSize="maxFileSize"
      @action:uploadImage="handleUploadImage"
    />

    <!-- 调色参数区 -->
    <AdjustmentControls
      :adjustments="adjustments"
      @update:adjustments="handleUpdateAdjustments"
    />

    <!-- 操作按钮 -->
    <ActionButtons
      :canSave="canSave"
      :canReset="canReset"
      @action:save="handleSave"
      @action:reset="handleReset"
      @action:selectImage="handleUploadImage"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'
import UploadSection from './UploadSection.vue'
import AdjustmentControls from './AdjustmentControls.vue'
import ActionButtons from './ActionButtons.vue'

// AdjustPanel 组件 - 右侧调整面板容器

// Props 接口
interface AdjustPanelProps {
  rightPanelWidth: number
  adjustments: AdjustmentValues
  canSave: boolean
  canReset: boolean
  acceptedFormats?: string
  maxFileSize?: number
}

// 事件定义
interface AdjustPanelEvents {
  'update:adjustments': [adjustments: AdjustmentValues]
  'action:uploadImage': [file: File]
  'action:save': []
  'action:reset': []
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<AdjustPanelProps>()
const emit = defineEmits<AdjustPanelEvents>()

// 处理上传图片事件
const handleUploadImage = (file: File) => {
  emit('action:uploadImage', file)
}

// 处理调整参数更新事件
const handleUpdateAdjustments = (adjustments: AdjustmentValues) => {
  emit('update:adjustments', adjustments)
}

// 处理保存事件
const handleSave = () => {
  emit('action:save')
}

// 处理重置事件
const handleReset = () => {
  emit('action:reset')
}
</script>

<style scoped>
.adjust-panel {
  height: 100%;
  background-color: #fff;
  padding: 2vh 2vw;
  overflow-y: auto;
  box-shadow: -0.2vw 0 1vw rgba(0,0,0,0.1);
  transition: width 0.1s ease;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 2vh;
  color: #222;
  border-bottom: 0.2vh solid #eee;
  padding-bottom: 1vh;
}
</style>