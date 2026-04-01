<script setup lang="ts">
import { ref, computed } from 'vue'

interface Emits {
  (e: 'addImageFromGallery'): void
  (e: 'addText'): void
  (e: 'addShape', shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow' | 'pentagon' | 'hexagon'): void
  (e: 'addSticker', sticker: { id: string; name: string; url: string; category: string }): void
}

const emit = defineEmits<Emits>()

// 贴纸数据
const stickerCategories = ref([
  { id: 'all', name: '全部' },
  { id: 'emoji', name: '表情' },
  { id: 'decoration', name: '装饰' },
])

const selectedStickerCategory = ref('all')

const stickers = ref([
  // 表情类
  { id: '1', name: '笑脸', url: 'https://em-content.zobj.net/thumbs/240/apple/354/grinning-face_1f600.png', category: 'emoji' },
  { id: '2', name: '爱心眼', url: 'https://em-content.zobj.net/thumbs/240/apple/354/smiling-face-with-heart-eyes_1f60d.png', category: 'emoji' },
  { id: '3', name: '酷', url: 'https://em-content.zobj.net/thumbs/240/apple/354/smiling-face-with-sunglasses_1f60e.png', category: 'emoji' },
  { id: '4', name: '思考', url: 'https://em-content.zobj.net/thumbs/240/apple/354/thinking-face_1f914.png', category: 'emoji' },
  { id: '5', name: '哭笑', url: 'https://em-content.zobj.net/thumbs/240/apple/354/face-with-tears-of-joy_1f602.png', category: 'emoji' },
  { id: '6', name: '火', url: 'https://em-content.zobj.net/thumbs/240/apple/354/fire_1f525.png', category: 'emoji' },
  { id: '7', name: '爱心', url: 'https://em-content.zobj.net/thumbs/240/apple/354/red-heart_2764-fe0f.png', category: 'emoji' },
  { id: '8', name: '星星', url: 'https://em-content.zobj.net/thumbs/240/apple/354/star_2b50.png', category: 'emoji' },
  { id: '9', name: '闪电', url: 'https://em-content.zobj.net/thumbs/240/apple/354/high-voltage_26a1.png', category: 'emoji' },
  { id: '10', name: '彩虹', url: 'https://em-content.zobj.net/thumbs/240/apple/354/rainbow_1f308.png', category: 'emoji' },
  { id: '11', name: '皇冠', url: 'https://em-content.zobj.net/thumbs/240/apple/354/crown_1f451.png', category: 'decoration' },
  { id: '12', name: '钻石', url: 'https://em-content.zobj.net/thumbs/240/apple/354/gem-stone_1f48e.png', category: 'decoration' },
])

const filteredStickers = computed(() => {
  if (selectedStickerCategory.value === 'all') {
    return stickers.value
  }
  return stickers.value.filter(s => s.category === selectedStickerCategory.value)
})

function handleStickerClick(sticker: typeof stickers.value[0]) {
  emit('addSticker', sticker)
}
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
              <rect x="8" y="12" width="24" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>矩形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'circle')" title="圆形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>圆形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'triangle')" title="三角形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8 L32 30 L8 30 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>三角形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'star')" title="星形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6 L23 16 L33 16 L25 22 L28 32 L20 26 L12 32 L15 22 L7 16 L17 16 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>星形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'heart')" title="心形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 32 C20 32 6 24 6 14 C6 8 10 6 14 8 C17 9 19 12 20 14 C21 12 23 9 26 8 C30 6 34 8 34 14 C34 24 20 32 20 32 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>心形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'arrow')" title="箭头">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 20 L24 20 M24 20 L18 14 M24 20 L18 26" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>箭头</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'pentagon')" title="五边形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8 L32 16 L28 30 L12 30 L8 16 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>五边形</span>
          </button>
          <button class="shape-btn" @click="emit('addShape', 'hexagon')" title="六边形">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 10 L26 10 L32 20 L26 30 L14 30 L8 20 Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>六边形</span>
          </button>
        </div>
      </div>

      <!-- 贴纸 -->
      <div class="asset-section">
        <div class="section-title">贴纸</div>

        <!-- 分类标签 -->
        <div class="sticker-categories">
          <button
            v-for="cat in stickerCategories"
            :key="cat.id"
            :class="['category-tag', { active: selectedStickerCategory === cat.id }]"
            @click="selectedStickerCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- 贴纸网格 -->
        <div class="sticker-grid">
          <div
            v-for="sticker in filteredStickers"
            :key="sticker.id"
            class="sticker-item"
            @click="handleStickerClick(sticker)"
            :title="sticker.name"
          >
            <img :src="sticker.url" :alt="sticker.name" />
          </div>
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
  gap: 0.5rem;
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

.sticker-categories {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.category-tag {
  padding: 0.25rem 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #9ca3af;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}

.category-tag:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.category-tag.active {
  background: #5b6af0;
  border-color: #5b6af0;
  color: white;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.sticker-item {
  aspect-ratio: 1;
  background: #24272d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  transition: all 0.2s;
}

.sticker-item:hover {
  background: #2a2d35;
  border-color: #5b6af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.2);
}

.sticker-item img {
  width: 70%;
  height: 70%;
  object-fit: contain;
  pointer-events: none;
}
</style>
