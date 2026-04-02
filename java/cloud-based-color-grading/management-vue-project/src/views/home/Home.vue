<template>
  <div class="home-page">
    <!-- 全局导航栏 -->
    <GlobalNavbar />

    <!-- 主要内容区域 -->
    <div class="home-content">
      <!-- Hero 区域 -->
      <HeroSection @navigate="handleNavigate" />

      <!-- 作品案例展示 -->
      <ShowcaseSection />

      <!-- 核心功能展示 -->
      <FeaturesSection @navigate="handleNavigate" />

      <!-- 页脚 -->
      <footer class="home-footer">
        <div class="footer-content">
          <p class="footer-text">© 2026 云端调色系统 · Professional Color Grading Platform</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import HeroSection from './components/HeroSection.vue'
import ShowcaseSection from './components/ShowcaseSection.vue'
import FeaturesSection from './components/FeaturesSection.vue'

const router = useRouter()

const handleNavigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background: #0f172a;
  background-image:
    radial-gradient(at 0% 0%, rgba(30, 58, 138, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(67, 56, 202, 0.1) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(30, 58, 138, 0.15) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(67, 56, 202, 0.1) 0px, transparent 50%);
  overflow-x: hidden;
}

.home-content {
  padding-top: 5vh;
}

/* 页脚 */
.home-footer {
  padding: 4rem 2rem 3rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  margin-top: 6rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  font-size: 0.875rem;
  font-weight: 300;
  color: #475569;
  letter-spacing: 0.02em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-footer {
    padding: 3rem 1.5rem 2rem;
    margin-top: 4rem;
  }

  .footer-text {
    font-size: 0.8125rem;
  }
}
</style>
