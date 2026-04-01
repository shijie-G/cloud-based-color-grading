<script setup lang="ts">
import { ref } from 'vue'
import type { Layer } from '../types'

interface Props {
  layers: Layer[]
  selectedLayerId: string | null
}

interface Emits {
  (e: 'select', id: string): void
  (e: 'remove', id: string): void
  (e: 'duplicate', id: string): void
  (e: 'toggleVisibility', id: string): void
  (e: 'toggleLock', id: string): void
  (e: 'moveUp', id: string): void
  (e: 'moveDown', id: string): void
  (e: 'reorder', fromIndex: number, toIndex: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const draggedLayerId = ref<string | null>(null)
const dragOverLayerId = ref<string | null>(null)

function getLayerIcon(type: string) {
  return type // 返回类型字符串，用于CSS类名
}

function handleDragStart(layer: Layer, e: DragEvent) {
  if (layer.locked) {
    e.preventDefault()
    return
  }
  draggedLayerId.value = layer.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', layer.id)
  }
}

function handleDragOver(layer: Layer, e: DragEvent) {
  if (!draggedLayerId.value || layer.id === draggedLayerId.value) return
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverLayerId.value = layer.id
}

function handleDragLeave(layer: Layer) {
  if (dragOverLayerId.value === layer.id) {
    dragOverLayerId.value = null
  }
}

function handleDrop(layer: Layer, e: DragEvent) {
  e.preventDefault()
  if (!draggedLayerId.value || layer.id === draggedLayerId.value) return

  const fromIndex = props.layers.findIndex(l => l.id === draggedLayerId.value)
  const toIndex = props.layers.findIndex(l => l.id === layer.id)

  if (fromIndex !== -1 && toIndex !== -1) {
    emit('reorder', fromIndex, toIndex)
  }

  draggedLayerId.value = null
  dragOverLayerId.value = null
}

function handleDragEnd() {
  draggedLayerId.value = null
  dragOverLayerId.value = null
}
</script>

<template>
  <div class="layer-panel">
    <div class="panel-header">
      <h3>图层</h3>
    </div>

    <div class="layer-list">
      <div
        v-for="layer in layers"
        :key="layer.id"
        :class="[
          'layer-item',
          {
            selected: layer.id === selectedLayerId,
            dragging: layer.id === draggedLayerId,
            'drag-over': layer.id === dragOverLayerId
          }
        ]"
        :draggable="!layer.locked"
        @click="emit('select', layer.id)"
        @dragstart="handleDragStart(layer, $event)"
        @dragover="handleDragOver(layer, $event)"
        @dragleave="handleDragLeave(layer)"
        @drop="handleDrop(layer, $event)"
        @dragend="handleDragEnd"
      >
        <div class="layer-info">
          <div :class="['layer-icon', layer.type]">
            <!-- 图片图标 -->
            <svg v-if="layer.type === 'image'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            <!-- 文字图标 -->
            <svg v-else-if="layer.type === 'text'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <!-- 形状图标 -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="layer-name">{{ layer.name }}</span>
        </div>

        <div class="layer-actions">
          <!-- 可见性 -->
          <button
            class="action-btn"
            :title="layer.visible ? '隐藏' : '显示'"
            @click.stop="emit('toggleVisibility', layer.id)"
          >
            <svg v-if="layer.visible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          </button>

          <!-- 锁定 -->
          <button
            class="action-btn"
            :title="layer.locked ? '解锁' : '锁定'"
            @click.stop="emit('toggleLock', layer.id)"
          >
            <svg v-if="layer.locked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
            </svg>
          </button>

          <!-- 复制 -->
          <button
            class="action-btn"
            title="复制"
            @click.stop="emit('duplicate', layer.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
          </button>

          <!-- 删除 -->
          <button
            class="action-btn delete-btn"
            title="删除"
            @click.stop="emit('remove', layer.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="layers.length === 0" class="empty-state">
        <p>暂无图层</p>
        <p class="hint">从素材库添加元素开始创作</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layer-panel {
  min-width: 260px;
  max-width: 500px;
  background: #1c1e22;
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

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #24272d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.layer-item[draggable="true"] {
  cursor: move;
}

.layer-item.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.layer-item.drag-over::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: #5b6af0;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(91, 106, 240, 0.6);
}

.layer-item {
  position: relative;
}

.layer-item:hover {
  background: #2a2d35;
}

.layer-item.selected {
  background: #5b6af0;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.layer-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  flex-shrink: 0;
}

.layer-icon svg {
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.layer-icon.image {
  background: rgba(91, 106, 240, 0.1);
}

.layer-icon.image svg {
  color: #5b6af0;
}

.layer-icon.text {
  background: rgba(34, 197, 94, 0.1);
}

.layer-icon.text svg {
  color: #22c55e;
}

.layer-icon.shape {
  background: rgba(251, 146, 60, 0.1);
}

.layer-icon.shape svg {
  color: #fb923c;
}

.layer-name {
  color: #e2e4e9;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-state .hint {
  font-size: 0.85rem;
  color: #4b5563;
}
</style>
