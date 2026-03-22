<template>
  <div class="hsl-controls">
    <div class="hsl-header">
      <span class="hsl-title">色相 / 饱和度 / 明度</span>
    </div>
    <div class="color-tabs">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="color-tab" :class="{ active: activeTab === tab.key }"
        :style="{ '--tab-color': tab.color }"
        @click="activeTab = tab.key"
      >
        <span class="tab-dot" :style="{ background: tab.color }"></span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
    <div class="hsl-sliders">
      <div class="hsl-row">
        <div class="row-header">
          <span class="row-label">色相 H</span>
          <span class="row-value" :class="{ active: currentRange.hue !== 0 }">{{ fmt(currentRange.hue, '°') }}</span>
          <button class="reset-btn" :style="{ visibility: currentRange.hue !== 0 ? 'visible' : 'hidden' }" @click="resetAxis('hue')">↺</button>
        </div>
        <input type="range" class="slider" :style="{ background: currentTab.hueGradient }"
          min="-180" max="180" :value="currentRange.hue" @input="onInput('hue', $event)" />
        <div class="track-labels"><span>-180°</span><span>0</span><span>+180°</span></div>
      </div>
      <div class="hsl-row">
        <div class="row-header">
          <span class="row-label">饱和度 S</span>
          <span class="row-value" :class="{ active: currentRange.saturation !== 0 }">{{ fmt(currentRange.saturation) }}</span>
          <button class="reset-btn" :style="{ visibility: currentRange.saturation !== 0 ? 'visible' : 'hidden' }" @click="resetAxis('saturation')">↺</button>
        </div>
        <input type="range" class="slider slider-sat" :style="{ '--c': currentTab.color }"
          min="-100" max="100" :value="currentRange.saturation" @input="onInput('saturation', $event)" />
        <div class="track-labels"><span>-100</span><span>0</span><span>+100</span></div>
      </div>
      <div class="hsl-row">
        <div class="row-header">
          <span class="row-label">明度 L</span>
          <span class="row-value" :class="{ active: currentRange.lightness !== 0 }">{{ fmt(currentRange.lightness) }}</span>
          <button class="reset-btn" :style="{ visibility: currentRange.lightness !== 0 ? 'visible' : 'hidden' }" @click="resetAxis('lightness')">↺</button>
        </div>
        <input type="range" class="slider slider-light"
          min="-100" max="100" :value="currentRange.lightness" @input="onInput('lightness', $event)" />
        <div class="track-labels"><span>-100</span><span>0</span><span>+100</span></div>
      </div>
    </div>
    <button class="reset-all-btn" v-if="hasAny" @click="resetAll">重置全部</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HSLAdjustments, HSLRange } from '../composables/useHSLState'

interface Props { hslAdjustments: HSLAdjustments }
interface Emits { 'update:hslAdjustments': [v: HSLAdjustments] }

const props = defineProps<Props>()
const emit  = defineEmits<Emits>()

type TabKey  = keyof HSLAdjustments
type AxisKey = keyof HSLRange

const tabs: { key: TabKey; label: string; color: string; hueGradient: string }[] = [
  { key: 'red',    label: '红', color: '#ef4444', hueGradient: 'linear-gradient(to right,#c026d3,#ef4444,#f97316)' },
  { key: 'orange', label: '橙', color: '#f97316', hueGradient: 'linear-gradient(to right,#ef4444,#f97316,#eab308)' },
  { key: 'yellow', label: '黄', color: '#eab308', hueGradient: 'linear-gradient(to right,#f97316,#eab308,#84cc16)' },
  { key: 'green',  label: '绿', color: '#22c55e', hueGradient: 'linear-gradient(to right,#84cc16,#22c55e,#06b6d4)' },
  { key: 'cyan',   label: '青', color: '#06b6d4', hueGradient: 'linear-gradient(to right,#22c55e,#06b6d4,#3b82f6)' },
  { key: 'blue',   label: '蓝', color: '#3b82f6', hueGradient: 'linear-gradient(to right,#06b6d4,#3b82f6,#a855f7)' },
  { key: 'purple', label: '紫', color: '#a855f7', hueGradient: 'linear-gradient(to right,#3b82f6,#a855f7,#ec4899)' },
]

