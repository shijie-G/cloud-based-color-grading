<template>
  <div 
    class="gallery-resizer"
    @mousedown="startResize"
    :class="{ 'resizing': isResizing }"
  >
    <div class="gallery-resizer-handle">
      <div class="gallery-resizer-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// GalleryResizer 组件 - 图片全览区拖拽分割线
interface GalleryResizerProps {
  minHeight?: number
  maxHeight?: number
  currentHeight: number
}

// 事件定义
interface GalleryResizerEvents {
  'layout:updateGalleryHeight': [height: number]
  'resize:start': []
  'resize:end': []
}

// 使用 defineProps 和 defineEmits 定义接口
const props = withDefaults(defineProps<GalleryResizerProps>(), {
  minHeight: 16,
  maxHeight: 35
})
const emit = defineEmits<GalleryResizerEvents>()

// 拖拽状态
const isResizing = ref(false)

// 开始拖拽
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  emit('resize:start')
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

// 处理拖拽
const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const leftPanel = document.querySelector('.image-display')
  if (!leftPanel) return
  
  const leftPanelRect = leftPanel.getBoundingClientRect()
  
  // 计算新的高度（从底部向上计算，转换为vh）
  const newHeightPx = leftPanelRect.bottom - e.clientY
  const newHeightVh = (newHeightPx / window.innerHeight) * 100
  
  // 限制最小高度和最大高度
  const minHeight = props.minHeight
  const maxHeight = props.maxHeight
  
  if (newHeightVh >= minHeight && newHeightVh <= maxHeight) {
    emit('layout:updateGalleryHeight', newHeightVh)
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
.gallery-resizer {
  height: 4px;
  width: 100%;
  background-color: #444;
  cursor: row-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.gallery-resizer:hover {
  background-color: #555;
}

.gallery-resizer.resizing {
  background-color: #409eff;
}

.gallery-resizer-handle {
  height: 100%;
  width: 6vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gallery-resizer-dots {
  display: flex;
  gap: 0.3vw;
  align-items: center;
}

.dot {
  width: 0.3vw;
  height: 0.3vw;
  background-color: #888;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.gallery-resizer:hover .dot {
  background-color: #bbb;
}

.gallery-resizer.resizing .dot {
  background-color: #fff;
}
</style>