<template>
  <div class="mask-controls">

    <!-- 标题行 -->
    <div class="mask-header">
      <span class="section-label">蒙版</span>
      <div class="header-btns">
        <button class="toggle-btn" :class="{ active: maskActive }" @click="$emit('toggle:active')">
          {{ maskActive ? '编辑中' : '激活' }}
        </button>
        <button class="toggle-btn" :class="{ active: layer.enabled }" :disabled="!layer.width" @click="$emit('toggle:enabled')">
          {{ layer.enabled ? '开' : '关' }}
        </button>
      </div>
    </div>

    <template v-if="maskActive">
      <!-- 蒙版类型切换 -->
      <div class="type-row">
        <button class="type-btn" :class="{ active: layer.type === 'linear' }" @click="setType('linear')">
          <svg viewBox="0 0 20 20" fill="none"><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/><line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/></svg>
          线性
        </button>
        <button class="type-btn" :class="{ active: layer.type === 'radial' }" @click="setType('radial')">
          <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/></svg>
          径向
        </button>
      </div>

      <!-- 线性蒙版参数 -->
      <template v-if="layer.type === 'linear'">
        <div class="hint-text">在图片上拖拽设置渐变方向</div>
        <div class="adjust-item">
          <div class="item-header"><span class="item-label">羽化</span><span class="item-value">{{ pct(layer.linear.feather) }}</span></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" :value="layer.linear.feather"
            @input="e => update('linear', 'feather', Number((e.target as HTMLInputElement).value))" />
        </div>
      </template>

      <!-- 径向蒙版参数 -->
      <template v-if="layer.type === 'radial'">
        <div class="hint-text">在图片上拖拽设置椭圆范围</div>
        <div class="adjust-item">
          <div class="item-header"><span class="item-label">羽化</span><span class="item-value">{{ pct(layer.radial.feather) }}</span></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" :value="layer.radial.feather"
            @input="e => update('radial', 'feather', Number((e.target as HTMLInputElement).value))" />
        </div>
        <div class="row">
          <span class="item-label">应用区域</span>
          <div class="mode-group">
            <button class="mode-btn" :class="{ active: !layer.radial.invert }" @click="setInvert(false)">内部</button>
            <button class="mode-btn" :class="{ active: layer.radial.invert  }" @click="setInvert(true)">外部</button>
          </div>
        </div>
      </template>

      <!-- 叠加预览 -->
      <div class="row">
        <span class="item-label">叠加预览</span>
        <button class="small-btn" :class="{ active: showOverlay }" @click="$emit('toggle:overlay')">
          {{ showOverlay ? '显示' : '隐藏' }}
        </button>
      </div>

      <!-- 操作 -->
      <div class="action-row">
        <button class="action-btn" :disabled="!layer.width" @click="$emit('mask:invert')">反转</button>
        <button class="action-btn danger" :disabled="!layer.width" @click="$emit('mask:clear')">清除</button>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { MaskLayer } from '../composables/useMaskState'

interface Props {
  layer: MaskLayer
  showOverlay: boolean
  maskActive: boolean
}
interface Emits {
  'toggle:active':  []
  'toggle:enabled': []
  'toggle:overlay': []
  'mask:invert':    []
  'mask:clear':     []
  'update:layer':   [layer: MaskLayer]
}

const props = defineProps<Props>()
const emit  = defineEmits<Emits>()

const pct = (v: number) => `${Math.round(v * 100)}%`

const setType = (t: 'linear' | 'radial') => {
  emit('update:layer', { ...props.layer, type: t })
}

const setInvert = (v: boolean) => {
  emit('update:layer', { ...props.layer, radial: { ...props.layer.radial, invert: v } })
}

const update = (section: 'linear' | 'radial', key: string, value: number) => {
  emit('update:layer', {
    ...props.layer,
    [section]: { ...(props.layer as any)[section], [key]: value },
  })
}
</script>

<style scoped>
.mask-controls { display: flex; flex-direction: column; gap: 10px; }

.section-label {
  font-size: 10px; font-weight: 700; color: #4b5563;
  text-transform: uppercase; letter-spacing: 1px;
}

.mask-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.header-btns { display: flex; gap: 6px; }

.toggle-btn {
  padding: 4px 10px; font-size: 11px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.toggle-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
.toggle-btn.active { background: #5b6af0; border-color: #5b6af0; color: #fff; }
.toggle-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.type-row { display: flex; gap: 6px; }
.type-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 6px 8px; font-size: 11px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.type-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
.type-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
.type-btn.active { background: rgba(91,106,240,0.2); border-color: rgba(91,106,240,0.5); color: #a5b0ff; }

.hint-text { font-size: 11px; color: #4b5563; text-align: center; padding: 2px 0; }

.row { display: flex; align-items: center; justify-content: space-between; }
.item-label { font-size: 12px; color: #9ca3af; }

.small-btn {
  padding: 3px 10px; font-size: 11px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.small-btn.active { background: rgba(91,106,240,0.2); border-color: rgba(91,106,240,0.4); color: #a5b0ff; }

.mode-group { display: flex; gap: 4px; }
.mode-btn {
  padding: 4px 12px; font-size: 11px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.mode-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
.mode-btn.active { background: rgba(91,106,240,0.25); border-color: rgba(91,106,240,0.5); color: #a5b0ff; }

.action-row { display: flex; gap: 8px; margin-top: 2px; }
.action-btn {
  flex: 1; padding: 6px; font-size: 11px; border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: #9ca3af; cursor: pointer; outline: none; transition: all 0.15s;
}
.action-btn:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.action-btn.danger:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #f87171; }

.adjust-item { display: flex; flex-direction: column; gap: 4px; }
.item-header { display: flex; align-items: center; justify-content: space-between; }
.item-value { font-size: 11px; font-family: 'Courier New', monospace; color: #5b6af0; }

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
</style>
