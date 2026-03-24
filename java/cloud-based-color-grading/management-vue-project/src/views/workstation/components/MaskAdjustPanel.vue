<template>
  <div class="mask-panel">

    <!-- 顶部区域 -->
    <div class="header-area">
      <div class="header-row">
        <span class="panel-title">蒙版</span>
        <button
          class="overlay-btn"
          :class="{ active: maskShowOverlay }"
          @click="$emit('mask:toggleOverlay')"
        >预览</button>
      </div>
      <div class="add-row">
        <button class="add-mask-btn" @click="$emit('mask:addLayer', 'linear')">
          <span class="btn-plus">+</span> 线性渐变
        </button>
        <button class="add-mask-btn" @click="$emit('mask:addLayer', 'radial')">
          <span class="btn-plus">+</span> 径向渐变
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="maskLayers.length === 0" class="empty-state">
      <p>添加蒙版层后可对局部区域独立调色</p>
    </div>

    <template v-else>
      <!-- 蒙版层列表 -->
      <div class="layer-list">
        <div
          v-for="layer in maskLayers" :key="layer.id"
          class="layer-card"
          :class="{ selected: layer.id === maskActiveLayerId, disabled: !layer.enabled }"
          @click="$emit('mask:selectLayer', layer.id === maskActiveLayerId ? '' : layer.id)"
        >
          <!-- 蒙版缩略图 -->
          <div class="layer-thumb">
            <svg v-if="layer.type === 'linear'" viewBox="0 0 36 28" fill="none" class="thumb-svg">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#fff"/>
                  <stop offset="100%" stop-color="#222"/>
                </linearGradient>
              </defs>
              <rect width="36" height="28" rx="3" fill="url(#lg)"/>
            </svg>
            <svg v-else viewBox="0 0 36 28" fill="none" class="thumb-svg">
              <defs>
                <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#fff"/>
                  <stop offset="100%" stop-color="#222"/>
                </radialGradient>
              </defs>
              <rect width="36" height="28" rx="3" fill="#222"/>
              <ellipse cx="18" cy="14" rx="14" ry="11" fill="url(#rg)"/>
            </svg>
            <span v-if="layer.type === 'radial' && layer.radial.invert" class="invert-badge">反</span>
          </div>

          <!-- 层信息 -->
          <div class="layer-info">
            <span class="layer-name">{{ layer.name }}</span>
            <span class="layer-type-tag">{{ layer.type === 'linear' ? '线性' : '径向' }}</span>
          </div>

          <!-- 右侧操作 -->
          <div class="layer-ops" @click.stop>
            <button
              class="op-btn vis-btn"
              :class="{ on: layer.enabled }"
              @click="$emit('mask:toggleLayerEnabled', layer.id)"
            >{{ layer.enabled ? '显' : '隐' }}</button>
            <button
              class="op-btn del-btn"
              @click="$emit('mask:removeLayer', layer.id)"
            >删</button>
          </div>
        </div>
      </div>

      <!-- 选中层详情 -->
      <div v-if="maskActiveLayer" class="layer-detail">

        <!-- 形状参数区 -->
        <div class="detail-section">
          <div class="detail-section-title">形状</div>

          <div class="hint-row">
            {{ maskActiveLayer.type === 'linear' ? '拖拽图片设置渐变方向' : '拖拽图片设置椭圆范围' }}
          </div>

          <div class="param-row">
            <span class="param-label">羽化</span>
            <div class="param-slider-wrap">
              <input type="range" class="ps-slider" min="0" max="1" step="0.01"
                :value="maskActiveLayer.type === 'linear' ? maskActiveLayer.linear.feather : maskActiveLayer.radial.feather"
                @input="e => updateFeather(+(e.target as HTMLInputElement).value)"
              />
            </div>
            <span class="param-value">{{ featherPct }}</span>
          </div>

          <div v-if="maskActiveLayer.type === 'radial'" class="param-row">
            <span class="param-label">区域</span>
            <div class="seg-ctrl">
              <button :class="{ on: !maskActiveLayer.radial.invert }" @click="setInvert(false)">内部</button>
              <button :class="{ on: maskActiveLayer.radial.invert  }" @click="setInvert(true)">外部</button>
            </div>
          </div>

          <div class="action-row">
            <button class="ps-action-btn" @click="$emit('mask:invert')">反转</button>
            <button class="ps-action-btn danger" @click="$emit('mask:clear')">清除</button>
          </div>
        </div>

        <!-- 局部调色区 -->
        <div class="detail-section">
          <div class="detail-section-title">
            局部调整
            <button v-if="hasLayerAdj" class="reset-all-btn" @click="resetLayerAdj">全部重置</button>
          </div>

          <div class="adj-sliders">
            <div v-for="item in sliderDefs" :key="item.key" class="adj-row">
              <span class="adj-label">{{ item.label }}</span>
              <div class="adj-track-wrap">
                <div class="adj-track">
                  <div
                    v-if="layerAdj[item.key] < 0"
                    class="adj-fill neg"
                    :style="{ width: Math.abs(layerAdj[item.key]) / Math.abs(item.min) * 50 + '%', right: '50%' }"
                  />
                  <div
                    v-if="layerAdj[item.key] > 0"
                    class="adj-fill pos"
                    :style="{ width: layerAdj[item.key] / item.max * 50 + '%', left: '50%' }"
                  />
                  <div class="adj-center-line"/>
                  <input
                    type="range" class="ps-slider adj-input"
                    :min="item.min" :max="item.max" :value="layerAdj[item.key]"
                    @mousedown="$emit('mask:adjSliderStart')"
                    @touchstart="$emit('mask:adjSliderStart')"
                    @mouseup="$emit('mask:adjSliderEnd')"
                    @touchend="$emit('mask:adjSliderEnd')"
                    @input="e => updateAdj(item.key, +(e.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
              <span class="adj-value" :class="{ nonzero: layerAdj[item.key] !== 0 }">
                {{ fmtAdj(layerAdj[item.key]) }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MaskLayer, MaskType } from '../composables/useMaskState'
