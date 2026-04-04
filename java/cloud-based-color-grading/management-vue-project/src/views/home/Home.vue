<template>
  <div class="home">
    <GlobalNavbar />

    <main class="home-main">
      <!-- Hero -->
      <section class="hero">
        <canvas ref="heroBgCanvas" class="hero-canvas"></canvas>
        <div class="hero-content">
          <h1 class="hero-title">云端调色系统</h1>
          <p class="hero-desc">专业调色 · 相册管理 · 个性化设计，一站式图片创作平台</p>
          <button class="hero-cta" @click="router.push('/workstation')">
            开始使用
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </section>

      <!-- 功能模块入口 -->
      <section class="modules">
        <div
          v-for="mod in modules"
          :key="mod.path"
          class="module-card"
          @click="router.push(mod.path)"
        >
          <div class="module-icon" :style="{ color: mod.color }">
            <svg viewBox="0 0 24 24" fill="none" v-html="mod.icon"></svg>
          </div>
          <div class="module-info">
            <h3 class="module-name">{{ mod.name }}</h3>
            <p class="module-desc">{{ mod.desc }}</p>
          </div>
          <div class="module-features">
            <span v-for="f in mod.features" :key="f" class="feature-tag">{{ f }}</span>
          </div>
          <div class="module-arrow">
            <svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
      </section>

      <!-- 数据统计条 -->
      <section class="stats-bar">
        <div class="stat-item" v-for="s in stats" :key="s.label">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </section>

      <!-- 调色能力展示 -->
      <section class="capabilities">
        <div class="cap-header">
          <h2 class="section-title">专业调色能力</h2>
          <p class="cap-sub">从基础曝光到 HSL 精细调节，完整的专业调色工具链</p>
        </div>
        <div class="cap-grid">
          <div class="cap-card" v-for="cap in capabilities" :key="cap.title">
            <div class="cap-icon" :style="{ background: cap.bg, color: cap.color }">
              <svg viewBox="0 0 24 24" fill="none" v-html="cap.icon"></svg>
            </div>
            <h4 class="cap-title">{{ cap.title }}</h4>
            <p class="cap-desc">{{ cap.desc }}</p>
            <div class="cap-params">
              <span v-for="p in cap.params" :key="p" class="cap-param">{{ p }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 调色参数可视化预览 -->
      <section class="preview-section">
        <div class="preview-left">
          <h2 class="section-title">实时处理链</h2>
          <p class="preview-desc">所有调色操作通过 Web Worker 并行处理，主线程零阻塞，拖动滑块即时响应。</p>
          <div class="pipeline">
            <div class="pipe-step" v-for="(p, i) in pipeline" :key="i">
              <div class="pipe-dot" :style="{ background: p.color }"></div>
              <div class="pipe-info">
                <span class="pipe-name">{{ p.name }}</span>
                <span class="pipe-detail">{{ p.detail }}</span>
              </div>
              <div v-if="i < pipeline.length - 1" class="pipe-arrow">→</div>
            </div>
          </div>
        </div>
        <div class="preview-right">
          <div class="slider-demo" v-for="s in sliderDemo" :key="s.label">
            <div class="slider-header">
              <span class="slider-label">{{ s.label }}</span>
              <span class="slider-val" :style="{ color: s.color }">{{ s.val > 0 ? '+' : '' }}{{ s.val }}</span>
            </div>
            <div class="slider-track">
              <div class="slider-fill" :style="{ width: s.pct + '%', background: s.color, left: s.val < 0 ? s.pct + '%' : '50%', right: s.val > 0 ? (50 - s.pct / 2) + '%' : 'auto' }"></div>
              <div class="slider-center"></div>
              <div class="slider-thumb" :style="{ left: `calc(${50 + s.val / 2}% - 6px)`, background: s.color }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 工作流程 -->
      <section class="workflow">
        <h2 class="section-title-center">使用流程</h2>
        <p class="workflow-sub">从创建相册到导出成品，完整的图片创作工作流</p>
        <div class="workflow-steps">
          <div v-for="(step, i) in steps" :key="i" class="step">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-body">
              <div class="step-title-row">
                <span class="step-icon-wrap" :style="{ color: step.color }">
                  <svg viewBox="0 0 24 24" fill="none" v-html="step.icon"></svg>
                </span>
                <h4>{{ step.title }}</h4>
              </div>
              <p>{{ step.desc }}</p>
              <div class="step-tips">
                <span v-for="t in step.tips" :key="t" class="step-tip">{{ t }}</span>
              </div>
            </div>
            <div v-if="i < steps.length - 1" class="step-line"></div>
          </div>
        </div>
      </section>
    </main>

    <footer class="home-footer">
      <span>© 2026 云端调色系统</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import GlobalNavbar from '@/components/GlobalNavbar.vue'

const router = useRouter()

// ── 动态背景 canvas ──────────────────────────────────────────
const heroBgCanvas = ref<HTMLCanvasElement | null>(null)
let rafId = 0

onMounted(() => {
  const canvas = heroBgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  const resize = () => {
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // 控制点：每个点有独立的相位偏移，产生不同步的流动感
  const blobs = [
    { x: 0.15, y: 0.4,  r: 0.55, phaseX: 0,    phaseY: 1.2,  speed: 0.004 },
    { x: 0.75, y: 0.55, r: 0.50, phaseX: 2.1,  phaseY: 0.7,  speed: 0.003 },
    { x: 0.45, y: 0.2,  r: 0.40, phaseX: 4.3,  phaseY: 3.1,  speed: 0.005 },
    { x: 0.85, y: 0.15, r: 0.35, phaseX: 1.5,  phaseY: 5.0,  speed: 0.0035 },
  ]

  // 颜色随时间在蓝绿色调内缓慢漂移
  // hue 在 160~240 之间（青→蓝）摆动，saturation/lightness 微幅变化
  const colorPhases = [
    { hBase: 195, hAmp: 45, sBase: 75, lBase: 40, phase: 0,   speed: 0.0025 },
    { hBase: 220, hAmp: 40, sBase: 70, lBase: 35, phase: 2.4, speed: 0.002 },
    { hBase: 175, hAmp: 38, sBase: 65, lBase: 38, phase: 4.8, speed: 0.003 },
    { hBase: 240, hAmp: 35, sBase: 60, lBase: 30, phase: 1.2, speed: 0.0022 },
  ]

  let t = 0

  const draw = () => {
    t++
    const W = canvas.width
    const H = canvas.height

    // 深色底色
    ctx.fillStyle = '#0a0d14'
    ctx.fillRect(0, 0, W, H)

    // 绘制每个光晕 blob
    blobs.forEach((b, i) => {
      const cp = colorPhases[i]
      const hue = cp.hBase + Math.sin(t * cp.speed + cp.phase) * cp.hAmp
      const sat = cp.sBase + Math.sin(t * cp.speed * 1.3 + cp.phase) * 8
      const lit = cp.lBase + Math.sin(t * cp.speed * 0.7 + cp.phase + 1) * 6

      // 位置轻微摆动
      const cx = (b.x + Math.sin(t * b.speed + b.phaseX) * 0.12) * W
      const cy = (b.y + Math.cos(t * b.speed + b.phaseY) * 0.10) * H
      const radius = b.r * Math.max(W, H)

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0,   `hsla(${hue}, ${sat}%, ${lit}%, 0.55)`)
      grad.addColorStop(0.5, `hsla(${hue}, ${sat - 10}%, ${lit - 8}%, 0.18)`)
      grad.addColorStop(1,   `hsla(${hue}, ${sat}%, ${lit}%, 0)`)

      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    })

    ctx.globalCompositeOperation = 'source-over'

    // 底部渐变遮罩，与页面背景融合
    const fade = ctx.createLinearGradient(0, H * 0.6, 0, H)
    fade.addColorStop(0, 'rgba(10,13,20,0)')
    fade.addColorStop(1, 'rgba(10,13,20,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, W, H)

    rafId = requestAnimationFrame(draw)
  }

  rafId = requestAnimationFrame(draw)

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  })
})

