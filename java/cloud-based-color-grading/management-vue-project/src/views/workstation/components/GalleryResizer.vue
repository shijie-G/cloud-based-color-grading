<template>
  <div 
    class="gallery-resizer"
    @mousedown="startResize"
    :class="{ 'resizing': isResizing }"
  >
    <div class="gallery-resizer-line"></div>
    <div class="gallery-resizer-handle">
      <svg class="handle-icon" viewBox="0 0 24 6" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="24" height="2" rx="1" />
        <rect x="0" y="4" width="24" height="2" rx="1" />
      </svg>
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
  height: 8px;
  width: 100%;
  cursor: row-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10;
}

.gallery-resizer-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 80%,
    transparent 100%
  );
  transform: translateY(-50%);
  transition: all 0.3s ease;
}

.gallery-resizer:hover .gallery-resizer-line {
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 80%,
    transparent 100%
  );
}

.gallery-resizer.resizing .gallery-resizer-line {
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(64, 158, 255, 0.3) 20%,
    rgba(64, 158, 255, 0.6) 50%,
    rgba(64, 158, 255, 0.3) 80%,
    transparent 100%
  );
}

.gallery-resizer-handle {
  position: relative;
  z-index: 2;
  padding: 4px 16px;
  background-color: rgba(60, 60, 60, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0.9);
}

.gallery-resizer:hover .gallery-resizer-handle {
  opacity: 1;
  transform: scale(1);
  background-color: rgba(70, 70, 70, 0.9);
}

.gallery-resizer.resizing .gallery-resizer-handle {
  opacity: 1;
  transform: scale(1);
  background-color: rgba(64, 158, 255, 0.2);
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3);
}

.handle-icon {
  width: 24px;
  height: 6px;
  display: block;
}

.handle-icon rect {
  fill: rgba(255, 255, 255, 0.4);
  transition: fill 0.3s ease;
}

.gallery-resizer:hover .handle-icon rect {
  fill: rgba(255, 255, 255, 0.7);
}

.gallery-resizer.resizing .handle-icon rect {
  fill: rgba(64, 158, 255, 0.9);
}
</style>