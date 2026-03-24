<template>
  <div class="mask-adjust-panel">
    <!-- 蒙版层管理 -->
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

    <!-- 当前激活层的独立调色 -->
    <div class="section" v-if="maskActive && maskActiveLayer">
      <div class="adj-header">
        <span class="adj-title">局部调整</span>
        <span class="adj-layer-name">{{ maskActiveLayer.name }}</span>
      </div>
      <MaskAdjustControls
        :modelValue="maskActiveLayer.adjustments"
        @update:modelValue="onAdjustmentsUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaskLayer, MaskType } from '../composables/useMaskState'
import type { MaskAdjustments } from '../composables/useMaskState'
import MaskControls from './MaskControls.vue'
import MaskAdjustControls from './MaskAdjustControls.vue'

const props = defineProps<{
  maskLayers: MaskLayer[]
  maskActiveLayerId: string
  maskActiveLayer: MaskLayer | null
  maskShowOverlay: boolean
  maskActive: boolean
}>()

const emit = defineEmits<{
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

const onAdjustmentsUpdate = (adj: MaskAdjustments) => {
  if (!props.maskActiveLayer) return
  emit('mask:updateLayer', { ...props.maskActiveLayer, adjustments: adj })
}
</script>

<style scoped>
.mask-adjust-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section {
  background: #24272d; border-radius: 10px; padding: 14px;
  border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.2s ease;
}
.section:hover { border-color: rgba(255,255,255,0.09); }

.adj-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.adj-title {
  font-size: 10px; font-weight: 700; color: #4b5563;
  text-transform: uppercase; letter-spacing: 1px;
}
.adj-layer-name {
  font-size: 11px; color: #5b6af0;
}
</style>
