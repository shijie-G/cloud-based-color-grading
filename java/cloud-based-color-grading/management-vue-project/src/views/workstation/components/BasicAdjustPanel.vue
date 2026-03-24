<template>
  <div class="basic-adjust-panel">
    <div class="section">
      <RGBAnalysis :imageSrc="imageSrc ?? ''" :processedSrc="processedSrc ?? ''" />
    </div>
    <div class="section">
      <AdjustmentControls :adjustments="adjustments" @update:adjustments="$emit('update:adjustments', $event)" />
    </div>
    <div class="section">
      <HSLControls :hslAdjustments="hslAdjustments" @update:hslAdjustments="$emit('update:hslAdjustments', $event)" />
    </div>
    <div class="section section-actions">
      <ActionButtons
        :canSave="canSave"
        :canReset="canReset"
        @action:save="$emit('action:save', $event)"
        @action:reset="$emit('action:reset')"
        @action:selectImage="$emit('action:uploadImage', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'
import type { HSLAdjustments } from '../composables/useHSLState'
import RGBAnalysis from './RGBAnalysis.vue'
import AdjustmentControls from './AdjustmentControls.vue'
import HSLControls from './HSLControls.vue'
import ActionButtons from './ActionButtons.vue'

defineProps<{
  adjustments: AdjustmentValues
  hslAdjustments: HSLAdjustments
  canSave: boolean
  canReset: boolean
  imageSrc?: string
  processedSrc?: string
}>()

defineEmits<{
  'update:adjustments':    [adjustments: AdjustmentValues]
  'update:hslAdjustments': [hsl: HSLAdjustments]
  'action:uploadImage':    [file: File]
  'action:save':           [format: 'png' | 'jpeg']
  'action:reset':          []
}>()
</script>

<style scoped>
.basic-adjust-panel {
  display: flex; flex-direction: column; gap: 8px;
}
.section {
  background: #24272d; border-radius: 10px; padding: 14px;
  border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.2s ease;
}
.section:hover { border-color: rgba(255,255,255,0.09); }
.section-actions { background: transparent; border: none; padding: 4px 0 0; }
.section-actions:hover { border-color: transparent; }
</style>