import type { AdjustmentValues } from '../component-interfaces'
import { defaultLayerAdjustments } from '../composables/useMaskState'

const props = defineProps<{
  maskLayers: MaskLayer[]
  maskActiveLayerId: string
  maskActiveLayer: MaskLayer | null
  maskShowOverlay: boolean
}>()

const emit = defineEmits<{
  'mask:toggleOverlay':      []
  'mask:addLayer':           [type: MaskType]
  'mask:removeLayer':        [id: string]
  'mask:selectLayer':        [id: string]
  'mask:toggleLayerEnabled': [id: string]
  'mask:updateLayer':        [layer: MaskLayer]
  'mask:updateLayerAdj':     [payload: { id: string; adjustments: AdjustmentValues }]
  'mask:adjSliderStart':     []
  'mask:adjSliderEnd':       []
  'mask:invert':             []
  'mask:clear':              []
}>()

const layerAdj = computed<AdjustmentValues>(() =>
  props.maskActiveLayer?.adjustments ?? defaultLayerAdjustments()
)

const hasLayerAdj = computed(() =>
  Object.values(layerAdj.value).some(v => v !== 0)
)

const featherPct = computed(() => {
  if (!props.maskActiveLayer) return '0%'
  const v = props.maskActiveLayer.type === 'linear'
    ? props.maskActiveLayer.linear.feather
    : props.maskActiveLayer.radial.feather
  return `${Math.round(v * 100)}%`
})

const sliderDefs: { key: keyof AdjustmentValues; label: string; min: number; max: number }[] = [
  { key: 'brightness',  label: '曝光',       min: -150, max: 150 },
  { key: 'contrast',    label: '对比度',     min: -100, max: 100 },
  { key: 'saturation',  label: '饱和度',     min: -100, max: 100 },
  { key: 'vibrance',    label: '自然饱和度', min: -100, max: 100 },
  { key: 'temperature', label: '色温',       min: -100, max: 100 },
  { key: 'clarity',     label: '清晰度',     min: -100, max: 100 },
  { key: 'hue',         label: '色相',       min: -180, max: 180 },
]

const fmtAdj = (v: number) => (v > 0 ? `+${v}` : `${v}`)

const updateFeather = (v: number) => {
  if (!props.maskActiveLayer) return
  const l = props.maskActiveLayer
  emit('mask:updateLayer', l.type === 'linear'
    ? { ...l, linear: { ...l.linear, feather: v } }
    : { ...l, radial: { ...l.radial, feather: v } }
  )
}

const setInvert = (v: boolean) => {
  if (!props.maskActiveLayer) return
  emit('mask:updateLayer', {
    ...props.maskActiveLayer,
    radial: { ...props.maskActiveLayer.radial, invert: v },
  })
}

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
.mask-panel {
  display: flex;
  flex-direction: column;
  color: #c9cdd4;
}

