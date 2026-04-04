<template>
  <div class="filter-panel">
    <!-- 预设滤镜 -->
    <div class="panel-section">
      <h3 class="section-title">预设滤镜</h3>
      <div class="preset-grid">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="preset-card"
          @click="applyPreset(preset.id)"
        >
          <div class="preset-preview" :style="{ background: preset.gradient }"></div>
          <div class="preset-label">
            <span class="preset-name">{{ preset.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模糊 -->
    <div class="panel-section">
      <h3 class="section-title">模糊</h3>
      <div class="control-row">
        <span class="control-label">半径</span>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          v-model.number="filterConfig.blur_radius"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.blur_radius }}</span>
      </div>
    </div>

    <!-- 锐化 -->
    <div class="panel-section">
      <h3 class="section-title">锐化</h3>
      <div class="control-row">
        <span class="control-label">强度</span>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          v-model.number="filterConfig.sharpen_amount"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.sharpen_amount.toFixed(1) }}</span>
      </div>
      <div class="control-row">
        <span class="control-label">半径</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          v-model.number="filterConfig.sharpen_radius"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.sharpen_radius.toFixed(1) }}</span>
      </div>
    </div>

    <!-- 颗粒 -->
    <div class="panel-section">
      <h3 class="section-title">颗粒</h3>
      <div class="control-row">
        <span class="control-label">强度</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          v-model.number="filterConfig.grain_intensity"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.grain_intensity }}</span>
      </div>
    </div>

    <!-- 暗角 -->
    <div class="panel-section">
      <h3 class="section-title">暗角</h3>
      <div class="control-row">
        <span class="control-label">强度</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          v-model.number="filterConfig.vignette_strength"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.vignette_strength.toFixed(1) }}</span>
      </div>
      <div class="control-row">
        <span class="control-label">范围</span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          v-model.number="filterConfig.vignette_size"
          class="control-slider"
        />
        <span class="control-value">{{ filterConfig.vignette_size.toFixed(1) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions">
      <button class="btn-reset" @click="handleReset">重置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, reactive, onMounted } from 'vue'
import type { FilterConfig } from '../types/filterTypes'
import { filterPresets, defaultFilterConfig } from '../types/filterTypes'

// 从父组件注入滤镜配置，如果没有则使用默认配置
const filterConfig = inject<FilterConfig>('filterConfig', reactive(defaultFilterConfig()))

onMounted(() => {
  // FilterPanel mounted
})

const presets = [
  { id: 'natural_soft', name: '自然柔和', gradient: 'linear-gradient(135deg, #fdfbf7 0%, #ebedee 100%)' },
  { id: 'warm_glow', name: '温暖光晕', gradient: 'linear-gradient(135deg, #fff5e6 0%, #ffe0b2 100%)' },
  { id: 'cool_breeze', name: '清凉微风', gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
  { id: 'soft_portrait', name: '柔光人像', gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffccbc 100%)' },
  { id: 'fresh_japanese', name: '清透日系', gradient: 'linear-gradient(135deg, #f0f5ff 0%, #adc4e6 100%)' },
  { id: 'vintage_film', name: '复古胶片', gradient: 'linear-gradient(135deg, #fae0c8 0%, #3a4a5f 100%)' },
  { id: 'hongkong_teal', name: '港风青橙', gradient: 'linear-gradient(135deg, #ffaa55 0%, #226699 100%)' },
  { id: 'soft_warm', name: '温柔暖调', gradient: 'linear-gradient(135deg, #fff0d9 0%, #5a4a44 100%)' },
  { id: 'cinematic_cool', name: '冷灰电影', gradient: 'linear-gradient(135deg, #e6edf7 0%, #2d3748 100%)' },
  { id: 'bw_texture', name: '黑白质感', gradient: 'linear-gradient(135deg, #ffffff 0%, #000000 100%)' },
  { id: 'creamy_portrait', name: '奶油肌', gradient: 'linear-gradient(135deg, #ffe8d6 0%, #6b7280 100%)' },
  { id: 'cyberpunk_neon', name: '赛博朋克', gradient: 'linear-gradient(135deg, #ff2299 0%, #00ccff 100%)' },
  { id: 'landscape_hd', name: '风景高清', gradient: 'linear-gradient(135deg, #f9fbf5 0%, #1e3a2a 100%)' },
  { id: 'kodak_gold', name: '柯达金', gradient: 'linear-gradient(135deg, #ffddaa 0%, #2a3344 100%)' }
]

const applyPreset = (presetId: string) => {
  const preset = filterPresets[presetId]
  if (preset) {
    Object.assign(filterConfig, preset)
  }
}

const handleReset = () => {
  filterConfig.blur_radius = 0
  filterConfig.sharpen_amount = 0
  filterConfig.sharpen_radius = 1.0
  filterConfig.style_type = 0
  filterConfig.style_strength = 0
  filterConfig.grain_intensity = 0
  filterConfig.vignette_strength = 0
  filterConfig.vignette_size = 1.2
}
</script>

<style scoped>
.filter-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #e2e4e9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 预设网格 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
  max-height: 380px;
  overflow-y: auto;
}

.preset-grid::-webkit-scrollbar {
  width: 4px;
}

.preset-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.preset-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.preset-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.preset-card {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  min-height: 100px;
}

.preset-card:hover {
  border-color: #5b6af0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 106, 240, 0.2);
}

.preset-card:active {
  transform: translateY(0);
}

.preset-preview {
  width: 100%;
  height: 64px;
  border-radius: 4px 4px 0 0;
  min-height: 64px;
  flex-shrink: 0;
}

.preset-label {
  padding: 0.5rem 0.625rem;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.preset-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #e2e4e9;
  text-align: center;
  line-height: 1.3;
  letter-spacing: 0.01em;
}

/* 控制行 */
.control-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-label {
  font-size: 0.8125rem;
  color: #9ca3af;
  min-width: 50px;
}

.control-slider {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #5b6af0;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.control-value {
  font-size: 0.8125rem;
  color: #5b6af0;
  font-weight: 500;
  min-width: 35px;
  text-align: right;
}

/* 操作按钮 */
.panel-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
}

.btn-reset {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
}

.btn-reset:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e4e9;
}

/* 滚动条样式 */
.filter-panel::-webkit-scrollbar {
  width: 6px;
}

.filter-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.filter-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.filter-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
