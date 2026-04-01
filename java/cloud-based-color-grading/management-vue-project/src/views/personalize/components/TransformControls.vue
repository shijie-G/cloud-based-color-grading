<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

interface Emits {
  (e: 'resize', data: { width: number; height: number }): void
  (e: 'rotate', rotation: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isResizing = ref(false)
const isRotating = ref(false)
const resizeHandle = ref<string>('')
const startPos = ref({ x: 0, y: 0 })
const startSize = ref({ width: 0, height: 0 })
const startRotation = ref(0)

// 开始缩放
function handleResizeStart(handle: string, e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()

  isResizing.value = true
  resizeHandle.value = handle
  startPos.value = { x: e.clientX, y: e.clientY }
  startSize.value = { width: props.width, height: props.height }

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
  document.body.style.userSelect = 'none'
}

// 缩放移动
function handleResizeMove(e: MouseEvent) {
  if (!isResizing.value) return

  const dx = e.clientX - startPos.value.x
  const dy = e.clientY - startPos.value.y

  let newWidth = startSize.value.width
  let newHeight = startSize.value.height

  // 根据不同的控制点计算新尺寸
  switch (resizeHandle.value) {
    case 'top-left':
      newWidth = startSize.value.width - dx
      newHeight = startSize.value.height - dy
      break
    case 'top-right':
      newWidth = startSize.value.width + dx
      newHeight = startSize.value.height - dy
      break
    case 'bottom-left':
      newWidth = startSize.value.width - dx
      newHeight = startSize.value.height + dy
      break
    case 'bottom-right':
      newWidth = startSize.value.width + dx
      newHeight = startSize.value.height + dy
      break
  }

  // 限制最小尺寸
  newWidth = Math.max(20, newWidth)
  newHeight = Math.max(20, newHeight)

  emit('resize', { width: newWidth, height: newHeight })
}

// 结束缩放
function handleResizeEnd() {
  isResizing.value = false
  resizeHandle.value = ''
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  document.body.style.userSelect = ''
}

// 开始旋转
function handleRotateStart(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()

  isRotating.value = true
  startRotation.value = props.rotation

  const centerX = props.x + props.width / 2
  const centerY = props.y + props.height / 2
  const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

  const handleRotateMove = (moveEvent: MouseEvent) => {
    const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI)
    let deltaAngle = currentAngle - startAngle

    // 优化旋转速度：直接使用角度差值，不需要额外计算
    let newRotation = startRotation.value + deltaAngle

    // 标准化角度到 0-360 范围
    while (newRotation < 0) newRotation += 360
    while (newRotation >= 360) newRotation -= 360

    emit('rotate', newRotation)
  }

  const handleRotateEnd = () => {
    isRotating.value = false
    document.removeEventListener('mousemove', handleRotateMove)
    document.removeEventListener('mouseup', handleRotateEnd)
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', handleRotateMove)
  document.addEventListener('mouseup', handleRotateEnd)
  document.body.style.userSelect = 'none'
}
</script>

<template>
  <div class="transform-controls">
    <!-- 四个角的缩放控制点 -->
    <div
      class="resize-handle top-left"
      @mousedown="handleResizeStart('top-left', $event)"
    ></div>
    <div
      class="resize-handle top-right"
      @mousedown="handleResizeStart('top-right', $event)"
    ></div>
    <div
      class="resize-handle bottom-left"
      @mousedown="handleResizeStart('bottom-left', $event)"
    ></div>
    <div
      class="resize-handle bottom-right"
      @mousedown="handleResizeStart('bottom-right', $event)"
    ></div>

    <!-- 旋转控制点 -->
    <div
      class="rotate-handle"
      @mousedown="handleRotateStart"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.transform-controls {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #5b6af0;
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.resize-handle.top-left {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.resize-handle.top-right {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.resize-handle.bottom-left {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.resize-handle.bottom-right {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}

.rotate-handle {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #5b6af0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: grab;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.rotate-handle:active {
  cursor: grabbing;
}

.rotate-handle svg {
  width: 14px;
  height: 14px;
  color: #5b6af0;
}
</style>