/* 顶部区域 */
.header-area {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-title {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 添加蒙版按钮行 */
.add-row {
  display: flex;
  gap: 6px;
}
.add-mask-btn {
  flex: 1;
  padding: 5px 6px;
  font-size: 11px;
  border-radius: 5px;
  border: 1px dashed rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.03);
  color: #9ca3af;
  cursor: pointer;
  outline: none;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.add-mask-btn:hover {
  background: rgba(91,106,240,0.12);
  border-color: rgba(91,106,240,0.4);
  color: #c7ceff;
}
.btn-plus {
  font-size: 14px;
  line-height: 1;
  font-weight: 300;
}
.overlay-btn {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #6b7280;
  cursor: pointer;
  outline: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.overlay-btn:hover { color: #d1d5db; background: rgba(255,255,255,0.08); }
.overlay-btn.active {
  background: rgba(91,106,240,0.2);
  border-color: rgba(91,106,240,0.4);
  color: #a5b0ff;
}

/* 空状态 */
.empty-state {
  padding: 28px 16px;
  text-align: center;
  color: #4b5563;
  font-size: 11px;
}

/* 层列表 */
.layer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
}
.layer-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  transition: all 0.12s;
}
.layer-card:hover { background: rgba(255,255,255,0.06); }
.layer-card.selected {
  background: rgba(91,106,240,0.1);
  border-color: rgba(91,106,240,0.3);
}
.layer-card.disabled { opacity: 0.4; }

.layer-thumb {
  width: 36px; height: 28px;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.08);
  position: relative;
}
.thumb-svg { width: 100%; height: 100%; display: block; }
.invert-badge {
  position: absolute; bottom: 1px; right: 2px;
  font-size: 8px; color: #f59e0b; line-height: 1;
}

.layer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.layer-name {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layer-card.selected .layer-name { color: #c7ceff; }
.layer-type-tag { font-size: 9px; color: #4b5563; }

.layer-ops { display: flex; gap: 3px; flex-shrink: 0; }
.op-btn {
  padding: 2px 7px;
  font-size: 10px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  outline: none;
  transition: all 0.12s;
}
.vis-btn { color: #4b5563; }
.vis-btn.on { color: #a5b0ff; border-color: rgba(91,106,240,0.3); background: rgba(91,106,240,0.1); }
.vis-btn:hover { color: #9ca3af; }
.del-btn { color: #4b5563; }
.del-btn:hover { color: #f87171; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }

/* 选中层详情 */
.layer-detail {
  margin-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.detail-section {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-section-title {
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.reset-all-btn {
  margin-left: auto;
  font-size: 10px; color: #4b5563;
  background: none; border: none; cursor: pointer;
  outline: none; padding: 0; transition: color 0.15s;
}
.reset-all-btn:hover { color: #9ca3af; }

.hint-row { font-size: 10px; color: #4b5563; text-align: center; }

.param-row { display: flex; align-items: center; gap: 8px; }
.param-label { font-size: 11px; color: #6b7280; width: 28px; flex-shrink: 0; }
.param-slider-wrap { flex: 1; }
.param-value {
  font-size: 10px; font-family: 'Courier New', monospace;
  color: #5b6af0; width: 30px; text-align: right; flex-shrink: 0;
}

.seg-ctrl { display: flex; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
.seg-ctrl button {
  flex: 1; padding: 4px 10px; font-size: 11px;
  background: rgba(255,255,255,0.03); border: none;
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.12s;
}
.seg-ctrl button + button { border-left: 1px solid rgba(255,255,255,0.08); }
.seg-ctrl button.on { background: rgba(91,106,240,0.2); color: #a5b0ff; }

.action-row { display: flex; gap: 6px; }
.ps-action-btn {
  flex: 1; padding: 6px 8px; font-size: 11px; border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #9ca3af; cursor: pointer; outline: none; transition: all 0.15s;
}
.ps-action-btn:hover { background: rgba(255,255,255,0.1); color: #e5e7eb; }
.ps-action-btn.danger:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171; }

/* 局部调色滑块 */
.adj-sliders { display: flex; flex-direction: column; gap: 6px; }
.adj-row { display: flex; align-items: center; gap: 6px; }
.adj-label { font-size: 11px; color: #6b7280; width: 56px; flex-shrink: 0; }
.adj-track-wrap { flex: 1; }
.adj-track {
  position: relative; height: 18px;
  display: flex; align-items: center;
}
.adj-track::before {
  content: ''; position: absolute; left: 0; right: 0;
  height: 2px; background: rgba(255,255,255,0.07); border-radius: 1px;
}
.adj-center-line {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 1px; height: 6px;
  background: rgba(255,255,255,0.2); z-index: 1; pointer-events: none;
}
.adj-fill {
  position: absolute; height: 2px; top: 50%;
  transform: translateY(-50%); border-radius: 1px;
  pointer-events: none; z-index: 1;
}
.adj-fill.pos { background: #5b6af0; }
.adj-fill.neg { background: #f59e0b; }
.adj-input { position: absolute; left: 0; right: 0; width: 100%; z-index: 2; }
.adj-value {
  font-size: 10px; font-family: 'Courier New', monospace;
  color: #374151; width: 32px; text-align: right; flex-shrink: 0; transition: color 0.15s;
}
.adj-value.nonzero { color: #5b6af0; }

/* 通用滑块 */
.ps-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 2px; background: transparent;
  outline: none; cursor: pointer; border-radius: 1px;
}
.ps-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px;
  border-radius: 50%; background: #e5e7eb;
  border: 1.5px solid rgba(0,0,0,0.4);
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;
}
.ps-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(91,106,240,0.25), 0 1px 3px rgba(0,0,0,0.5);
}
.param-slider-wrap .ps-slider { background: rgba(255,255,255,0.08); border-radius: 1px; }
</style>
