<template>
  <div class="adjust-item">
    <div class="item-header">
      <span class="item-label">{{ label }}</span>
      <span class="item-value" :class="{ active: value !== 0 }">{{ formatted }}</span>
      <button class="reset-btn" :style="{ visibility: value !== 0 ? 'visible' : 'hidden' }" @click="$emit('update', 0)">↺</button>
    </div>
    <input
      type="range" class="slider"
      :min="min" :max="max" :value="value"
      @input="e => $emit('update', Number((e.target as HTMLInputElement).value))"
    />
    <div class="track-labels">
      <span>{{ min }}</span>
      <span class="center-tick">0</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  min: number
  max: number
  value: number
  unit?: string
}>()

defineEmits<{ update: [value: number] }>()

const formatted = computed(() => {
  const prefix = props.value > 0 ? '+' : ''
  return `${prefix}${props.value}${props.unit ?? ''}`
})
</script>

<style scoped>
.adjust-item { display: flex; flex-direction: column; gap: 3px; }
.item-header { display: flex; align-items: center; gap: 6px; }
.item-label { font-size: 12px; color: #9ca3af; flex: 1; }
.item-value {
  font-size: 11px; font-family: 'Courier New', monospace;
  color: #4b5563; min-width: 44px; text-align: right; transition: color 0.15s;
}
.item-value.active { color: #5b6af0; }
.reset-btn {
  background: none; border: none; color: #4b5563; font-size: 12px;
  cursor: pointer; padding: 0; width: 16px; text-align: center;
  outline: none; transition: color 0.15s; flex-shrink: 0;
}
.reset-btn:hover { color: #9ca3af; }
.slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 3px;
  background: rgba(255,255,255,0.08); border-radius: 2px;
  outline: none; cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px;
  border-radius: 50%; background: #5b6af0;
  border: 2px solid #1c1e22; cursor: pointer;
  box-shadow: 0 0 0 1px rgba(91,106,240,0.4);
  transition: box-shadow 0.15s, transform 0.15s;
}
.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px rgba(91,106,240,0.3); transform: scale(1.15);
}
.track-labels {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 9px; color: #374151; padding: 0 1px; margin-top: -1px;
}
.center-tick { color: #4b5563; }
</style>
