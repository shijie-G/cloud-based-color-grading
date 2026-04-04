<template>
  <div class="filter-panel">

    <!-- 预设滤镜 -->
    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">预设</span>
        <span v-if="activePresetName" class="active-preset-badge">{{ activePresetName }}</span>
      </div>
      <div v-for="group in presetGroups" :key="group.label" class="preset-group">
        <div class="preset-group-label">{{ group.label }}</div>
        <div class="preset-grid">
          <div
            v-for="preset in group.items"
            :key="preset.id"
            class="preset-card"
            :class="{ active: activePresetId === preset.id }"
            @click="applyPreset(preset.id)"
          >
            <div class="preset-swatch" :style="{ background: preset.gradient }">
              <svg v-if="activePresetId === preset.id" class="preset-check" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="preset-name">{{ preset.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 风格化 -->
    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">风格化</span>
        <span v-if="filterConfig.style_type > 0" class="param-active-dot"></span>
      </div>
      <div class="style-tabs">
        <button
          v-for="s in styleTypes"
          :key="s.value"
          class="style-tab"
          :class="{ active: filterConfig.style_type === s.value }"
          @click="filterConfig.style_type = s.value"
        >{{ s.label }}</button>
      </div>
      <template v-if="filterConfig.style_type > 0">
        <SliderRow label="强度" :min="0" :max="2" :step="0.05" v-model="filterConfig.style_strength" :decimals="2" />
        <SliderRow label="混合" :min="0" :max="1" :step="0.05" v-model="filterConfig.style_blend" :decimals="2" />
        <div class="color-row">
          <span class="control-label">高光色</span>
          <input type="color" v-model="filterConfig.style_highlight_color" class="color-input" />
          <span class="color-hex">{{ filterConfig.style_highlight_color }}</span>
        </div>
        <div class="color-row">
          <span class="control-label">阴影色</span>
          <input type="color" v-model="filterConfig.style_shadow_color" class="color-input" />
          <span class="color-hex">{{ filterConfig.style_shadow_color }}</span>
        </div>
      </template>
    </div>

    <div class="divider"></div>

    <!-- 锐化 / 模糊 -->
    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">锐化 / 模糊</span>
        <span v-if="filterConfig.sharpen_amount > 0 || filterConfig.blur_radius > 0" class="param-active-dot"></span>
      </div>
      <SliderRow label="锐化" :min="0" :max="3" :step="0.1" v-model="filterConfig.sharpen_amount" :decimals="1" />
      <SliderRow label="锐化半径" :min="0.5" :max="3" :step="0.1" v-model="filterConfig.sharpen_radius" :decimals="1" />
      <SliderRow label="模糊" :min="0" :max="50" :step="1" v-model="filterConfig.blur_radius" :decimals="0" />
    </div>

    <div class="divider"></div>

    <!-- 颗粒 / 暗角 -->
    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">颗粒 / 暗角</span>
        <span v-if="filterConfig.grain_intensity > 0 || filterConfig.vignette_strength !== 0" class="param-active-dot"></span>
      </div>
      <SliderRow label="颗粒" :min="0" :max="100" :step="1" v-model="filterConfig.grain_intensity" :decimals="0" />
      <SliderRow label="暗角" :min="-1" :max="1" :step="0.05" v-model="filterConfig.vignette_strength" :decimals="2" />
      <SliderRow label="暗角范围" :min="0" :max="2" :step="0.1" v-model="filterConfig.vignette_size" :decimals="1" />
    </div>

    <!-- 重置 -->
    <button class="btn-reset" @click="handleReset">全部重置</button>

  </div>
</template>

<script setup lang="ts">
import { inject, reactive, computed } from 'vue'
import type { FilterConfig } from '../types/filterTypes'
import { filterPresets, defaultFilterConfig } from '../types/filterTypes'

const filterConfig = inject<FilterConfig>('filterConfig', reactive(defaultFilterConfig()))

// ── 内联 SliderRow 组件（避免额外文件） ──────────────────────
const SliderRow = {
  props: { label: String, min: Number, max: Number, step: Number, modelValue: Number, decimals: Number },
  emits: ['update:modelValue'],
  template: `
    <div class="control-row">
      <span class="control-label">{{ label }}</span>
      <div class="slider-wrap">
        <div class="slider-track-bg"></div>
        <div class="slider-fill" :style="fillStyle"></div>
        <input type="range" :min="min" :max="max" :step="step"
          :value="modelValue" @input="$emit('update:modelValue', +$event.target.value)"
          class="control-slider" />
      </div>
      <span class="control-value" :class="{ nonzero: modelValue !== 0 }">
        {{ decimals === 0 ? modelValue : modelValue.toFixed(decimals) }}
      </span>
    </div>
  `,
  computed: {
    fillStyle() {
      const pct = ((this.modelValue - this.min) / (this.max - this.min)) * 100
      // 中心对称（min<0）或从左填充
      if (this.min < 0) {
        const center = (-this.min / (this.max - this.min)) * 100
        const left = Math.min(center, pct)
        const width = Math.abs(pct - center)
        return { left: left + '%', width: width + '%' }
      }
      return { left: '0%', width: pct + '%' }
    }
  }
}

// 预设列表（分组）
const presetGroups = [
  {
    label: '富士胶片',
    items: [
      { id: 'fuji_provia',         name: 'Provia',         gradient: 'linear-gradient(135deg, #e8f4e0, #1a3a2a)' },
      { id: 'fuji_nc',             name: 'NC 自然',        gradient: 'linear-gradient(135deg, #f0ead8, #1e3028)' },
      { id: 'fuji_velvia',         name: 'Velvia',         gradient: 'linear-gradient(135deg, #d8f0a0, #0a2a1a)' },
      { id: 'fuji_classic_chrome', name: 'Classic Chrome', gradient: 'linear-gradient(135deg, #d8ccc0, #1e2830)' },
    ]
  },
  {
    label: '柯达胶片',
    items: [
      { id: 'kodak_portra',  name: 'Portra 400', gradient: 'linear-gradient(135deg, #f8e0c8, #2a1e18)' },
      { id: 'kodak_ektar',   name: 'Ektar 100',  gradient: 'linear-gradient(135deg, #f0e0a0, #0a1e10)' },
      { id: 'kodak_gold',    name: 'Gold 200',   gradient: 'linear-gradient(135deg, #e8c888, #1e2838)' },
      { id: 'vintage_film',  name: '复古胶片',   gradient: 'linear-gradient(135deg, #d4b896, #3a4a5f)' },
    ]
  },
  {
    label: '特殊工艺',
    items: [
      { id: 'polaroid',       name: '宝丽来',   gradient: 'linear-gradient(135deg, #f8f0d8, #3a3028)' },
      { id: 'silver_gelatin', name: '银盐黑白', gradient: 'linear-gradient(135deg, #e8e4dc, #0a0a0a)' },
      { id: 'cross_process',  name: '跨冲',     gradient: 'linear-gradient(135deg, #88ee22, #440088)' },
      { id: 'bw_texture',     name: '黑白质感', gradient: 'linear-gradient(135deg, #e0e0e0, #181818)' },
    ]
  },
  {
    label: '风格调色',
    items: [
      { id: 'natural_soft',    name: '自然柔和', gradient: 'linear-gradient(135deg, #fdfbf7, #c8d0d4)' },
      { id: 'warm_glow',       name: '温暖光晕', gradient: 'linear-gradient(135deg, #ffe8c0, #d4956a)' },
      { id: 'cool_breeze',     name: '清凉微风', gradient: 'linear-gradient(135deg, #c8e8ff, #7ab8e8)' },
      { id: 'soft_portrait',   name: '柔光人像', gradient: 'linear-gradient(135deg, #ffe4d0, #e8a090)' },
      { id: 'fresh_japanese',  name: '清透日系', gradient: 'linear-gradient(135deg, #e8f0ff, #90b8e0)' },
      { id: 'hongkong_teal',   name: '港风青橙', gradient: 'linear-gradient(135deg, #ff9944, #1a5588)' },
      { id: 'soft_warm',       name: '温柔暖调', gradient: 'linear-gradient(135deg, #f0d8b0, #6a4a3a)' },
      { id: 'cinematic_cool',  name: '冷灰电影', gradient: 'linear-gradient(135deg, #c8d8e8, #1e2838)' },
      { id: 'creamy_portrait', name: '奶油肌',   gradient: 'linear-gradient(135deg, #ffd8c0, #8a8a90)' },
      { id: 'cyberpunk_neon',  name: '赛博朋克', gradient: 'linear-gradient(135deg, #cc1188, #0099cc)' },
      { id: 'landscape_hd',   name: '风景高清', gradient: 'linear-gradient(135deg, #d8e8c8, #1a3828)' },
    ]
  },
]

// 扁平化用于激活检测
const presets = presetGroups.flatMap(g => g.items)

const styleTypes = [
  { value: 0, label: '关' },
  { value: 1, label: '复古' },
  { value: 2, label: '胶片' },
  { value: 3, label: '港风' },
  { value: 4, label: '青橙' },
  { value: 5, label: '冷调' },
]

// 当前激活的预设（通过参数比对）
const activePresetId = computed(() => {
  for (const p of presets) {
    const preset = filterPresets[p.id]
    if (!preset) continue
    const keys = Object.keys(preset) as (keyof FilterConfig)[]
    const match = keys.every(k => {
      const a = filterConfig[k], b = preset[k]
      if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.001
      return a === b
    })
    if (match) return p.id
  }
  return null
})

const activePresetName = computed(() => {
  return presets.find(p => p.id === activePresetId.value)?.name ?? ''
})

const applyPreset = (id: string) => {
  const preset = filterPresets[id]
  if (preset) Object.assign(filterConfig, preset)
}

const handleReset = () => {
  Object.assign(filterConfig, defaultFilterConfig())
}
</script>

<style scoped>
.filter-panel {
  height: 100%;
  overflow-y: auto;
  padding: 10px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.filter-panel::-webkit-scrollbar { width: 4px; }
.filter-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.divider {
  height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 10px 0;
}

/* ── 区块 ── */
.panel-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.section-title {
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.active-preset-badge {
  font-size: 10px;
  color: #5b6af0;
  background: rgba(91,106,240,0.12);
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: auto;
}

.param-active-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5b6af0;
  margin-left: auto;
}

/* ── 预设网格 ── */
.preset-group {
  margin-bottom: 8px;
}

.preset-group-label {
  font-size: 9px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 5px;
  padding-left: 1px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.preset-card {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,0.08);
  transition: all 0.18s;
  display: flex;
  flex-direction: column;
}

.preset-card:hover {
  border-color: rgba(91,106,240,0.5);
  transform: translateY(-1px);
}

.preset-card.active {
  border-color: #5b6af0;
  box-shadow: 0 0 0 1px rgba(91,106,240,0.3);
}

.preset-swatch {
  width: 100%;
  height: 44px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-check {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.6));
}

.preset-name {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-align: center;
  padding: 4px 4px 5px;
  background: rgba(255,255,255,0.04);
  line-height: 1.2;
}

.preset-card.active .preset-name {
  color: #c7ceff;
}

/* ── 风格化 tabs ── */
.style-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.style-tab {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
}

.style-tab:hover { color: #9ca3af; border-color: rgba(255,255,255,0.15); }
.style-tab.active {
  background: rgba(91,106,240,0.18);
  border-color: rgba(91,106,240,0.5);
  color: #a5b0ff;
}

/* ── 颜色选择 ── */
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.color-input {
  width: 28px;
  height: 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
  outline: none;
}

.color-hex {
  font-size: 11px;
  color: #4b5563;
  font-family: 'Courier New', monospace;
}

/* ── 滑块行 ── */
.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 11px;
  color: #6b7280;
  min-width: 52px;
  flex-shrink: 0;
}

.slider-wrap {
  flex: 1;
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
}

.slider-track-bg {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: rgba(255,255,255,0.08);
  border-radius: 1px;
}

.slider-fill {
  position: absolute;
  height: 2px;
  background: #5b6af0;
  border-radius: 1px;
  pointer-events: none;
}

.control-slider {
  position: absolute;
  left: 0; right: 0;
  width: 100%;
  height: 2px;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  z-index: 1;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #e2e4e9;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.4);
  box-shadow: 0 1px 4px rgba(0,0,0,0.5);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
  box-shadow: 0 0 0 3px rgba(91,106,240,0.25), 0 1px 4px rgba(0,0,0,0.5);
}

.control-value {
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #374151;
  min-width: 32px;
  text-align: right;
  flex-shrink: 0;
  transition: color 0.15s;
}

.control-value.nonzero { color: #5b6af0; }

/* ── 重置按钮 ── */
.btn-reset {
  margin-top: 12px;
  width: 100%;
  padding: 7px;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  color: #4b5563;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
}

.btn-reset:hover {
  background: rgba(255,255,255,0.07);
  color: #9ca3af;
  border-color: rgba(255,255,255,0.12);
}
</style>
