<template>
  <div 
    class="resizer" 
    :class="{ 'resizing': isResizing }"
    @mousedown="startResize"
  >
    <div class="resizer-handle">
      <div class="resizer-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
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
  width: 0.5vw;
  height: 100%;
  background-color: #444;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resizer:hover {
  background-color: #555;
}

.resizer-handle {
  width: 100%;
  height: 6vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.resizer-dots {
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
  align-items: center;
}

.dot {
  width: 0.3vw;
  height: 0.3vw;
  background-color: #888;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}
</style>
.resizer.resizing {
  background-color: #409eff;
}

.resizer.resizing .dot {
  background-color: #fff;
}