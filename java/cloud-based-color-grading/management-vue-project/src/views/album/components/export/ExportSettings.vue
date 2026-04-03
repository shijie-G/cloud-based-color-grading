<script setup lang="ts">
import { computed } from 'vue'
import type { ExportSettings, ExportFormat, BackgroundType } from '../../types/export'
import WatermarkConfig from './WatermarkConfig.vue'

interface Props {
  settings: ExportSettings
  imageWidth: number
  imageHeight: number
  estimatedSize: string
}

interface Emits {
  (e: 'update:settings', value: ExportSettings): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formats: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPG/JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WEBP' }
]

const backgrounds: { value: BackgroundType; label: string }[] = [
  { value: 'transparent', label: '透明' },
  { value: 'white', label: '白色' },
  { value: 'black', label: '黑色' }
]

const scaleOptions = [
  { value: 1, label: '100%' },
  { value: 0.8, label: '80%' },
  { value: 0.5, label: '50%' }
]

const updateSettings = (updates: Partial<ExportSettings>) => {
  emit('update:settings', { ...props.settings, ...updates })
}

const exportWidth = computed(() => Math.round(props.imageWidth * props.settings.scale))
const exportHeight = computed(() => Math.round(props.imageHeight * props.settings.scale))
</script>

<template>
  <div class="export-settings">
    <!-- 图片格式 -->
    <div class="setting-section">
      <h4 class="section-title">图片格式</h4>
      <div class="format-buttons">
        <button
          v-for="format in formats"
          :key="format.value"
          :class="['format-btn', { active: settings.format === format.value }]"
          @click="updateSettings({ format: format.value })"
        >
          {{ format.label }}
        </button>
      </div>
    </div>

    <!-- 画质调节（仅 JPEG 和 WEBP） -->
    <div class="setting-section" v-if="settings.format !== 'png'">
      <h4 class="section-title">画质</h4>
      <div class="quality-slider">
        <input
          type="range"
          min="0"
          max="100"
          :value="settings.quality"
          @input="updateSettings({ quality: Number(($event.target as HTMLInputElement).value) })"
        />
        <span class="quality-value">{{ settings.quality }}</span>
      </div>
      <div class="quality-info">
        <span v-if="settings.format === 'jpeg'">JPEG 有损压缩</span>
        <span v-else-if="settings.format === 'webp'">WEBP 有损压缩</span>
      </div>
    </div>

    <!-- PNG 无损提示 -->
    <div class="setting-section" v-if="settings.format === 'png'">
      <div class="png-lossless-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>PNG 格式为无损压缩，不支持画质调节</span>
      </div>
    </div>

    <!-- DPI 设置 -->
    <div class="setting-section">
      <h4 class="section-title">DPI（分辨率）</h4>
      <div class="dpi-options">
        <button
          v-for="dpi in [72, 150, 300, 600]"
          :key="dpi"
          :class="['dpi-btn', { active: settings.dpi === dpi }]"
          @click="updateSettings({ dpi })"
        >
          {{ dpi }} DPI
        </button>
      </div>
      <div class="dpi-info">
        <span v-if="settings.dpi === 72">网页显示</span>
        <span v-else-if="settings.dpi === 150">普通打印</span>
        <span v-else-if="settings.dpi === 300">高质量打印</span>
        <span v-else>专业印刷</span>
      </div>
    </div>

    <!-- 图片尺寸 -->
    <div class="setting-section">
      <h4 class="section-title">图片尺寸</h4>
      <div class="scale-buttons">
        <button
          v-for="option in scaleOptions"
          :key="option.value"
          :class="['scale-btn', { active: settings.scale === option.value }]"
          @click="updateSettings({ scale: option.value })"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="size-info">
        {{ exportWidth }} × {{ exportHeight }} px
      </div>
    </div>

    <!-- 背景设置 -->
    <div class="setting-section" v-if="settings.format === 'png'">
      <h4 class="section-title">背景</h4>
      <div class="background-buttons">
        <button
          v-for="bg in backgrounds"
          :key="bg.value"
          :class="['bg-btn', { active: settings.background === bg.value }]"
          @click="updateSettings({ background: bg.value })"
        >
          {{ bg.label }}
        </button>
      </div>
    </div>

    <!-- 水印设置 -->
    <div class="setting-section">
      <h4 class="section-title">水印</h4>
      <WatermarkConfig
        :watermark="settings.watermark"
        @update:watermark="updateSettings({ watermark: $event })"
      />
    </div>

    <!-- 文件大小预估 -->
    <div class="setting-section">
      <div class="size-estimate">
        <span class="estimate-label">预估大小：</span>
        <span class="estimate-value">{{ estimatedSize }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e4e9;
}

.format-buttons,
.scale-buttons,
.background-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.format-btn,
.scale-btn,
.bg-btn {
  padding: 0.5rem 1rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e4e9;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.format-btn:hover,
.scale-btn:hover,
.bg-btn:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.format-btn.active,
.scale-btn.active,
.bg-btn.active {
  background: #5b6af0;
  border-color: #5b6af0;
}

.quality-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quality-slider input[type="range"] {
  flex: 1;
}

.quality-value {
  min-width: 40px;
  text-align: right;
  font-size: 0.9rem;
  color: #9ca3af;
  font-weight: 500;
}

.dpi-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dpi-btn {
  padding: 0.5rem 1rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e4e9;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dpi-btn:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.dpi-btn.active {
  background: #5b6af0;
  border-color: #5b6af0;
}

.dpi-info {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.quality-info {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.png-lossless-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  color: #60a5fa;
}

.png-lossless-info svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.size-info {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.size-estimate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(91, 106, 240, 0.1);
  border-radius: 6px;
}

.estimate-label {
  font-size: 0.9rem;
  color: #9ca3af;
}

.estimate-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #5b6af0;
}
</style>
