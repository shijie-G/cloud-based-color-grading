<template>
  <div class="mask-adjust-controls">

    <!-- 光线 -->
    <div class="group-label">光线</div>
    <div class="adjust-item" v-for="item in lightItems" :key="item.key">
      <div class="item-header">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :class="{ active: modelValue[item.key] !== 0 }">
          {{ fmt(modelValue[item.key], item.unit) }}
        </span>
        <button class="reset-btn" :style="{ visibility: modelValue[item.key] !== 0 ? 'visible' : 'hidden' }" @click="resetOne(item.key)">↺</button>
      </div>
      <input type="range" class="slider" :min="item.min" :max="item.max" :step="item.step ?? 1"
        :value="modelValue[item.key]" @input="onInput(item.key, $event)" />
      <div class="track-labels">
        <span>{{ item.min }}</span>
        <span class="center-tick">0</span>
        <span>{{ item.max }}</span>
      </div>
    </div>

    <!-- 色彩 -->
    <div class="group-label" style="margin-top:14px">色彩</div>
    <div class="adjust-item" v-for="item in colorItems" :key="item.key">
      <div class="item-header">
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value" :class="{ active: modelValue[item.key] !== 0 }">
          {{ fmt(modelValue[item.key], item.unit) }}
        </span>
        <button class="reset-btn" :style="{ visibility: modelValue[item.key] !== 0 ? 'visible' : 'hidden' }" @click="resetOne(item.key)">↺</button>
      </div>
      <input type="range" class="slider" :class="item.key" :min="item.min" :max="item.max" :step="item.step ?? 1"
        :value="modelValue[item.key]" @input="onInput(item.key, $event)" />
      <div class="track-labels">
        <span>{{ item.min }}</span>
        <span class="center-tick">0</span>
        <span>{{ item.max }}</span>
      </div>
    </div>

    <button class="reset-all-btn" v-if="hasAny" @click="resetAll">重置全部</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MaskAdjustments } from '../composables/useMaskState'

interface SliderDef {
  key: keyof MaskAdjustments
  label: string
  min: number
  max: number
  step?: number
  unit?: string
}

// PS 蒙版局部调整顺序：光线组 → 色彩组
const lightItems: SliderDef[] = [
  { key: 'exposure',   label: '曝光',     min: -5,   max: 5,   step: 0.05, unit: ' EV' },
  { key: 'contrast',   label: '对比度',   min: -100, max: 100 },
  { key: 'highlights', label: '高光',     min: -100, max: 100 },
  { key: 'shadows',    label: '阴影',     min: -100, max: 100 },
  { key: 'whites',     label: '白色色阶', min: -100, max: 100 },
  { key: 'blacks',     label: '黑色色阶', min: -100, max: 100 },
  { key: 'clarity',    label: '清晰度',   min: -100, max: 100 },
  { key: 'dehaze',     label: '去朦胧',   min: -100, max: 100 },
]

const colorItems: SliderDef[] = [
  { key: 'saturation', label: '饱和度', min: -100, max: 100 },
  { key: 'hue',        label: '色相',   min: -180, max: 180, unit: '°' },
]

const props = defineProps<{ modelValue: MaskAdjustments }>()
const emit  = defineEmits<{ 'update:modelValue': [v: MaskAdjustments] }>()

const hasAny = computed(() =>
  (Object.values(props.modelValue) as number[]).some(v => v !== 0)
)

const fmt = (v: number, unit = '') => {
  const prefix = v > 0 ? '+' : ''
  return `${prefix}${typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v}${unit}`
}

const onInput = (key: keyof MaskAdjustments, e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}

const resetOne = (key: keyof MaskAdjustments) => {
  emit('update:modelValue', { ...props.modelValue, [key]: 0 })
}

const resetAll = () => {
  const zero = Object.fromEntries(
    Object.keys(props.modelValue).map(k => [k, 0])
  ) as MaskAdjustments
  emit('update:modelValue', zero)
}
</script>

<style scoped>
.mask-adjust-controls {
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
  min-width: 52px;
  text-align: right;
  transition: color 0.15s;
}

.item-value.active { color: #5b6af0; }

.reset-btn {
  background: none; border: none; color: #4b5563;
  font-size: 12px; cursor: pointer; padding: 0;
  width: 16px; text-align: center; outline: none;
  transition: color 0.15s; flex-shrink: 0;
}
.reset-btn:hover { color: #9ca3af; }

.slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px; outline: none; cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px; height: 13px; border-radius: 50%;
  background: #5b6af0; border: 2px solid #1c1e22;
  box-shadow: 0 0 0 1px rgba(91,106,240,0.4);
  cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
}
.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px rgba(91,106,240,0.3);
  transform: scale(1.15);
}

/* 饱和度渐变轨道 */
.slider.saturation {
  background: linear-gradient(to right, #666, rgba(255,255,255,0.08) 30%, #f472b6);
}
/* 色相彩虹轨道 */
.slider.hue {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}

.track-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #374151; padding: 0 1px; margin-top: -1px;
}
.center-tick { color: #4b5563; }

.reset-all-btn {
  width: 100%; padding: 7px; margin-top: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px; color: #6b7280;
  font-size: 11px; cursor: pointer;
  transition: all 0.15s; outline: none;
}
.reset-all-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
</style>