const modules = [
  {
    name: '调色工作站',
    path: '/workstation',
    color: '#5b6af0',
    desc: '专业级图片调色，实时预览处理效果',
    icon: `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
           <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
           <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    features: ['基础调色', 'HSL调整', '蒙版', '滤镜', '裁切旋转', '撤销重做'],
  },
  {
    name: '图库管理',
    path: '/gallery',
    color: '#22c55e',
    desc: '相册分组管理，批量操作，收藏与回收站',
    icon: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
           <path d="M3 16l5-5 4 4 5-5 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>`,
    features: ['相册分组', '批量上传', '收藏', '回收站', '拖拽上传'],
  },
  {
    name: '个性化设计',
    path: '/personalize',
    color: '#f59e0b',
    desc: '在调色图片上叠加文字、形状、贴纸图层',
    icon: `<path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    features: ['文字图层', '形状图层', '贴纸', '图层管理', '导出'],
  },
]

const steps = [
  {
    title: '创建相册',
    desc: '在图库中新建相册，拖拽或点击上传图片，支持批量上传最多 50 张，自动去重检测。',
    color: '#5b6af0',
    icon: `<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    tips: ['新建相册', '拖拽上传', '批量导入', '自动去重'],
  },
  {
    title: '基础调色',
    desc: '在工作站对图片进行曝光、对比度、色温、饱和度、清晰度等基础参数调整，实时预览效果。',
    color: '#22c55e',
    icon: `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    tips: ['曝光 / 对比度', '色温 / 色调', '饱和度 / 自然饱和度', 'HSL 七色范围'],
  },
  {
    title: '画面裁切',
    desc: '支持自由比例、固定比例裁切，以及旋转、水平/垂直翻转，操作可撤销，原图永久保留。',
    color: '#06b6d4',
    icon: `<path d="M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    tips: ['自由裁切', '固定比例', '旋转 90°', '水平/垂直翻转'],
  },
  {
    title: '蒙版处理',
    desc: '添加线性或径向渐变蒙版，对局部区域独立调色，支持多层叠加，羽化边缘自然过渡。',
    color: '#f59e0b',
    icon: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 2"/><rect x="3" y="3" width="18" height="9" rx="3" fill="currentColor" fill-opacity="0.25"/>`,
    tips: ['线性渐变蒙版', '径向渐变蒙版', '羽化 / 反转', '多层叠加'],
  },
  {
    title: '滤镜套用',
    desc: '从 14 种专业预设滤镜中选择，或自定义模糊、锐化、颗粒、暗角、风格化染色等参数。',
    color: '#ef4444',
    icon: `<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    tips: ['14 种预设', '复古胶片', '港风青橙', '赛博朋克'],
  },
  {
    title: '个性化处理',
    desc: '在调色完成的图片上叠加文字、形状、贴纸等图层，支持拖拽定位、旋转缩放、透明度调节。',
    color: '#a78bfa',
    icon: `<path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    tips: ['文字图层', '形状图层', '贴纸素材', '图层管理'],
  },
  {
    title: '导出图片',
    desc: '支持 JPEG / PNG / WebP 格式导出，可设置画质、缩放比例、DPI，以及添加水印文字。',
    color: '#ec4899',
    icon: `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    tips: ['JPEG / PNG / WebP', '自定义画质', 'DPI 设置', '水印'],
  },
]

const stats = [
  { value: '7+', label: '调色参数' },
  { value: '7色', label: 'HSL 色彩范围' },
  { value: '14种', label: '预设滤镜' },
  { value: '多层', label: '蒙版叠加' },
  { value: '实时', label: 'Worker 并行处理' },
  { value: '无损', label: '原图永久保留' },
]

const capabilities = [
  {
    title: '基础调色',
    desc: '曝光、对比度、饱和度、色温、清晰度、自然饱和度、色相，覆盖日常调色全场景',
    bg: 'rgba(91,106,240,0.1)',
    color: '#5b6af0',
    icon: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    params: ['曝光', '对比度', '饱和度', '色温', '清晰度', '色相'],
  },
  {
    title: 'HSL 精细调节',
    desc: '对红、橙、黄、绿、青、蓝、紫七个色彩范围独立调整色相、饱和度、明度',
    bg: 'rgba(34,197,94,0.1)',
    color: '#22c55e',
    icon: `<path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    params: ['红', '橙', '黄', '绿', '青', '蓝', '紫'],
  },
  {
    title: '蒙版局部调色',
    desc: '线性渐变与径向渐变蒙版，对局部区域独立调色，支持多层叠加',
    bg: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    icon: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 2"/><rect x="3" y="3" width="18" height="9" rx="3" fill="currentColor" fill-opacity="0.25"/>`,
    params: ['线性蒙版', '径向蒙版', '羽化', '反转', '多层叠加'],
  },
  {
    title: '专业滤镜',
    desc: '14 种预设风格，支持模糊、锐化、颗粒、暗角、风格化染色等效果',
    bg: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    icon: `<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    params: ['复古胶片', '港风青橙', '赛博朋克', '暗角', '颗粒', '锐化'],
  },
]

const pipeline = [
  { name: '原图', detail: 'IndexedDB', color: '#475569' },
  { name: '基础调色', detail: 'basicWorker ×N', color: '#5b6af0' },
  { name: 'HSL', detail: 'hslWorker ×N', color: '#22c55e' },
  { name: '蒙版合成', detail: 'maskWorker ×N', color: '#f59e0b' },
  { name: '滤镜', detail: 'filterWorker ×N', color: '#ef4444' },
  { name: '输出', detail: 'processedSrc', color: '#a78bfa' },
]

const sliderDemo = [
  { label: '曝光', val: 35, pct: 35, color: '#5b6af0' },
  { label: '对比度', val: -20, pct: 20, color: '#22c55e' },
  { label: '色温', val: 28, pct: 28, color: '#f59e0b' },
  { label: '饱和度', val: 15, pct: 15, color: '#ec4899' },
  { label: '清晰度', val: 40, pct: 40, color: '#06b6d4' },
]
</script>

<style scoped>
.home {
  min-height: 100vh;
  height: 100%;
  background: #0f1117;
  display: flex;
  flex-direction: column;
  color: #e2e4e9;
  overflow-y: auto;
  overflow-x: hidden;
}

.home-main {
  flex: 1;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
}

/* ── Hero ── */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42vh;
  overflow: hidden;
  padding: 4rem 2rem;
  padding-top: calc(5vh + 4rem);
  width: 100%;
  background: #0a0d14;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hero-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #f8fafc;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.05rem;
  font-weight: 300;
  color: #64748b;
  margin: 0 0 2.5rem;
  letter-spacing: 0.02em;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 2.2rem;
  background: #5b6af0;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hero-cta:hover {
  background: #4a59df;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(91, 106, 240, 0.35);
}

.hero-cta svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.hero-cta:hover svg {
  transform: translateX(3px);
}

/* ── 功能模块 ── */
.modules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
}

.module-card {
  background: #0f1117;
  padding: 2.5rem 2rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.module-card:hover {
  background: #13151c;
}

.module-icon svg {
  width: 36px;
  height: 36px;
}

.module-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: #f1f5f9;
  margin: 0;
}

.module-desc {
  font-size: 0.9rem;
  font-weight: 300;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.module-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.feature-tag {
  padding: 0.2rem 0.65rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.module-arrow {
  position: absolute;
  top: 2.5rem;
  right: 2rem;
  color: #374151;
  transition: all 0.2s;
}

.module-arrow svg {
  width: 18px;
  height: 18px;
}

.module-card:hover .module-arrow {
  color: #9ca3af;
  transform: translateX(3px);
}

/* ── 工作流程 ── */
.workflow {
  padding: 5rem 2rem;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.section-title-center {
  font-size: 1.5rem;
  font-weight: 300;
  color: #94a3b8;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
  text-align: center;
}

.workflow-sub {
  font-size: 0.875rem;
  color: #374151;
  text-align: center;
  margin: 0 0 3rem;
  font-weight: 300;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  position: relative;
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(91, 106, 240, 0.4);
  background: rgba(91, 106, 240, 0.08);
  color: #5b6af0;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-body {
  padding-bottom: 2.5rem;
  flex: 1;
}

.step-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.step-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.step-body h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin: 0;
}

.step-body p {
  font-size: 0.875rem;
  font-weight: 300;
  color: #64748b;
  margin: 0 0 0.75rem;
  line-height: 1.7;
}

.step-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.step-tip {
  padding: 0.15rem 0.6rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 3px;
  font-size: 0.72rem;
  color: #6b7280;
}

.step-line {
  position: absolute;
  left: 17px;
  top: 36px;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, rgba(91, 106, 240, 0.3) 0%, rgba(91, 106, 240, 0.05) 100%);
}

/* ── 统计条 ── */
.stats-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 2rem 3rem;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.stat-item:last-child { border-right: none; }

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #f1f5f9;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.8rem;
  color: #4b5563;
  font-weight: 300;
}

/* ── 调色能力 ── */
.capabilities {
  padding: 5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.cap-header {
  margin-bottom: 3rem;
}

.cap-sub {
  font-size: 0.9rem;
  color: #4b5563;
  margin-top: 0.5rem;
  font-weight: 300;
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.cap-card {
  background: #13151c;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.2s, transform 0.2s;
}

.cap-card:hover {
  border-color: rgba(255,255,255,0.12);
  transform: translateY(-3px);
}

.cap-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cap-icon svg {
  width: 22px;
  height: 22px;
}

.cap-title {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin: 0;
}

.cap-desc {
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  font-weight: 300;
}

.cap-params {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.cap-param {
  padding: 0.15rem 0.55rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 3px;
  font-size: 0.72rem;
  color: #6b7280;
}

/* ── 处理链预览 ── */
.preview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  padding: 5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.preview-desc {
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.7;
  margin: 0.5rem 0 2rem;
  font-weight: 300;
}

.pipeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pipe-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pipe-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pipe-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.pipe-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #cbd5e1;
  min-width: 70px;
}

.pipe-detail {
  font-size: 0.75rem;
  color: #374151;
  font-family: 'Courier New', monospace;
}

.pipe-arrow {
  color: #1f2937;
  font-size: 0.75rem;
  margin-left: auto;
}

/* 滑块演示 */
.slider-demo {
  margin-bottom: 1.25rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.slider-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.slider-val {
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.slider-track {
  position: relative;
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
}

.slider-center {
  position: absolute;
  left: 50%;
  top: -2px;
  width: 1px;
  height: 8px;
  background: rgba(255,255,255,0.15);
}

.slider-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  opacity: 0.7;
}

.slider-thumb {
  position: absolute;
  top: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.4);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
}

@media (max-width: 900px) {
  .preview-section {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .stats-bar {
    justify-content: flex-start;
  }
  .stat-item {
    padding: 1.5rem 2rem;
  }
}
.home-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  font-size: 0.8rem;
  color: #374151;
}

@media (max-width: 768px) {
  .modules {
    grid-template-columns: 1fr;
  }

  .workflow {
    padding: 3rem 1.5rem;
  }
}
</style>
