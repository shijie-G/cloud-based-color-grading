<template>
  <div class="adjustment-controls">

    <!-- 基础 -->
    <div class="group-label">基础</div>
    <div class="adjust-item" v-for="item in basicItems" :key="item.key">
      <div class="item-header">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :class="{ active: adjustments[item.key] !== 0 }">
          {{ fmtVal(adjustments[item.key], item) }}
        </span>
        <button class="reset-btn" :style="{ visibility: adjustments[item.key] !== 0 ? 'visible' : 'hidden' }" @click="resetOne(item.key)">↺</button>
      </div>
      <input type="range" class="slider" :min="item.min" :max="item.max" :value="adjustments[item.key]" @input="onInput(item.key, $event)" @change="emit('sliderEnd')" />
      <div class="track-labels">
        <span>{{ item.min }}</span>
        <span class="center-tick">0</span>
        <span>{{ item.max }}</span>
      </div>
    </div>

    <!-- 色彩 -->
    <div class="group-label" style="margin-top:16px">色彩</div>
    <div class="adjust-item" v-for="item in colorItems" :key="item.key">
      <div class="item-header">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :class="{ active: adjustments[item.key] !== 0 }">
          {{ fmtVal(adjustments[item.key], item) }}
        </span>
        <button class="reset-btn" :style="{ visibility: adjustments[item.key] !== 0 ? 'visible' : 'hidden' }" @click="resetOne(item.key)">↺</button>
      </div>
      <input type="range" class="slider" :class="item.key" :min="item.min" :max="item.max" :value="adjustments[item.key]" @input="onInput(item.key, $event)" @change="emit('sliderEnd')" />
      <div class="track-labels">
        <span>{{ item.min }}</span>
        <span class="center-tick">0</span>
        <span>{{ item.max }}</span>
      </div>
    </div>

    <!-- 细节 -->
    <div class="group-label" style="margin-top:16px">细节</div>
    <div class="adjust-item" v-for="item in detailItems" :key="item.key">
      <div class="item-header">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :class="{ active: adjustments[item.key] !== 0 }">
          {{ fmtVal(adjustments[item.key], item) }}
        </span>
        <button class="reset-btn" :style="{ visibility: adjustments[item.key] !== 0 ? 'visible' : 'hidden' }" @click="resetOne(item.key)">↺</button>
      </div>
      <input type="range" class="slider" :class="item.key" :min="item.min" :max="item.max" :value="adjustments[item.key]" @input="onInput(item.key, $event)" @change="emit('sliderEnd')" />
      <div class="track-labels">
        <span>{{ item.min }}</span>
        <span class="center-tick">0</span>
        <span>{{ item.max }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'

interface SliderDef {
  key: keyof AdjustmentValues
  label: string
  min: number
  max: number
  unit?: string
}

const basicItems: SliderDef[] = [
  { key: 'brightness', label: '亮度',    min: -150,  max: 150 },
  { key: 'contrast',   label: '对比度',  min: -100,  max: 100 },
  { key: 'highlights', label: '高光',    min: -100,  max: 100 },
  { key: 'shadows',    label: '阴影',    min: -100,  max: 100 },
  { key: 'whites',     label: '白色',    min: -100,  max: 100 },
  { key: 'blacks',     label: '黑色',    min: -100,  max: 100 },
  { key: 'clarity',    label: '清晰度',  min: -100,  max: 100 },
]

const colorItems: SliderDef[] = [
  { key: 'saturation',  label: '饱和度',     min: -100, max: 100 },
  { key: 'vibrance',    label: '自然饱和度',  min: -100, max: 100 },
  { key: 'hue',         label: '色相',       min: -180, max: 180, unit: '°' },
  { key: 'temperature', label: '色温',       min: -100, max: 100 },
  { key: 'tint',        label: '色调',       min: -100, max: 100 },
]

const detailItems: SliderDef[] = [
  { key: 'clarity',  label: '清晰度', min: -100, max: 100 },
  { key: 'dehaze',   label: '去朦胧', min: -100, max: 100 },
]

interface Props { adjustments: AdjustmentValues }
interface Emits {
  'update:adjustments': [adjustments: AdjustmentValues]
  'sliderEnd': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fmtVal = (val: number, item: SliderDef): string => {
  const prefix = val > 0 ? '+' : ''
  if (item.unit) return `${prefix}${val}${item.unit}`
  return `${prefix}${val}`
}

const onInput = (key: keyof AdjustmentValues, e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:adjustments', { ...props.adjustments, [key]: val })
}

const resetOne = (key: keyof AdjustmentValues) => {
  emit('update:adjustments', { ...props.adjustments, [key]: 0 })
  emit('sliderEnd')
}
</script>

<style scoped>
.adjustment-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 10px;
  font-weight: 700;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.adjust-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-label {
  font-size: 12px;
  color: #9ca3af;
  flex: 1;
}

.item-value {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: #4b5563;
  min-width: 44px;
  text-align: right;
  transition: color 0.15s;
}

.item-value.active {
  color: #5b6af0;
}

.reset-btn {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  width: 16px;
  text-align: center;
  outline: none;
  transition: color 0.15s;
  flex-shrink: 0;
}

.reset-btn:hover { color: #9ca3af; }

/* 滑块 */
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #5b6af0;
  border: 2px solid #1c1e22;
  box-shadow: 0 0 0 1px rgba(91,106,240,0.4);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}

.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px rgba(91,106,240,0.3);
  transform: scale(1.15);
}

/* 色温渐变轨道 */
.slider.temperature {
  background: linear-gradient(to right, #7eb8f7, rgba(255,255,255,0.08) 50%, #f5a623);
}

/* 饱和度渐变轨道 */
.slider.saturation {
  background: linear-gradient(to right, #666, rgba(255,255,255,0.08) 30%, #f472b6);
}

/* 色相彩虹轨道 */
.slider.hue {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}

/* 色调：绿 → 洋红 */
.slider.tint {
  background: linear-gradient(to right, #22c55e, rgba(255,255,255,0.08) 50%, #ec4899);
}

/* 去朦胧：柔化 → 清晰 */
.slider.dehaze {
  background: linear-gradient(to right, #94a3b8, rgba(255,255,255,0.08) 50%, #1e40af);
}

/* 刻度标签 */
.track-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  color: #374151;
  padding: 0 1px;
  margin-top: -1px;
}

.center-tick {
  color: #4b5563;
}
</style>
