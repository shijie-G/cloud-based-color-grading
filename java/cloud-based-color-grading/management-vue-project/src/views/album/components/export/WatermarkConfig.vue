<script setup lang="ts">
import { computed } from 'vue'
import type { WatermarkConfig, WatermarkPosition } from '../types/export'

interface Props {
  watermark: WatermarkConfig
}

interface Emits {
  (e: 'update:watermark', value: WatermarkConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const positions: { value: WatermarkPosition; label: string }[] = [
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
  { value: 'center', label: '居中' }
]

const updateWatermark = (updates: Partial<WatermarkConfig>) => {
  emit('update:watermark', { ...props.watermark, ...updates })
}
</script>

<template>
  <div class="watermark-config">
    <div class="config-row">
      <label class="config-label">
        <input
          type="checkbox"
          :checked="watermark.enabled"
          @change="updateWatermark({ enabled: ($event.target as HTMLInputElement).checked })"
        />
        <span>启用水印</span>
      </label>
    </div>

    <template v-if="watermark.enabled">
      <div class="config-row">
        <label class="config-label">水印文字</label>
        <input
          type="text"
          class="config-input"
          :value="watermark.text"
          @input="updateWatermark({ text: ($event.target as HTMLInputElement).value })"
          placeholder="输入水印文字"
        />
      </div>

      <div class="config-row">
        <label class="config-label">水印大小</label>
        <div class="slider-group">
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            :value="watermark.scale"
            @input="updateWatermark({ scale: Number(($event.target as HTMLInputElement).value) })"
          />
          <span class="slider-value">{{ Math.round(watermark.scale * 100) }}%</span>
        </div>
      </div>

      <div class="config-row">
        <label class="config-label">颜色</label>
        <input
          type="color"
          class="config-color"
          :value="watermark.color"
          @input="updateWatermark({ color: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="config-row">
        <label class="config-label">透明度</label>
        <div class="slider-group">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="watermark.opacity"
            @input="updateWatermark({ opacity: Number(($event.target as HTMLInputElement).value) })"
          />
          <span class="slider-value">{{ Math.round(watermark.opacity * 100) }}%</span>
        </div>
      </div>

      <div class="config-row">
        <label class="config-label">
          <input
            type="checkbox"
            :checked="watermark.bold"
            @change="updateWatermark({ bold: ($event.target as HTMLInputElement).checked })"
          />
          <span>粗体</span>
        </label>
      </div>

      <div class="config-row">
        <label class="config-label">位置</label>
        <div class="position-buttons">
          <button
            v-for="pos in positions"
            :key="pos.value"
            :class="['position-btn', { active: watermark.position === pos.value }]"
            @click="updateWatermark({ position: pos.value, customX: undefined, customY: undefined })"
          >
            {{ pos.label }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.watermark-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.config-label {
  min-width: 80px;
  font-size: 0.9rem;
  color: #e2e4e9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.config-input {
  flex: 1;
  padding: 0.5rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #e2e4e9;
  font-size: 0.9rem;
}

.config-input:focus {
  outline: none;
  border-color: #5b6af0;
}

.slider-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-group input[type="range"] {
  flex: 1;
}

.slider-value {
  min-width: 50px;
  text-align: right;
  font-size: 0.85rem;
  color: #9ca3af;
}

.config-color {
  width: 50px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

.position-buttons {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.position-btn {
  padding: 0.4rem 0.8rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #e2e4e9;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.position-btn:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.position-btn.active {
  background: #5b6af0;
  border-color: #5b6af0;
}
</style>
