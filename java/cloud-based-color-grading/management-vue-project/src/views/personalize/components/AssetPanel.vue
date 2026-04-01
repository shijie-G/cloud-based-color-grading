<script setup lang="ts">
import { ref } from 'vue'

interface Emits {
  (e: 'addImageFromGallery'): void
  (e: 'addText'): void
  (e: 'addShape', shapeType: 'rectangle' | 'circle'): void
}

const emit = defineEmits<Emits>()
</script>

<template>
  <div class="asset-panel">
    <div class="panel-header">
      <h3>素材库</h3>
    </div>

    <div class="asset-content">
      <!-- 图片 -->
      <div class="asset-section">
        <div class="section-title">图片</div>
        <button class="asset-btn" @click="emit('addImageFromGallery')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          <span>从相册选择</span>
        </button>
      </div>

      <!-- 文字 -->
      <div class="asset-section">
        <div class="section-title">文字</div>
        <button class="asset-btn" @click="emit('addText')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>添加文字</span>
        </button>
      </div>

      <!-- 形状 -->
      <div class="asset-section">
        <div class="section-title">形状</div>
        <div class="shape-grid">
          <button class="shape-btn" @click="emit('addShape', 'rectangle')" title="矩形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="10" width="30" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>矩形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'circle')" title="圆形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>圆形</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-panel {
  width: 260px;
  background: #1c1e22;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #e2e4e9;
}

.asset-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.asset-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.asset-btn {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #e2e4e9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.asset-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.asset-btn:hover {
  background: #2a2d35;
  border-color: #5b6af0;
  color: #5b6af0;
  transform: translateY(-1px);
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.shape-btn {
  aspect-ratio: 1;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.shape-btn svg {
  width: 40px;
  height: 40px;
}

.shape-btn span {
  font-size: 0.75rem;
  font-weight: 500;
}

.shape-btn:hover {
  background: #2a2d35;
  border-color: #5b6af0;
  color: #5b6af0;
  transform: translateY(-1px);
}
</style>
