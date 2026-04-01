<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Sticker {
  id: string
  name: string
  url: string
  category: string
}

interface Emits {
  (e: 'select', sticker: Sticker): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'emoji', name: '表情' },
  { id: 'decoration', name: '装饰' },
  { id: 'icon', name: '图标' },
  { id: 'custom', name: '自定义' }
])

const selectedCategory = ref('all')
const stickers = ref<Sticker[]>([])
const loading = ref(false)

// 模拟贴纸数据（实际项目中应该从服务器加载）
const mockStickers: Sticker[] = [
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
]

onMounted(() => {
  loadStickers()
})

function loadStickers() {
  loading.value = true
  // 模拟加载
  setTimeout(() => {
    stickers.value = mockStickers
    loading.value = false
  }, 300)
}

const filteredStickers = computed(() => {
  if (selectedCategory.value === 'all') {
    return stickers.value
  }
  return stickers.value.filter(s => s.category === selectedCategory.value)
})

function handleStickerSelect(sticker: Sticker) {
  emit('select', sticker)
  emit('close')
}
</script>

<template>
  <div class="sticker-selector-overlay" @click.self="emit('close')">
    <div class="sticker-selector-modal">
      <div class="modal-header">
        <h3>选择贴纸</h3>
        <button class="close-btn" @click="emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 分类选择 -->
        <div class="category-tabs">
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['category-tab', { active: selectedCategory === cat.id }]"
            @click="selectedCategory = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- 贴纸网格 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredStickers.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd" />
          </svg>
          <p>该分类暂无贴纸</p>
        </div>

        <div v-else class="sticker-grid">
          <div
            v-for="sticker in filteredStickers"
            :key="sticker.id"
            class="sticker-item"
            @click="handleStickerSelect(sticker)"
          >
            <img :src="sticker.url" :alt="sticker.name" />
            <span class="sticker-name">{{ sticker.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticker-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.sticker-selector-modal {
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  background: #1c1e22;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #e2e4e9;
}

.close-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.category-tab {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #24272d;
  color: #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.category-tab.active {
  background: #5b6af0;
  border-color: #5b6af0;
  color: white;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #5b6af0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.sticker-item {
  aspect-ratio: 1;
  background: #24272d;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  transition: all 0.2s;
}

.sticker-item:hover {
  background: #2a2d35;
  border-color: #5b6af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.2);
}

.sticker-item img {
  width: 60%;
  height: 60%;
  object-fit: contain;
}

.sticker-name {
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
}
</style>
