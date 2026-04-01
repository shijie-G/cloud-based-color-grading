<script setup lang="ts">
import { computed } from 'vue'
import type { Layer } from '../types'

interface Props {
  layer: Layer | null
}

interface Emits {
  (e: 'update', updates: Partial<Layer>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasLayer = computed(() => props.layer !== null)

function handleUpdate(key: keyof Layer, value: any) {
  emit('update', { [key]: value })
}
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性</h3>
    </div>

    <div v-if="!hasLayer" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
      </svg>
      <p>选择图层以编辑属性</p>
    </div>

    <div v-else class="property-content">
      <!-- 基本信息 -->
      <div class="property-section">
        <div class="section-title">基本</div>

        <div class="property-item">
          <label>名称</label>
          <input
            type="text"
            :value="layer!.name"
            @input="handleUpdate('name', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="property-item">
          <label>透明度</label>
          <div class="slider-group">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="layer!.opacity"
              @input="handleUpdate('opacity', parseFloat(($event.target as HTMLInputElement).value))"
            />
            <span class="value">{{ Math.round(layer!.opacity * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- 位置和大小 -->
      <div class="property-section">
        <div class="section-title">变换</div>

        <div class="property-row">
          <div class="property-item">
            <label>X</label>
            <input
              type="number"
              :value="Math.round(layer!.x)"
              @input="handleUpdate('x', parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="property-item">
            <label>Y</label>
            <input
              type="number"
              :value="Math.round(layer!.y)"
              @input="handleUpdate('y', parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <div class="property-row">
          <div class="property-item">
            <label>宽度</label>
            <input
              type="number"
              :value="Math.round(layer!.width)"
              @input="handleUpdate('width', parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="property-item">
            <label>高度</label>
            <input
              type="number"
              :value="Math.round(layer!.height)"
              @input="handleUpdate('height', parseFloat(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <div class="property-item">
          <label>旋转</label>
          <div class="slider-group">
            <input
              type="range"
              min="0"
              max="360"
              :value="layer!.rotation"
              @input="handleUpdate('rotation', parseFloat(($event.target as HTMLInputElement).value))"
            />
            <span class="value">{{ Math.round(layer!.rotation) }}°</span>
          </div>
        </div>
      </div>

      <!-- 文字属性 -->
      <div v-if="layer!.type === 'text'" class="property-section">
        <div class="section-title">文字</div>

        <div class="property-item">
          <label>内容</label>
          <textarea
            :value="layer!.text"
            @input="handleUpdate('text', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
          ></textarea>
        </div>

        <div class="property-item">
          <label>字体</label>
          <select
            :value="layer!.fontFamily"
            @change="handleUpdate('fontFamily', ($event.target as HTMLSelectElement).value)"
          >
            <option value="Arial">Arial</option>
            <option value="'Times New Roman'">Times New Roman</option>
            <option value="'Courier New'">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="'Comic Sans MS'">Comic Sans MS</option>
            <option value="'Trebuchet MS'">Trebuchet MS</option>
            <option value="Impact">Impact</option>
            <option value="'Lucida Console'">Lucida Console</option>
            <option value="Tahoma">Tahoma</option>
            <option value="'Palatino Linotype'">Palatino Linotype</option>
            <option value="'Microsoft YaHei', 微软雅黑">微软雅黑</option>
            <option value="'SimSun', 宋体">宋体</option>
            <option value="'SimHei', 黑体">黑体</option>
            <option value="'KaiTi', 楷体">楷体</option>
            <option value="'FangSong', 仿宋">仿宋</option>
            <option value="'PingFang SC', 'Hiragino Sans GB'">苹方</option>
          </select>
        </div>

        <div class="property-item">
          <label>字号</label>
          <input
            type="number"
            :value="layer!.fontSize"
            @input="handleUpdate('fontSize', parseFloat(($event.target as HTMLInputElement).value))"
          />
        </div>

        <div class="property-item">
          <label>颜色</label>
          <div class="color-picker">
            <input
              type="color"
              :value="layer!.color"
              @input="handleUpdate('color', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-value">{{ layer!.color }}</span>
          </div>
        </div>
      </div>

      <!-- 形状属性 -->
      <div v-if="layer!.type === 'shape'" class="property-section">
        <div class="section-title">形状</div>

        <div class="property-item">
          <label>填充颜色</label>
          <div class="color-picker">
            <input
              type="color"
              :value="layer!.fillColor"
              @input="handleUpdate('fillColor', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-value">{{ layer!.fillColor }}</span>
          </div>
        </div>

        <div class="property-item">
          <label>边框颜色</label>
          <div class="color-picker">
            <input
              type="color"
              :value="layer!.strokeColor"
              @input="handleUpdate('strokeColor', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-value">{{ layer!.strokeColor }}</span>
          </div>
        </div>

        <div class="property-item">
          <label>边框宽度</label>
          <input
            type="number"
            min="0"
            :value="layer!.strokeWidth"
            @input="handleUpdate('strokeWidth', parseFloat(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- 图片边框 -->
      <div v-if="layer!.type === 'image'" class="property-section">
        <div class="section-title">边框</div>

        <div class="property-item">
          <label>边框颜色</label>
          <div class="color-picker">
            <input
              type="color"
              :value="layer!.strokeColor || '#000000'"
              @input="handleUpdate('strokeColor', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-value">{{ layer!.strokeColor || '#000000' }}</span>
          </div>
        </div>

        <div class="property-item">
          <label>边框宽度</label>
          <input
            type="number"
            min="0"
            max="50"
            :value="layer!.strokeWidth || 0"
            @input="handleUpdate('strokeWidth', parseFloat(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  width: 280px;
  background: #1c1e22;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #e2e4e9;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
  text-align: center;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.property-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.property-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.property-item {
  margin-bottom: 1rem;
}

.property-item label {
  display: block;
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.property-item input[type="text"],
.property-item input[type="number"],
.property-item select,
.property-item textarea {
  width: 100%;
  padding: 0.5rem;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e4e9;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.property-item input:focus,
.property-item select:focus,
.property-item textarea:focus {
  outline: none;
  border-color: #5b6af0;
}

.property-item select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2rem;
}

.property-item select option {
  background: #24272d;
  color: #e2e4e9;
}

.property-item textarea {
  resize: vertical;
  font-family: inherit;
}

.property-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-group input[type="range"] {
  flex: 1;
  height: 4px;
  background: #24272d;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #5b6af0;
  border-radius: 50%;
  cursor: pointer;
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #5b6af0;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.slider-group .value {
  min-width: 45px;
  text-align: right;
  font-size: 0.85rem;
  color: #e2e4e9;
  font-variant-numeric: tabular-nums;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker input[type="color"] {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-picker input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-value {
  flex: 1;
  font-size: 0.85rem;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}
</style>
