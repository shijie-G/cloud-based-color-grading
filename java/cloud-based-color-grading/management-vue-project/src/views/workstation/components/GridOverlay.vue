<template>
  <canvas
    v-if="settings.visible && imageCanvas"
    ref="overlayCanvas"
    class="grid-overlay"
    :style="overlayStyle"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { GridSettings } from '../composables/useGridState'

const props = defineProps<{
  settings: GridSettings
  imageCanvas: HTMLCanvasElement | null
  imgScale: number
  imgOffsetX: number
  imgOffsetY: number
}>()

const overlayCanvas = ref<HTMLCanvasElement | null>(null)
const canvasLeft = ref(0)
const canvasTop  = ref(0)
const canvasW    = ref(0)
const canvasH    = ref(0)

const updateRect = () => {
  if (!props.imageCanvas) return
  const rect   = props.imageCanvas.getBoundingClientRect()
  const parent = props.imageCanvas.parentElement?.getBoundingClientRect()
  if (!parent) return
  canvasLeft.value = rect.left - parent.left
  canvasTop.value  = rect.top  - parent.top
  canvasW.value    = rect.width
  canvasH.value    = rect.height
}

const overlayStyle = computed(() => ({
  position: 'absolute' as const,
  left:   `${canvasLeft.value}px`,
  top:    `${canvasTop.value}px`,
  width:  `${canvasW.value}px`,
  height: `${canvasH.value}px`,
  zIndex: 30,
  pointerEvents: 'none' as const,
  borderRadius: '4px',
}))

const draw = () => {
  const canvas = overlayCanvas.value
  if (!canvas || canvasW.value <= 0 || canvasH.value <= 0) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(canvasW.value)
  const h = Math.round(canvasH.value)
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width  = w * dpr
    canvas.height = h * dpr
  }

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const { cols, rows, color, opacity, lineWidth } = props.settings
  ctx.strokeStyle = color
  ctx.globalAlpha = opacity
  ctx.lineWidth   = lineWidth

  for (let i = 1; i < cols; i++) {
    const x = (w / cols) * i
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let i = 1; i < rows; i++) {
    const y = (h / rows) * i
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
}

const syncAndDraw = () => { updateRect(); nextTick(draw) }

// 图片缩放/平移时同步
watch(() => [props.imgScale, props.imgOffsetX, props.imgOffsetY], syncAndDraw)

// 网格参数变化时重绘
watch(() => ({ ...props.settings }), () => { if (props.settings.visible) nextTick(draw) }, { deep: true })

// visible 切换时同步位置再绘制
watch(() => props.settings.visible, (v) => {
  if (v) {
    // v-if 变为 true 后 DOM 需要两个 tick 才挂载
    nextTick(() => nextTick(syncAndDraw))
  }
})

// overlayCanvas 挂载后立即绘制（v-if 首次渲染时触发）
watch(overlayCanvas, (c) => {
  if (c) syncAndDraw()
})

// canvas 引用变化时重新挂 ResizeObserver
let ro: ResizeObserver | null = null
watch(() => props.imageCanvas, (c) => {
  ro?.disconnect()
  if (!c) return
  ro = new ResizeObserver(syncAndDraw)
  ro.observe(c)
  syncAndDraw()
}, { immediate: true })

const onResize = () => syncAndDraw()

onMounted(() => { window.addEventListener('resize', onResize) })
onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.grid-overlay { display: block; }
</style>
