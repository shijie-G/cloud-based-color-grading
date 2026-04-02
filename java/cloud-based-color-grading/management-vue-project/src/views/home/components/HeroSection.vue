<template>
  <section class="hero-section">
    <!-- 背景光晕效果 -->
    <div class="hero-glow"></div>
    <div class="hero-glow-secondary"></div>

    <!-- 主标题区域 -->
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-main">云端调色系统</span>
        <span class="title-en">Professional Color Grading Platform</span>
      </h1>

      <p class="hero-subtitle">
        <span class="subtitle-item">电影级调色工具</span>
        <span class="subtitle-divider">·</span>
        <span class="subtitle-item">多设备无缝同步</span>
        <span class="subtitle-divider">·</span>
        <span class="subtitle-item">AI智能辅助</span>
      </p>

      <div class="hero-actions">
        <button class="cta-primary" @click="handleStartClick">
          <span class="cta-text">进入工作站</span>
          <svg class="cta-icon" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 核心特性标签 -->
      <div class="hero-features">
        <div class="feature-tag">
          <svg class="tag-icon" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>实时预览</span>
        </div>
        <div class="feature-tag">
          <svg class="tag-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>云端存储</span>
        </div>
        <div class="feature-tag">
          <svg class="tag-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>高效协作</span>
        </div>
      </div>
    </div>

    <!-- 装饰性网格 -->
    <div class="hero-grid"></div>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  navigate: [path: string]
}>()

const handleStartClick = () => {
  emit('navigate', '/workstation')
}
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4rem 2rem;
}

/* 背景光晕效果 */
.hero-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  animation: pulse 8s ease-in-out infinite;
}

.hero-glow-secondary {
  position: absolute;
  bottom: -10%;
  right: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  filter: blur(100px);
  pointer-events: none;
  animation: pulse 10s ease-in-out infinite reverse;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateX(-50%) scale(1.1);
  }
}

/* 主内容区域 */
.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.title-main {
  font-size: 4.5rem;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #f8fafc;
  line-height: 1.1;
  background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-en {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  color: #64748b;
  text-transform: uppercase;
}

.hero-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.125rem;
  color: #94a3b8;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.subtitle-item {
  font-weight: 300;
}

.subtitle-divider {
  color: #475569;
  font-weight: 300;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #60a5fa;
  font-size: 1rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.cta-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s;
}

.cta-primary:hover::before {
  left: 100%;
}

.cta-primary:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.cta-text {
  letter-spacing: 0.02em;
}

.cta-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s;
}

.cta-primary:hover .cta-icon {
  transform: translateX(4px);
}

/* 装饰性网格 */
.hero-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%);
}

/* 核心特性标签 */
.hero-features {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 4rem;
  flex-wrap: wrap;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.feature-tag:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(15, 23, 42, 0.8);
}

.tag-icon {
  width: 18px;
  height: 18px;
  color: #60a5fa;
}

.feature-tag span {
  font-size: 0.875rem;
  font-weight: 300;
  color: #cbd5e1;
  letter-spacing: 0.02em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    min-height: 70vh;
    padding: 3rem 1.5rem;
  }

  .title-main {
    font-size: 2.5rem;
  }

  .title-en {
    font-size: 0.875rem;
  }

  .hero-subtitle {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .subtitle-divider {
    display: none;
  }

  .cta-primary {
    padding: 0.875rem 2rem;
    font-size: 0.9375rem;
  }

  .hero-features {
    gap: 1rem;
    margin-top: 3rem;
  }

  .feature-tag {
    padding: 0.625rem 1.25rem;
  }

  .tag-icon {
    width: 16px;
    height: 16px;
  }

  .feature-tag span {
    font-size: 0.8125rem;
  }
}
</style>
