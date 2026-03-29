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

// overlay 直接复用 imageCanvas 的 CSS 尺寸（未缩放的原始尺寸）和 transform
// 这样网格线和图片完全重叠，不受 scale/offset 影响
const overlayStyle = computed(() => {
  const c = props.imageCanvas
  if (!c) return { display: 'none' }
  // 取 canvas 的原始 CSS 渲染尺寸（不含 transform）
  const w = c.offsetWidth  || c.clientWidth  || 0
  const h = c.offsetHeight || c.clientHeight || 0
  return {
    position: 'absolute' as const,
    width:  `${w}px`,
    height: `${h}px`,
    // 复用和 imageCanvas 完全相同的 transform
    transform: `translate(${props.imgOffsetX}px, ${props.imgOffsetY}px) scale(${props.imgScale})`,
    transformOrigin: 'center center',
    zIndex: 5,
    pointerEvents: 'none' as const,
    borderRadius: '4px',
  }
})

const draw = () => {
  const canvas = overlayCanvas.value
  const c = props.imageCanvas
  if (!canvas || !c) return
  const w = c.offsetWidth  || c.clientWidth  || 0
  const h = c.offsetHeight || c.clientHeight || 0
  if (w <= 0 || h <= 0) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
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

const redraw = () => nextTick(draw)

watch(() => [props.imgScale, props.imgOffsetX, props.imgOffsetY], redraw)
watch(() => ({ ...props.settings }), () => { if (props.settings.visible) nextTick(draw) }, { deep: true })
watch(() => props.settings.visible, (v) => { if (v) nextTick(() => nextTick(redraw)) })
watch(overlayCanvas, (c) => { if (c) redraw() })

let ro: ResizeObserver | null = null
watch(() => props.imageCanvas, (c) => {
  ro?.disconnect()
  if (!c) return
  ro = new ResizeObserver(redraw)
  ro.observe(c)
  redraw()
}, { immediate: true })

const onResize = () => redraw()
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => { ro?.disconnect(); window.removeEventListener('resize', onResize) })
</script>

<style scoped>
.grid-overlay { display: block; }
</style>
