<template>
  <div class="image-gallery" :style="{ height: galleryHeight + 'vh' }">
    <div class="gallery-header">
      <h3>图片全览</h3>
      <div class="gallery-controls">
        <span class="image-count">{{ images.length }} 张图片</span>
        <button class="reset-layout-btn" @click="handleResetLayout" title="重置布局">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </button>
        <button class="add-image-btn" @click="handleAddImage" title="添加图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <button class="add-image-btn" :class="{ active: compareActive }" @click="$emit('action:toggleCompare')" title="对比原图">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="18" rx="2"/>
            <path d="M12 3v18" stroke-linecap="round"/>
            <path d="M7 8h3M7 12h3M7 16h3" stroke-linecap="round"/>
            <path d="M14 8h3M14 12h3M14 16h3" stroke-linecap="round" stroke-dasharray="2 1"/>
          </svg>
        </button>
      </div>
      
      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>
    
    <div class="gallery-content">
      <div class="image-grid">
        <div 
          v-for="image in images" 
          :key="image.id"
          class="gallery-item"
          :class="{ active: selectedImageId === image.id }"
          :style="itemStyle"
          @click="handleSelectImage(image)"
        >
          <img :src="image.thumbnail || image.src" :alt="image.name" />
          <div class="image-overlay">
            <span class="image-name">{{ image.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageItem } from '../component-interfaces'

// ImageGallery 组件 - 图片全览区
interface ImageGalleryProps {
  images: ImageItem[]
  selectedImageId: number | null
  galleryHeight: number
  compareActive?: boolean
}

interface ImageGalleryEvents {
  'action:selectImage': [image: ImageItem]
  'action:addImage': [file: File]
  'layout:resetLayout': []
  'action:toggleCompare': []
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ImageGalleryProps>()
const emit = defineEmits<ImageGalleryEvents>()

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

// 计算图片项的动态样式（16:9比例）
const itemStyle = computed(() => {
  // 图片全览区的总高度（vh）
  const totalHeight = props.galleryHeight
  
  // 固定高度值（改为像素）
  const headerHeightPx = 8 + 8 + 1  // padding-top + padding-bottom + border = 17px
  const contentPaddingPx = 8 + 8    // padding-top + padding-bottom = 16px
  
  // 将vh转换为像素
  const totalHeightPx = (totalHeight / 100) * window.innerHeight
  
  // 计算可用内容高度（像素）
  const contentHeightPx = totalHeightPx - headerHeightPx - contentPaddingPx
  
  // 图片项的高度为内容高度的85%（确保不超出）
  const itemHeightPx = contentHeightPx * 0.85
  
  // 根据16:9比例计算宽度
  const itemWidthPx = (itemHeightPx * 16) / 9
  
  return {
    width: `${itemWidthPx}px`,
    height: `${itemHeightPx}px`
  }
})

// 处理图片选择
const handleSelectImage = (image: ImageItem) => {
  emit('action:selectImage', image)
}

// 处理重置布局
const handleResetLayout = () => {
  emit('layout:resetLayout')
}

// 处理添加图片按钮点击
const handleAddImage = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('action:addImage', file)
  }
  // 清空input值，允许重复选择同一文件
  if (target) {
    target.value = ''
  }
}
</script>

<style scoped>
.image-gallery {
  background-color: #333;
  display: flex;
  flex-direction: column;
  min-height: 16vh;
  max-height: 35vh;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 1.5vw;
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
  flex-shrink: 0;
}

.gallery-header h3 {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.gallery-controls {
  display: flex;
  align-items: center;
  gap: 1vw;
}

.image-count {
  color: #aaa;
  font-size: 12px;
}

.reset-layout-btn {
  background: none;
  border: 1px solid #555;
  color: #aaa;
  padding: 0.4vh 0.6vw;
  border-radius: 0.3vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  outline: none;
}

.reset-layout-btn:hover {
  background-color: #444;
  border-color: #666;
  color: #fff;
}

.reset-layout-btn:focus {
  outline: none;
  border-color: #555;
}

.add-image-btn {
  background: none;
  border: 1px solid #555;
  color: #aaa;
  padding: 0.4vh 0.6vw;
  border-radius: 0.3vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  outline: none;
}

.add-image-btn:hover {
  background-color: #444;
  border-color: #666;
  color: #fff;
}

.add-image-btn:focus {
  outline: none;
  border-color: #555;
}

.add-image-btn.active {
  background-color: rgba(91, 106, 240, 0.2);
  border-color: rgba(91, 106, 240, 0.5);
  color: #a5b0ff;
}

.gallery-content {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 1vh;
  display: flex;
  align-items: center;
  min-height: 0;
}

.image-grid {
  display: flex;
  gap: 0.8vw;
  align-items: center;
}

.gallery-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #000;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  flex-shrink: 0;
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.gallery-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 8px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(64, 158, 255, 0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4);
}

.gallery-item:hover::before {
  opacity: 1;
}

.gallery-item.active {
  border-color: #409eff;
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.5), 0 4px 16px rgba(0, 0, 0, 0.5);
  background: linear-gradient(135deg, #2a3a3d 0%, #1f2a2f 100%);
}

.gallery-item.active::before {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.5), rgba(64, 158, 255, 0.3));
  opacity: 1;
}

.gallery-item img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  filter: brightness(0.95);
  transition: filter 0.3s ease;
}

.gallery-item:hover img {
  filter: brightness(1.05);
}

.gallery-item.active img {
  filter: brightness(1.1) contrast(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 0.8vh 0.6vw 0.4vh;
  transform: translateY(100%);
  transition: transform 0.2s ease;
}

.gallery-item:hover .image-overlay {
  transform: translateY(0);
}

.image-name {
  color: #fff;
  font-size: 11px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>