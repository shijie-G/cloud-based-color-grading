<template>
  <div class="grid-panel">

    <!-- 快捷预设 -->
    <div class="section">
      <div class="section-title">快捷预设</div>
      <div class="preset-row">
        <button class="preset-btn" @click="apply('thirds')">三等分</button>
        <button class="preset-btn" @click="apply('ninths')">九宫格</button>
        <button class="preset-btn" @click="apply('golden')">黄金比</button>
      </div>
    </div>

    <!-- 网格数量 -->
    <div class="section">
      <div class="section-title">网格数量</div>
      <div class="slider-row">
        <span class="slider-label">列数</span>
        <input type="range" min="1" max="20" :value="settings.cols" @input="settings.cols = +($event.target as HTMLInputElement).value" />
        <span class="slider-val">{{ settings.cols }}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">行数</span>
        <input type="range" min="1" max="20" :value="settings.rows" @input="settings.rows = +($event.target as HTMLInputElement).value" />
        <span class="slider-val">{{ settings.rows }}</span>
      </div>
    </div>

    <!-- 样式 -->
    <div class="section">
      <div class="section-title">线条样式</div>
      <div class="color-row">
        <span class="slider-label">颜色</span>
        <input type="color" :value="settings.color" @input="settings.color = ($event.target as HTMLInputElement).value" class="color-input" />
        <span class="slider-val">{{ settings.color }}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">透明度</span>
        <input type="range" min="0" max="1" step="0.05" :value="settings.opacity" @input="settings.opacity = +($event.target as HTMLInputElement).value" />
        <span class="slider-val">{{ Math.round(settings.opacity * 100) }}%</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">线宽</span>
        <input type="range" min="1" max="5" step="0.5" :value="settings.lineWidth" @input="settings.lineWidth = +($event.target as HTMLInputElement).value" />
        <span class="slider-val">{{ settings.lineWidth }}px</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { GridSettings } from '../composables/useGridState'

const props = defineProps<{ settings: GridSettings }>()
const emit  = defineEmits<{ 'preset': [p: 'thirds' | 'ninths' | 'golden'] }>()

const apply = (p: 'thirds' | 'ninths' | 'golden') => emit('preset', p)
</script>

<style scoped>
.grid-panel { display: flex; flex-direction: column; gap: 8px; }

.section {
  background: #24272d; border-radius: 10px; padding: 14px;
  border: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column; gap: 10px;
}
.section-title {
  font-size: 10px; font-weight: 700; color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.6px;
}

.row-between { display: flex; align-items: center; justify-content: space-between; }
.label { font-size: 12px; color: #9ca3af; }

.toggle-btn {
  padding: 4px 12px; font-size: 11px; border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: #6b7280;
  cursor: pointer; outline: none; transition: all 0.15s;
}
.toggle-btn.active {
  background: rgba(91,106,240,0.2); border-color: rgba(91,106,240,0.4); color: #a5b0ff;
}

.preset-row { display: flex; gap: 6px; }
.preset-btn {
  flex: 1; padding: 6px 4px; font-size: 11px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: #9ca3af;
  cursor: pointer; outline: none; transition: all 0.15s;
}
.preset-btn:hover { background: rgba(91,106,240,0.12); border-color: rgba(91,106,240,0.3); color: #c7ceff; }

.slider-row, .color-row {
  display: flex; align-items: center; gap: 8px;
}
.slider-label { font-size: 11px; color: #6b7280; width: 36px; flex-shrink: 0; }
.slider-val { font-size: 10px; font-family: 'Courier New', monospace; color: #5b6af0; width: 36px; text-align: right; flex-shrink: 0; }

input[type="range"] {
  flex: 1; -webkit-appearance: none; appearance: none;
  height: 2px; background: rgba(255,255,255,0.08); border-radius: 1px; outline: none; cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
  background: #e5e7eb; border: 1.5px solid rgba(0,0,0,0.4);
  box-shadow: 0 1px 3px rgba(0,0,0,0.5); cursor: pointer;
}

.color-input {
  width: 28px; height: 22px; border: none; border-radius: 4px;
  cursor: pointer; padding: 0; background: none; outline: none;
}
</style>
