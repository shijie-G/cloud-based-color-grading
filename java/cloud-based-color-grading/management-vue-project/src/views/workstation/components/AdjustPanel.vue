<template>
  <div class="adjust-panel" :style="{ width: rightPanelWidth + '%' }">
    <div class="panel-header">
      <div class="header-content">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 class="panel-title">图片调整</h2>
      </div>
    </div>

    <div class="panel-body">
      <!-- 左侧：内容区 -->
      <div class="panel-content">
        <BasicAdjustPanel
          v-if="activeTab === 'basic'"
          :adjustments="adjustments"
          :hslAdjustments="hslAdjustments"
          :canSave="canSave"
          :canReset="canReset"
          :imageSrc="imageSrc"
          :processedSrc="processedSrc"
          @update:adjustments="$emit('update:adjustments', $event)"
          @update:hslAdjustments="$emit('update:hslAdjustments', $event)"
          @action:uploadImage="$emit('action:uploadImage', $event)"
          @action:save="$emit('action:save', $event)"
          @action:reset="$emit('action:reset')"
        />
        <MaskAdjustPanel
          v-else-if="activeTab === 'mask'"
          :maskLayers="maskLayers"
          :maskActiveLayerId="maskActiveLayerId"
          :maskActiveLayer="maskActiveLayer"
          :maskShowOverlay="maskShowOverlay"
          :maskActive="maskActive"
          @mask:toggleActive="$emit('mask:toggleActive')"
          @mask:toggleOverlay="$emit('mask:toggleOverlay')"
          @mask:addLayer="$emit('mask:addLayer', $event)"
          @mask:removeLayer="$emit('mask:removeLayer', $event)"
          @mask:selectLayer="$emit('mask:selectLayer', $event)"
          @mask:toggleLayerEnabled="$emit('mask:toggleLayerEnabled', $event)"
          @mask:updateLayer="$emit('mask:updateLayer', $event)"
          @mask:invert="$emit('mask:invert')"
          @mask:clear="$emit('mask:clear')"
          @mask:updateLayerAdj="$emit('mask:updateLayerAdj', $event)"
        />
      </div>

      <!-- 右侧导航栏 -->
      <div class="side-rail">
        <div class="rail-item" :class="{ active: activeTab === 'basic' }" title="基础调色" @click="activeTab = 'basic'">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="rail-item" :class="{ active: activeTab === 'mask' }" title="蒙版" @click="activeTab = 'mask'">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 2"/>
            <rect x="3" y="3" width="18" height="9" rx="3" fill="currentColor" fill-opacity="0.25"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdjustmentValues } from '../component-interfaces'
import type { HSLAdjustments } from '../composables/useHSLState'
import type { MaskLayer, MaskType } from '../composables/useMaskState'
import { ref } from 'vue'
import BasicAdjustPanel from './BasicAdjustPanel.vue'
import MaskAdjustPanel from './MaskAdjustPanel.vue'

interface AdjustPanelProps {
  rightPanelWidth: number
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
}

interface AdjustPanelEvents {
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
  'mask:updateLayerAdj':     [payload: { id: string; adjustments: AdjustmentValues }]
  'mask:invert':             []
  'mask:clear':              []
}

const props = defineProps<AdjustPanelProps>()
const emit  = defineEmits<AdjustPanelEvents>()

const activeTab = ref<'basic' | 'mask'>('basic')

</script>

<style scoped>
.adjust-panel {
  height: 100%;
  background: #1c1e22;
  display: flex;
  flex-direction: column;
  transition: width 0.1s ease;
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-header {
  padding: 16px 18px;
  background: #1c1e22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.header-content { display: flex; align-items: center; gap: 8px; }

.header-icon { width: 16px; height: 16px; color: #5b6af0; flex-shrink: 0; }

.panel-title {
  font-size: 13px; font-weight: 600; margin: 0;
  color: #e2e4e9; letter-spacing: 0.5px; text-transform: uppercase;
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.panel-content {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
  scrollbar-width: none;
}

.panel-content::-webkit-scrollbar { display: none; }

.side-rail {
  width: 3vh;
  flex-shrink: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  background: #1c1e22;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  gap: 4px;
}

.rail-item {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}
.rail-item svg { width: 14px; height: 14px; }
.rail-item:hover { color: #9ca3af; background: rgba(255,255,255,0.06); }
.rail-item.active { color: #5b6af0; background: rgba(91,106,240,0.12); }

.section {
  background: #24272d; border-radius: 10px; padding: 14px;
  border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.2s ease;
}
.section:hover { border-color: rgba(255,255,255,0.09); }

.section-actions { background: transparent; border: none; padding: 4px 0 0; }
.section-actions:hover { border-color: transparent; }
</style>
