<template>
  <section class="showcase-section">
    <div class="section-header">
      <h2 class="section-title">作品案例</h2>
      <p class="section-subtitle">电影级调色效果，展现色彩的无限可能</p>
    </div>

    <div class="showcase-grid">
      <!-- 案例卡片 1 -->
      <div class="showcase-card" v-for="(item, index) in showcaseItems" :key="index">
        <div class="card-image-wrapper">
          <div class="card-image" :style="{ background: item.gradient }">
            <div class="image-overlay"></div>
          </div>
          <div class="card-badge">{{ item.category }}</div>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.description }}</p>
          <div class="card-tags">
            <span class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</span>
          </div>
          <div class="card-meta">
            <span class="meta-item">{{ item.adjustment }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showcaseItems = ref([
  {
    title: '电影级色调',
    description: '冷暖对比，营造电影氛围感。通过精准的色温调整和饱和度控制，打造专业的电影级视觉效果，适用于人像、风景等多种场景。',
    category: '调色案例',
    adjustment: '色温 +15 · 饱和度 -10 · 对比度 +8',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 50%, #4a7c9e 100%)',
    tags: ['电影感', '冷色调', '高对比']
  },
  {
    title: '日系清新',
    description: '高曝光低对比，打造柔和质感。降低饱和度，提升亮度，营造清新自然的日系风格，让画面充满温暖和治愈感。',
    category: '调色案例',
    adjustment: '曝光 +20 · 对比度 -15 · 饱和度 -8',
    gradient: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4c0 50%, #d4c4b0 100%)',
    tags: ['日系', '清新', '柔和']
  },
  {
    title: '赛博朋克',
    description: '高饱和霓虹色，科技未来感。通过强烈的色彩对比和霓虹色调，打造充满科技感的赛博朋克风格，适合夜景和城市题材。',
    category: '调色案例',
    adjustment: '饱和度 +30 · 色相偏移 · 高光染色',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #7c3aed 60%, #ec4899 100%)',
    tags: ['赛博', '霓虹', '未来感']
  },
  {
    title: '复古胶片',
    description: '颗粒质感，怀旧氛围营造。模拟胶片相机的色彩特性，添加颗粒和褪色效果，重现经典的胶片摄影质感。',
    category: '调色案例',
    adjustment: '褪色 +25 · 颗粒 +10 · 暗角 +5',
    gradient: 'linear-gradient(135deg, #8b7355 0%, #a68a6d 50%, #c4a582 100%)',
    tags: ['复古', '胶片', '怀旧']
  },
  {
    title: '黑金质感',
    description: '低调奢华，高端商业风格。深色背景配合金色高光，打造高端大气的商业摄影效果，适用于产品和人像拍摄。',
    category: '调色案例',
    adjustment: '阴影 -20 · 高光染色 · 饱和度分离',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #d4af37 80%, #f4e5c2 100%)',
    tags: ['商业', '高端', '质感']
  },
  {
    title: '莫兰迪色系',
    description: '低饱和度，高级灰调。柔和的色彩搭配，营造优雅宁静的氛围，适合静物、人像等需要展现高级感的场景。',
    category: '调色案例',
    adjustment: '饱和度 -20 · 明度调整 · 色彩平衡',
    gradient: 'linear-gradient(135deg, #b8a99a 0%, #c9b8a8 33%, #d4c4b8 66%, #e0d5ca 100%)',
    tags: ['莫兰迪', '高级灰', '优雅']
  }
])
</script>

<style scoped>
.showcase-section {
  padding: 8rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 区域标题 */
.section-header {
  text-align: center;
  margin-bottom: 4rem;
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

/* 案例网格 */
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

/* 案例卡片 */
.showcase-card {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.showcase-card:hover {
  transform: translateY(-8px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 66.67%;
  overflow: hidden;
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.showcase-card:hover .card-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.6) 100%);
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.375rem 0.875rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);
}

.card-content {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 400;
  color: #f8fafc;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.card-desc {
  font-size: 0.9375rem;
  font-weight: 300;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 300;
  color: #60a5fa;
  letter-spacing: 0.02em;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.meta-item {
  font-size: 0.8125rem;
  font-weight: 300;
  color: #475569;
  letter-spacing: 0.02em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .showcase-section {
    padding: 4rem 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .showcase-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
