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
          :imageSrc="imageSrc ?? ''"
          :processedSrc="processedSrc ?? ''"
          :imageFilter="imageFilter ?? ''"
        />
      </div>

      <!-- 调色参数区 -->
      <div class="section">
        <AdjustmentControls
          :adjustments="adjustments"
          @update:adjustments="handleUpdateAdjustments"
        />
      </div>

      <!-- HSL 颜色范围调节 -->
      <div class="section">
        <HSLControls
          :hslAdjustments="hslAdjustments"
          @update:hslAdjustments="handleUpdateHSL"
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
import type { HSLAdjustments } from '../composables/useHSLState'
import RGBAnalysis from './RGBAnalysis.vue'
import AdjustmentControls from './AdjustmentControls.vue'
import HSLControls from './HSLControls.vue'
import ActionButtons from './ActionButtons.vue'

interface AdjustPanelProps {
  rightPanelWidth: number
  adjustments: AdjustmentValues
  hslAdjustments: HSLAdjustments
  canSave: boolean
  canReset: boolean
  acceptedFormats?: string
  maxFileSize?: number
  imageSrc?: string
  imageFilter?: string
  processedSrc?: string
}

interface AdjustPanelEvents {
  'update:adjustments': [adjustments: AdjustmentValues]
  'update:hslAdjustments': [hsl: HSLAdjustments]
  'action:uploadImage': [file: File]
  'action:save': [format: 'png' | 'jpeg']
  'action:reset': []
}

const props = defineProps<AdjustPanelProps>()
const emit = defineEmits<AdjustPanelEvents>()

const handleUploadImage = (file: File) => emit('action:uploadImage', file)
const handleUpdateAdjustments = (adjustments: AdjustmentValues) => emit('update:adjustments', adjustments)
const handleUpdateHSL = (hsl: HSLAdjustments) => emit('update:hslAdjustments', hsl)
const handleSave = (format: 'png' | 'jpeg') => emit('action:save', format)
const handleReset = () => emit('action:reset')
</script>

<style scoped>
.adjust-panel {
  height: 100%;
  background: #1c1e22;
  display: flex;
  flex-direction: column;
  transition: width 0.1s ease;
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

/* 顶部标题栏 */
.panel-header {
  padding: 16px 18px;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 16px;
  height: 16px;
  color: #5b6af0;
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #e2e4e9;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-decoration {
  display: none;
}

/* 内容区 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 卡片区块 */
.section {
  background: #24272d;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s ease;
}

.section:hover {
  border-color: rgba(255, 255, 255, 0.09);
}

.section-actions {
  background: transparent;
  border: none;
  padding: 4px 0 0;
}

.section-actions:hover {
  border-color: transparent;
}
</style>