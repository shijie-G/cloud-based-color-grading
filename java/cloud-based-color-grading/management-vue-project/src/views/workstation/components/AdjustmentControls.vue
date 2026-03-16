<template>
  <div class="adjustment-controls">
    <div class="adjust-items">
      <!-- 亮度 -->
      <div class="adjust-item">
        <label class="adjust-label">亮度</label>
        <input
          type="range"
          class="adjust-slider"
          min="0"
          max="200"
          :value="adjustments.brightness"
          @input="updateAdjustment('brightness', $event)"
        />
        <span class="adjust-value">{{ adjustments.brightness }}%</span>
      </div>

      <!-- 对比度 -->
      <div class="adjust-item">
        <label class="adjust-label">对比度</label>
        <input
          type="range"
          class="adjust-slider"
          min="0"
          max="200"
          :value="adjustments.contrast"
          @input="updateAdjustment('contrast', $event)"
        />
        <span class="adjust-value">{{ adjustments.contrast }}%</span>
      </div>

      <!-- 饱和度 -->
      <div class="adjust-item">
        <label class="adjust-label">饱和度</label>
        <input
          type="range"
          class="adjust-slider"
          min="0"
          max="200"
          :value="adjustments.saturation"
          @input="updateAdjustment('saturation', $event)"
        />
        <span class="adjust-value">{{ adjustments.saturation }}%</span>
      </div>

      <!-- 色温 -->
      <div class="adjust-item">
        <label class="adjust-label">色温</label>
        <input
          type="range"
          class="adjust-slider"
          min="0"
          max="200"
          :value="adjustments.temperature"
          @input="updateAdjustment('temperature', $event)"
        />
        <span class="adjust-value">{{ adjustments.temperature }}%</span>
      </div>

      <!-- 曝光度 -->
      <div class="adjust-item">
        <label class="adjust-label">曝光度</label>
        <input
          type="range"
          class="adjust-slider"
          min="0"
          max="200"
          :value="adjustments.exposure"
          @input="updateAdjustment('exposure', $event)"
        />
        <span class="adjust-value">{{ adjustments.exposure }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'

// AdjustmentControls 组件 - 参数调整控件

// Props 接口
interface AdjustmentControlsProps {
  adjustments: AdjustmentValues
}

// 事件定义
interface AdjustmentControlsEvents {
  'update:adjustments': [adjustments: AdjustmentValues]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<AdjustmentControlsProps>()
const emit = defineEmits<AdjustmentControlsEvents>()

// 更新单个调整参数
const updateAdjustment = (key: keyof AdjustmentValues, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  
  const newAdjustments = {
    ...props.adjustments,
    [key]: value
  }
  
  emit('update:adjustments', newAdjustments)
}
</script>

<style scoped>
.adjustment-controls {
  margin-bottom: 2vh;
}

/* 调色参数项 */
.adjust-item {
  margin-bottom: 2vh;
}

.adjust-label {
  display: block;
  margin-bottom: 0.8vh;
  font-size: 14px;
  color: #555;
}

.adjust-slider {
  width: 100%;
  height: 0.6vh;
  -webkit-appearance: none;
  background: #eee;
  border-radius: 0.3vh;
  outline: none;
}

.adjust-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.8vh;
  height: 1.8vh;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
}

.adjust-value {
  font-size: 12px;
  color: #888;
  margin-top: 0.5vh;
  text-align: right;
}
</style>