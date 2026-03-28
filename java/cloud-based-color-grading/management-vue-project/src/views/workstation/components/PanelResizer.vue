<template>
  <div
    class="resizer"
    :class="{ 'resizing': isResizing }"
    @mousedown="startResize"
  >
    <div class="resizer-line"></div>
    <div class="resizer-handle">
      <svg class="handle-icon" viewBox="0 0 6 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="2" height="24" rx="1" />
        <rect x="4" y="0" width="2" height="24" rx="1" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// PanelResizer 组件 - 左右面板拖拽分割线

// Props 接口
interface PanelResizerProps {
  minWidth?: number
  maxWidth?: number
  currentWidth: number
  isResizing?: boolean
}

// 事件定义
interface PanelResizerEvents {
  'layout:updatePanelWidth': [width: number]
  'resize:start': []
  'resize:end': []
}

// 使用 defineProps 和 defineEmits 定义接口
const props = withDefaults(defineProps<PanelResizerProps>(), {
  minWidth: 70,
  maxWidth: 85,
  isResizing: false
})
const emit = defineEmits<PanelResizerEvents>()

// 本地状态
const isResizing = ref(false)

// 开始拖拽分割线
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  emit('resize:start')
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

// 处理拖拽
const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const containerRect = document.querySelector('.editor-container')?.getBoundingClientRect()
  if (!containerRect) return
  
  const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
  
  // 限制最小和最大宽度
  if (newLeftWidth >= props.minWidth && newLeftWidth <= props.maxWidth) {
    emit('layout:updatePanelWidth', newLeftWidth)
  }
}

// 停止拖拽
const stopResize = () => {
  isResizing.value = false
  emit('resize:end')
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizer {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10;
}

.resizer-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 80%,
    transparent 100%
  );
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.resizer:hover .resizer-line {
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 80%,
    transparent 100%
  );
}

.resizer.resizing .resizer-line {
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(64, 158, 255, 0.3) 20%,
    rgba(64, 158, 255, 0.6) 50%,
    rgba(64, 158, 255, 0.3) 80%,
    transparent 100%
  );
}

.resizer-handle {
  position: relative;
  z-index: 2;
  padding: 16px 4px;
  background-color: rgba(60, 60, 60, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0.9);
}

.resizer:hover .resizer-handle {
  opacity: 1;
  transform: scale(1);
  background-color: rgba(70, 70, 70, 0.9);
}

.resizer.resizing .resizer-handle {
  opacity: 1;
  transform: scale(1);
  background-color: rgba(64, 158, 255, 0.2);
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3);
}

.handle-icon {
  width: 6px;
  height: 24px;
  display: block;
}

.handle-icon rect {
  fill: rgba(255, 255, 255, 0.4);
  transition: fill 0.3s ease;
}

.resizer:hover .handle-icon rect {
  fill: rgba(255, 255, 255, 0.7);
}

.resizer.resizing .handle-icon rect {
  fill: rgba(64, 158, 255, 0.9);
}
</style>