const activeTab    = ref<TabKey>('red')
const currentTab   = computed(() => tabs.find(t => t.key === activeTab.value)!)
const currentRange = computed(() => props.hslAdjustments[activeTab.value])

const hasAny = computed(() =>
  (Object.values(props.hslAdjustments) as HSLRange[]).some(
    r => r.hue !== 0 || r.saturation !== 0 || r.lightness !== 0
  )
)

const fmt = (v: number, unit = '') => `${v > 0 ? '+' : ''}${v}${unit}`

const emitUpdate = (patch: Partial<HSLRange>) =>
  emit('update:hslAdjustments', {
    ...props.hslAdjustments,
    [activeTab.value]: { ...currentRange.value, ...patch },
  } as HSLAdjustments)

const onInput   = (key: AxisKey, e: Event) => emitUpdate({ [key]: Number((e.target as HTMLInputElement).value) })
const resetAxis = (key: AxisKey) => emitUpdate({ [key]: 0 })

const resetAll = () => {
  const blank: HSLRange = { hue: 0, saturation: 0, lightness: 0 }
  const next = {} as HSLAdjustments
  ;(Object.keys(props.hslAdjustments) as TabKey[]).forEach(k => { next[k] = { ...blank } })
  emit('update:hslAdjustments', next)
}
</script>

<style scoped>
.hsl-controls { display: flex; flex-direction: column; gap: 10px; }
.hsl-header { padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.hsl-title { font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 1px; }
.color-tabs { display: flex; flex-wrap: wrap; gap: 4px; }
.color-tab {
  display: flex; align-items: center; gap: 4px; padding: 3px 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px; cursor: pointer; transition: all 0.15s; outline: none;
}
.color-tab:hover { background: rgba(255,255,255,0.08); }
.color-tab.active { background: rgba(255,255,255,0.1); border-color: var(--tab-color); box-shadow: 0 0 0 1px var(--tab-color) inset; }
.tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tab-label { font-size: 11px; color: #9ca3af; }
.color-tab.active .tab-label { color: #e2e4e9; }
.hsl-sliders { display: flex; flex-direction: column; gap: 8px; }
.hsl-row { display: flex; flex-direction: column; gap: 3px; }
.row-header { display: flex; align-items: center; gap: 6px; }
.row-label { font-size: 12px; color: #9ca3af; flex: 1; }
.row-value { font-size: 11px; font-family: 'Courier New', monospace; color: #4b5563; min-width: 40px; text-align: right; transition: color 0.15s; }
.row-value.active { color: #5b6af0; }
.reset-btn { background: none; border: none; color: #4b5563; font-size: 12px; cursor: pointer; padding: 0; width: 16px; text-align: center; outline: none; transition: color 0.15s; flex-shrink: 0; }
.reset-btn:hover { color: #9ca3af; }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; border-radius: 2px; outline: none; cursor: pointer; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 2px solid #1c1e22; box-shadow: 0 0 0 1px rgba(255,255,255,0.25); cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
.slider::-webkit-slider-thumb:hover { box-shadow: 0 0 0 3px rgba(255,255,255,0.15); transform: scale(1.15); }
.slider-sat { background: linear-gradient(to right, #555, var(--c, #5b6af0)) !important; }
.slider-light { background: linear-gradient(to right, #000, #888 50%, #fff) !important; }
.track-labels { display: flex; justify-content: space-between; font-size: 9px; color: #374151; padding: 0 1px; }
.reset-all-btn { width: 100%; padding: 7px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; color: #6b7280; font-size: 11px; cursor: pointer; transition: all 0.15s; outline: none; }
.reset-all-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
</style>
