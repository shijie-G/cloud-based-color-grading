<template>
  <section class="workflow-section">
    <div class="section-header">
      <h2 class="section-title">使用流程</h2>
      <p class="section-subtitle">三步开启专业调色之旅</p>
    </div>

    <div class="workflow-container">
      <div class="workflow-step" v-for="(step, index) in steps" :key="index">
        <div class="step-number-wrapper">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-line" v-if="index < steps.length - 1"></div>
        </div>

        <div class="step-content">
          <div class="step-icon" v-html="step.icon"></div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.description }}</p>
          <ul class="step-details">
            <li v-for="(detail, idx) in step.details" :key="idx">{{ detail }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 快速开始按钮 -->
    <div class="workflow-cta">
      <button class="start-button" @click="handleStartClick">
        <span>立即开始</span>
        <svg class="button-icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  navigate: [path: string]
}>()

const steps = ref([
  {
    title: '上传图片',
    description: '支持多种格式，拖拽即可上传',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    details: [
      '支持 JPG、PNG、TIFF、RAW 等格式',
      '单张或批量上传，最大支持 50MB',
      '拖拽上传，操作简单快捷'
    ]
  },
  {
    title: '调整参数',
    description: '使用专业工具进行精细调色',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    details: [
      '基础调整：曝光、对比度、饱和度等',
      'HSL 调整：精准控制色相、饱和度、明度',
      '蒙版工具：局部调色，精准编辑'
    ]
  },
  {
    title: '保存导出',
    description: '云端保存或导出到本地',
    icon: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    details: [
      '自动保存到云端，永不丢失',
      '导出多种格式：JPG、PNG、TIFF',
      '自定义导出质量和尺寸'
    ]
  }
])

const handleStartClick = () => {
  emit('navigate', '/workstation')
}
</script>

<style scoped>
.workflow-section {
  padding: 8rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

/* 流程容器 */
.workflow-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin-bottom: 4rem;
}

.workflow-step {
  display: flex;
  gap: 2rem;
  position: relative;
}

/* 步骤编号 */
.step-number-wrapper {
  position: relative;
  flex-shrink: 0;
}

.step-number {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 500;
  color: #60a5fa;
  backdrop-filter: blur(10px);
}

.step-line {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: calc(100% + 3rem);
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%);
}

/* 步骤内容 */
.step-content {
  flex: 1;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 2.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.step-content:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(8px);
}

.step-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1.5rem;
  color: #60a5fa;
}

.step-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 400;
  color: #f8fafc;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}

.step-desc {
  font-size: 1rem;
  font-weight: 300;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.step-details {
  list-style: none;
  padding: 0;
  margin: 0;
}

.step-details li {
  font-size: 0.9375rem;
  font-weight: 300;
  color: #94a3b8;
  line-height: 1.8;
  padding-left: 1.5rem;
  position: relative;
}

.step-details li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6rem;
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
}

/* 快速开始按钮 */
.workflow-cta {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
}

.start-button {
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
}

.start-button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.button-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s;
}

.start-button:hover .button-icon {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-section {
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

  .workflow-container {
    gap: 2rem;
  }

  .workflow-step {
    flex-direction: column;
    gap: 1rem;
  }

  .step-number-wrapper {
    align-self: flex-start;
  }

  .step-line {
    display: none;
  }

  .step-content {
    padding: 2rem;
  }

  .step-content:hover {
    transform: translateX(0);
    transform: translateY(-4px);
  }
}
</style>
