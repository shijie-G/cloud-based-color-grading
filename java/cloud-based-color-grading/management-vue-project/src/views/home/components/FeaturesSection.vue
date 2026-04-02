<template>
  <section class="features-section">
    <div class="section-header">
      <h2 class="section-title">核心功能</h2>
      <p class="section-subtitle">专业调色工具集，满足从基础到高级的全方位需求</p>
    </div>

    <div class="features-grid">
      <!-- 功能卡片 -->
      <div
        class="feature-card"
        v-for="(feature, index) in features"
        :key="index"
        @click="handleFeatureClick(feature.path)"
      >
        <div class="card-glow" :style="{ background: feature.glowColor }"></div>

        <div class="card-header">
          <div class="feature-icon-wrapper">
            <div class="feature-icon" v-html="feature.icon"></div>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
        </div>

        <p class="feature-desc">{{ feature.description }}</p>

        <ul class="feature-list">
          <li v-for="(item, idx) in feature.items" :key="idx">
            <svg class="list-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ item }}</span>
          </li>
        </ul>

        <!-- 核心指标 -->
        <div class="feature-highlights">
          <div class="highlight-item" v-for="(highlight, idx) in feature.highlights" :key="idx">
            <span class="highlight-value">{{ highlight.value }}</span>
            <span class="highlight-label">{{ highlight.label }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="feature-link">
            了解更多
            <svg class="link-arrow" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  navigate: [path: string]
}>()

const features = ref([
  {
    title: '专业调色工作站',
    description: '电影级调色工具，精准控制每一个色彩细节。提供完整的色彩调整工具链，从基础的曝光对比到高级的HSL调整，满足专业调色师的所有需求。',
    path: '/workstation',
    glowColor: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`,
    items: [
      '曝光 · 对比度 · 高光 · 阴影精细调节',
      'HSL 色相 · 饱和度 · 明度独立控制',
      '蒙版工具 · 局部调色 · 精准编辑',
      '实时预览 · 对比模式 · 历史记录'
    ],
    highlights: [
      { label: '参数精度', value: '0.01' },
      { label: '实时预览', value: '<50ms' },
      { label: '支持格式', value: '10+' }
    ]
  },
  {
    title: '多设备无缝同步',
    description: '云端存储，随时随地访问您的创作。所有调色参数和图片资源自动同步到云端，支持多设备访问，让您的创作不受设备限制。',
    path: '/gallery',
    glowColor: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    items: [
      '云端自动保存 · 永不丢失',
      '多设备实时同步 · 无缝切换',
      '智能相册管理 · 快速检索',
      '批量操作 · 高效管理'
    ],
    highlights: [
      { label: '存储空间', value: '无限' },
      { label: '同步延迟', value: '<1s' },
      { label: '设备支持', value: '全平台' }
    ]
  },
  {
    title: 'AI 智能辅助调色',
    description: '智能分析，一键生成专业调色方案。基于深度学习的AI引擎，自动识别场景类型，推荐最适合的调色方案，让专业调色变得简单。',
    path: '/workstation',
    glowColor: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    items: [
      'AI 场景识别 · 智能推荐',
      '一键风格化 · 快速出片',
      '智能色彩匹配 · 统一色调',
      '参数学习 · 个性化建议'
    ],
    highlights: [
      { label: '识别准确率', value: '95%+' },
      { label: '处理速度', value: '<3s' },
      { label: '风格库', value: '50+' }
    ]
  }
])

const handleFeatureClick = (path: string) => {
  emit('navigate', path)
}
</script>

<style scoped>
.features-section {
  padding: 8rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* 区域标题 */
.section-header {
  text-align: center;
  margin-bottom: 5rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: -0.01em;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.125rem;
  font-weight: 300;
  color: #64748b;
  letter-spacing: 0.01em;
}

/* 功能网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
}

/* 功能卡片 */
.feature-card {
  position: relative;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}

.feature-card:hover .card-glow {
  opacity: 1;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.feature-icon-wrapper {
  flex-shrink: 0;
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
}

.feature-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.feature-title {
  font-size: 1.375rem;
  font-weight: 400;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.feature-desc {
  font-size: 0.9375rem;
  font-weight: 300;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* 功能列表 */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.625rem 0;
  font-size: 0.875rem;
  font-weight: 300;
  color: #94a3b8;
  line-height: 1.6;
}

.list-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: #3b82f6;
}

/* 核心指标 */
.feature-highlights {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 0;
  margin-bottom: 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.highlight-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.highlight-value {
  font-size: 1.25rem;
  font-weight: 500;
  color: #60a5fa;
  letter-spacing: -0.01em;
}

.highlight-label {
  font-size: 0.75rem;
  font-weight: 300;
  color: #64748b;
  letter-spacing: 0.02em;
}

/* 卡片底部 */
.card-footer {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #60a5fa;
  letter-spacing: 0.02em;
  transition: gap 0.3s;
}

.feature-card:hover .feature-link {
  gap: 0.75rem;
}

.link-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.3s;
}

.feature-card:hover .link-arrow {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .features-section {
    padding: 4rem 1.5rem;
  }

  .section-header {
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 2rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
