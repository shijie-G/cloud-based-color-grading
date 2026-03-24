<template>
  <div class="mask-adjust-panel">
    <!-- 蒙版图层管理 -->
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
    <div v-if="maskActive && maskActiveLayer" class="section">
      <div class="layer-adj-header">
        <span class="section-label">局部调整</span>
        <span class="layer-name-tag">{{ maskActiveLayer.name }}</span>
        <button class="reset-btn" @click="resetLayerAdj" title="重置该层调色">↺</button>
      </div>

      <div class="sliders">
        <SliderRow
          v-for="item in sliderDefs" :key="item.key"
          :label="item.label"
          :min="item.min" :max="item.max"
          :value="layerAdj[item.key]"
          @update="(v: number) => updateAdj(item.key, v)"
        />
      </div>
    </div>

    <!-- 无激活层时的提示 -->
    <div v-else-if="maskActive && maskLayers.length === 0" class="section empty-hint">
      添加蒙版层后可对该区域独立调色
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MaskLayer, MaskType } from '../composables/useMaskState'
import type { AdjustmentValues } from '../component-interfaces'
import { defaultLayerAdjustments } from '../composables/useMaskState'
import MaskControls from './MaskControls.vue'
import SliderRow from './SliderRow.vue'

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
  'mask:updateLayerAdj':     [payload: { id: string; adjustments: AdjustmentValues }]
  'mask:invert':             []
  'mask:clear':              []
}>()

// 当前激活层的调色参数（响应式读取）
const layerAdj = computed<AdjustmentValues>(() =>
  props.maskActiveLayer?.adjustments ?? defaultLayerAdjustments()
)

const sliderDefs: { key: keyof AdjustmentValues; label: string; min: number; max: number }[] = [
  { key: 'brightness',  label: '曝光',   min: -150, max: 150 },
  { key: 'contrast',    label: '对比度', min: -100, max: 100 },
  { key: 'saturation',  label: '饱和度', min: -100, max: 100 },
  { key: 'vibrance',    label: '自然饱和度', min: -100, max: 100 },
  { key: 'temperature', label: '色温',   min: -100, max: 100 },
  { key: 'clarity',     label: '清晰度', min: -100, max: 100 },
  { key: 'hue',         label: '色相',   min: -180, max: 180 },
]

const updateAdj = (key: keyof AdjustmentValues, value: number) => {
  if (!props.maskActiveLayer) return
  emit('mask:updateLayerAdj', {
    id: props.maskActiveLayer.id,
    adjustments: { ...layerAdj.value, [key]: value },
  })
}

const resetLayerAdj = () => {
  if (!props.maskActiveLayer) return
  emit('mask:updateLayerAdj', {
    id: props.maskActiveLayer.id,
    adjustments: defaultLayerAdjustments(),
  })
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

.layer-adj-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px;
}
.section-label {
  font-size: 10px; font-weight: 700; color: #4b5563;
  text-transform: uppercase; letter-spacing: 1px;
}
.layer-name-tag {
  flex: 1; font-size: 11px; color: #a5b0ff;
  background: rgba(91,106,240,0.12); border-radius: 3px;
  padding: 1px 6px;
}
.reset-btn {
  background: none; border: none; color: #4b5563;
  cursor: pointer; font-size: 14px; padding: 0 2px;
  transition: color 0.15s; outline: none;
}
.reset-btn:hover { color: #9ca3af; }

.sliders { display: flex; flex-direction: column; gap: 10px; }

.empty-hint {
  font-size: 11px; color: #374151; text-align: center;
  padding: 20px 0;
}
</style>
