<template>
  <div class="crop-panel">
    <div class="section">
      <div class="section-title">裁切比例</div>
      <div class="ratio-grid">
        <button v-for="p in presets" :key="p.label" class="ratio-btn" :class="{ active: selected === p.label }" @click="pick(p)">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect :x="p.sx" :y="p.sy" :width="p.sw" :height="p.sh" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ p.label }}</span>
        </button>
      </div>
    </div>
    <div class="section">
      <div class="section-title">旋转 / 翻转</div>
      <div class="transform-row">
        <button class="tf-btn" @click="emit('rotate', -90)"><svg viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.364 2.636L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 3v5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>逆时针</span></button>
        <button class="tf-btn" @click="emit('rotate', 90)"><svg viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.364 2.636L21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M21 3v5h-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>顺时针</span></button>
        <button class="tf-btn" @click="emit('flip', 'h')"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v18M5 7l-3 3 3 3M19 7l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>水平</span></button>
        <button class="tf-btn" @click="emit('flip', 'v')"><svg viewBox="0 0 24 24" fill="none"><path d="M3 12h18M7 5l3-3 3 3M7 19l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>垂直</span></button>
      </div>
    </div>
    <div class="section hint-box">
      <p>在左侧图片上拖拽调整裁切框</p>
      <p>按 <kbd>Enter</kbd> 确认，<kbd>Esc</kbd> 取消</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
interface Preset { label: string; ratio: number | null; sx: number; sy: number; sw: number; sh: number }
const emit = defineEmits<{ ratio: [r: number | null]; rotate: [deg: number]; flip: [dir: 'h' | 'v'] }>()
const presets: Preset[] = [
  { label: '自由', ratio: null, sx: 3, sy: 3, sw: 18, sh: 18 },
  { label: '1:1',  ratio: 1,    sx: 4, sy: 4, sw: 16, sh: 16 },
  { label: '4:3',  ratio: 4/3,  sx: 2, sy: 4, sw: 20, sh: 15 },
  { label: '3:4',  ratio: 3/4,  sx: 4, sy: 2, sw: 15, sh: 20 },
  { label: '16:9', ratio: 16/9, sx: 1, sy: 5, sw: 22, sh: 13 },
  { label: '9:16', ratio: 9/16, sx: 5, sy: 1, sw: 13, sh: 22 },
]
const selected = ref('自由')
const pick = (p: Preset) => { selected.value = p.label; emit('ratio', p.ratio) }
</script>

<style scoped>
.crop-panel { display: flex; flex-direction: column; gap: 8px; }
.section { background: #24272d; border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.2s; }
.section:hover { border-color: rgba(255,255,255,0.09); }
.section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
.ratio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.ratio-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #1c1e22; border: 1px solid rgba(255,255,255,0.07); border-radius: 7px; padding: 8px 4px; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.ratio-btn svg { width: 20px; height: 20px; }
.ratio-btn span { font-size: 10px; font-weight: 500; }
.ratio-btn:hover { border-color: rgba(91,106,240,0.4); color: #c4c9d4; }
.ratio-btn.active { border-color: #5b6af0; color: #5b6af0; background: rgba(91,106,240,0.1); }
.transform-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.tf-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #1c1e22; border: 1px solid rgba(255,255,255,0.07); border-radius: 7px; padding: 8px 4px; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.tf-btn svg { width: 18px; height: 18px; }
.tf-btn span { font-size: 10px; }
.tf-btn:hover { border-color: rgba(91,106,240,0.4); color: #c4c9d4; }
.tf-btn:active { background: rgba(91,106,240,0.1); }
.hint-box { padding: 10px 14px; }
.hint-box p { font-size: 11px; color: #6b7280; margin: 0 0 4px; line-height: 1.5; }
kbd { display: inline-block; padding: 1px 5px; background: #1c1e22; border: 1px solid rgba(255,255,255,0.15); border-radius: 3px; font-size: 10px; color: #9ca3af; }
</style>
