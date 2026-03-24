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
    <div class="section">
      <MaskControls
        :layers="maskLayers"
        :activeLayerId="maskActiveLayerId"
        :activeLayer="maskActiveLayer"
        :showOverlay="maskShowOverlay"
        :maskActive="maskActive"
        @toggle:active="$emit('mask:toggleActive')"
        @toggle:overlay="$emit('mask:toggleOverlay')"
        @layer:add="(t: MaskType) => $emit('mask:addLayer', t)"
        @layer:remove="(id: string) => $emit('mask:removeLayer', id)"
        @layer:select="(id: string) => $emit('mask:selectLayer', id)"
        @layer:toggleEnabled="(id: string) => $emit('mask:toggleLayerEnabled', id)"
        @layer:invert="$emit('mask:invert')"
        @layer:clear="$emit('mask:clear')"
        @update:layer="(l: MaskLayer) => $emit('mask:updateLayer', l)"
      />
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
import type { MaskLayer, MaskType } from '../composables/useMaskState'
import RGBAnalysis from './RGBAnalysis.vue'
import AdjustmentControls from './AdjustmentControls.vue'
import HSLControls from './HSLControls.vue'
import MaskControls from './MaskControls.vue'
import ActionButtons from './ActionButtons.vue'

defineProps<{
  adjustments: AdjustmentValues
  hslAdjustments: HSLAdjustments
  canSave: boolean
  canReset: boolean
  imageSrc?: string
  processedSrc?: string
  maskLayers: MaskLayer[]
  maskActiveLayerId: string
  maskActiveLayer: MaskLayer | null
  maskShowOverlay: boolean
  maskActive: boolean
}>()

defineEmits<{
  'update:adjustments':      [adjustments: AdjustmentValues]
  'update:hslAdjustments':   [hsl: HSLAdjustments]
  'action:uploadImage':      [file: File]
  'action:save':             [format: 'png' | 'jpeg']
  'action:reset':            []
  'mask:toggleActive':       []
  'mask:toggleOverlay':      []
  'mask:addLayer':           [type: MaskType]
  'mask:removeLayer':        [id: string]
  'mask:selectLayer':        [id: string]
  'mask:toggleLayerEnabled': [id: string]
  'mask:updateLayer':        [layer: MaskLayer]
  'mask:invert':             []
  'mask:clear':              []
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
