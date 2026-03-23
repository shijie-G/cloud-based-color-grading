<template>
  <div class="mask-controls">

    <!-- 标题行 -->
    <div class="mask-header">
      <span class="section-label">蒙版</span>
      <button class="toggle-btn" :class="{ active: maskActive }" @click="$emit('toggle:active')">
        {{ maskActive ? '编辑中' : '激活' }}
      </button>
    </div>

    <template v-if="maskActive">
      <!-- 层列表 -->
      <div class="layer-list">
        <div
          v-for="layer in layers" :key="layer.id"
          class="layer-item"
          :class="{ active: layer.id === activeLayerId }"
          @click="$emit('layer:select', layer.id)"
        >
          <!-- 类型图标 -->
          <span class="layer-icon">
            <svg v-if="layer.type === 'linear'" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5"/>
              <line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/>
              <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/>
            </svg>
            <svg v-else viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="5" ry="5" stroke="currentColor" stroke-width="1.5"/>
              <ellipse cx="8" cy="8" rx="2.5" ry="2.5" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity=".5"/>
            </svg>
          </span>
          <span class="layer-name">{{ layer.name }}</span>
          <!-- 启用开关 -->
          <button
            class="layer-toggle"
            :class="{ on: layer.enabled }"
            @click.stop="$emit('layer:toggleEnabled', layer.id)"
            title="启用/禁用"
          >{{ layer.enabled ? '●' : '○' }}</button>
          <!-- 删除 -->
          <button
            class="layer-del"
            @click.stop="$emit('layer:remove', layer.id)"
            title="删除"
          >×</button>
        </div>

        <!-- 空状态 -->
        <div v-if="layers.length === 0" class="layer-empty">暂无蒙版层</div>
      </div>

      <!-- 添加层按钮 -->
      <div class="add-row">
        <button class="add-btn" @click="$emit('layer:add', 'linear')">
          <svg viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.5"/></svg>
          线性
        </button>
        <button class="add-btn" @click="$emit('layer:add', 'radial')">
          <svg viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.5"/></svg>
          径向
        </button>
      </div>

      <!-- 当前激活层参数 -->
      <template v-if="activeLayer">
        <div class="divider" />

        <!-- 线性参数 -->
        <template v-if="activeLayer.type === 'linear'">
          <div class="hint-text">拖拽图片设置渐变方向 · 中点手柄平移</div>
          <div class="adjust-item">
            <div class="item-header"><span class="item-label">羽化</span><span class="item-value">{{ pct(activeLayer.linear.feather) }}</span></div>
            <input type="range" class="slider" min="0" max="1" step="0.01" :value="activeLayer.linear.feather"
              @input="e => updateParam('linear', 'feather', +( e.target as HTMLInputElement).value)" />
          </div>
        </template>

        <!-- 径向参数 -->
        <template v-if="activeLayer.type === 'radial'">
          <div class="hint-text">拖拽图片设置椭圆 · 内部拖动平移</div>
          <div class="adjust-item">
            <div class="item-header"><span class="item-label">羽化</span><span class="item-value">{{ pct(activeLayer.radial.feather) }}</span></div>
            <input type="range" class="slider" min="0" max="1" step="0.01" :value="activeLayer.radial.feather"
              @input="e => updateParam('radial', 'feather', +(e.target as HTMLInputElement).value)" />
          </div>
          <div class="row">
            <span class="item-label">应用区域</span>
            <div class="mode-group">
              <button class="mode-btn" :class="{ active: !activeLayer.radial.invert }" @click="setInvert(false)">内部</button>
              <button class="mode-btn" :class="{ active: activeLayer.radial.invert  }" @click="setInvert(true)">外部</button>
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
          <button class="action-btn" @click="$emit('layer:invert')">反转</button>
          <button class="action-btn danger" @click="$emit('layer:clear')">清除</button>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { MaskLayer, MaskType } from '../composables/useMaskState'

interface Props {
  layers: MaskLayer[]
  activeLayerId: string
  activeLayer: MaskLayer | null
  showOverlay: boolean
  maskActive: boolean
}
interface Emits {
  'toggle:active':       []
  'toggle:overlay':      []
  'layer:add':           [type: MaskType]
  'layer:remove':        [id: string]
  'layer:select':        [id: string]
  'layer:toggleEnabled': [id: string]
  'layer:invert':        []
  'layer:clear':         []
  'update:layer':        [layer: MaskLayer]
}

const props = defineProps<Props>()
const emit  = defineEmits<Emits>()

const pct = (v: number) => `${Math.round(v * 100)}%`

const setInvert = (v: boolean) => {
  if (!props.activeLayer) return
  emit('update:layer', { ...props.activeLayer, radial: { ...props.activeLayer.radial, invert: v } })
}

const updateParam = (section: 'linear' | 'radial', key: string, value: number) => {
  if (!props.activeLayer) return
  emit('update:layer', {
    ...props.activeLayer,
    [section]: { ...(props.activeLayer as any)[section], [key]: value },
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
.toggle-btn {
  padding: 4px 10px; font-size: 11px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.toggle-btn:hover { background: rgba(255,255,255,0.08); color: #9ca3af; }
.toggle-btn.active { background: #5b6af0; border-color: #5b6af0; color: #fff; }

/* 层列表 */
.layer-list { display: flex; flex-direction: column; gap: 3px; }
.layer-item {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 7px; border-radius: 5px;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.03);
  cursor: pointer; transition: all 0.12s;
}
.layer-item:hover { background: rgba(255,255,255,0.06); }
.layer-item.active {
  background: rgba(91,106,240,0.12);
  border-color: rgba(91,106,240,0.35);
}
.layer-icon { width: 16px; height: 16px; flex-shrink: 0; color: #6b7280; }
.layer-item.active .layer-icon { color: #a5b0ff; }
.layer-icon svg { width: 100%; height: 100%; }
.layer-name { flex: 1; font-size: 11px; color: #9ca3af; }
.layer-item.active .layer-name { color: #c7ceff; }
.layer-toggle {
  font-size: 11px; color: #4b5563; background: none; border: none;
  cursor: pointer; outline: none; padding: 0 2px; line-height: 1;
  transition: color 0.12s;
}
.layer-toggle.on { color: #5b6af0; }
.layer-del {
  font-size: 13px; color: #4b5563; background: none; border: none;
  cursor: pointer; outline: none; padding: 0 2px; line-height: 1;
  transition: color 0.12s;
}
.layer-del:hover { color: #f87171; }
.layer-empty { font-size: 11px; color: #374151; text-align: center; padding: 8px 0; }

/* 添加按钮 */
.add-row { display: flex; gap: 6px; }
.add-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 5px 8px; font-size: 11px; border-radius: 5px;
  border: 1px dashed rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);
  color: #6b7280; cursor: pointer; outline: none; transition: all 0.15s;
}
.add-btn svg { width: 12px; height: 12px; }
.add-btn:hover { background: rgba(91,106,240,0.1); border-color: rgba(91,106,240,0.3); color: #a5b0ff; }

.divider { height: 1px; background: rgba(255,255,255,0.05); margin: 2px 0; }

.hint-text { font-size: 11px; color: #4b5563; text-align: center; }
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

.action-row { display: flex; gap: 8px; }
.action-btn {
  flex: 1; padding: 6px; font-size: 11px; border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: #9ca3af; cursor: pointer; outline: none; transition: all 0.15s;
}
.action-btn:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }
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
}
.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px rgba(91,106,240,0.3); transform: scale(1.15);
}
</style>
