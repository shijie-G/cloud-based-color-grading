<template>
  <div class="adjust-panel" :style="{ width: rightPanelWidth + '%' }">
    <div class="panel-header">
      <div class="header-content">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 class="panel-title">图片调整</h2>
      </div>
      <div class="header-decoration"></div>
    </div>

    <div class="panel-content">
      <!-- RGB 波形图和直方图 -->
      <div class="section">
        <RGBAnalysis
          :imageSrc="imageSrc"
          :imageFilter="imageFilter"
        />
      </div>

      <!-- 调色参数区 -->
      <div class="section">
        <AdjustmentControls
          :adjustments="adjustments"
          @update:adjustments="handleUpdateAdjustments"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="section section-actions">
        <ActionButtons
          :canSave="canSave"
          :canReset="canReset"
          @action:save="handleSave"
          @action:reset="handleReset"
          @action:selectImage="handleUploadImage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'
import UploadSection from './UploadSection.vue'
import RGBAnalysis from './RGBAnalysis.vue'
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
  imageSrc?: string
  imageFilter?: string
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
  background: #2a2d31;
  display: flex;
  flex-direction: column;
  transition: width 0.1s ease;
  position: relative;
}

.adjust-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 10%,
    rgba(255, 255, 255, 0.08) 90%,
    transparent 100%
  );
}

.panel-header {
  padding: 20px 20px 16px;
  background: #23262a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #e5e7eb;
  letter-spacing: 0.3px;
}

.header-decoration {
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  opacity: 0.5;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 自定义滚动条 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.section {
  background: #32363b;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.section:hover {
  background: #35393e;
  border-color: rgba(255, 255, 255, 0.08);
}

.section-actions {
  margin-top: auto;
  background: #2e3238;
  border-color: rgba(255, 255, 255, 0.08);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .panel-header {
    padding: 16px 16px 12px;
  }
  
  .panel-content {
    padding: 12px;
    gap: 12px;
  }
  
  .section {
    padding: 12px;
  }
}
</style>