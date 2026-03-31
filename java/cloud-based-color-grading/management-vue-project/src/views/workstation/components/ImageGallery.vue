<template>
  <div class="image-gallery" :style="{ height: galleryHeight + 'vh' }">
    <div class="gallery-header">
      <div class="header-left">
        <h3 @click="toggleAlbumSelector" class="gallery-title">
          {{ currentAlbumName }}
          <svg class="dropdown-icon" :class="{ open: showAlbumSelector }" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </h3>

        <!-- 相册选择下拉菜单 -->
        <div v-if="showAlbumSelector" class="album-selector" @click.stop>
          <div class="album-option" :class="{ active: currentAlbumId === null }" @click="selectAlbum(null)">
            <span>全部图片</span>
            <span class="album-count">{{ totalImageCount }}</span>
          </div>
          <div
            v-if="getAlbumImageCount(UNASSIGNED_ALBUM_ID) > 0"
            class="album-option"
            :class="{ active: currentAlbumId === UNASSIGNED_ALBUM_ID }"
            @click="selectAlbum(UNASSIGNED_ALBUM_ID)"
          >
            <span>非分配图片</span>
            <span class="album-count">{{ getAlbumImageCount(UNASSIGNED_ALBUM_ID) }}</span>
          </div>
          <div class="album-divider"></div>
          <div
            v-for="album in albums"
            :key="album.id"
            class="album-option"
            :class="{ active: currentAlbumId === album.id }"
            @click="selectAlbum(album.id)"
          >
            <span>{{ album.name }}</span>
            <span class="album-count">{{ getAlbumImageCount(album.id) }}</span>
          </div>
          <div v-if="albums.length === 0" class="album-empty">
            暂无相册
          </div>
        </div>
      </div>

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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { ImageItem } from '../component-interfaces'
import { imageDB, type AlbumRecord, UNASSIGNED_ALBUM_ID } from '../utils/imageDB'
import { useGalleryStore } from '@/stores/galleryStore'

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
  'album:change': [albumId: number | null]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = defineProps<ImageGalleryProps>()
const emit = defineEmits<ImageGalleryEvents>()

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

// 相册相关状态
const albums = ref<AlbumRecord[]>([])
const currentAlbumId = ref<number | null>(null)
const showAlbumSelector = ref(false)
const allImages = ref<ImageItem[]>([])
const albumImageCounts = ref<Map<number, number>>(new Map())

// 获取全局 Gallery Store
const galleryStore = useGalleryStore()

// 当前相册名称
const currentAlbumName = computed(() => {
  if (currentAlbumId.value === null) {
    return '图片全览'
  }
  if (currentAlbumId.value === UNASSIGNED_ALBUM_ID) {
    return '非分配图片'
  }
  const album = albums.value.find(a => a.id === currentAlbumId.value)
  return album ? album.name : '图片全览'
})

// 总图片数量
const totalImageCount = computed(() => {
  return allImages.value.length
})

// 加载所有相册
async function loadAlbums() {
  try {
    albums.value = await imageDB.getAllAlbums()

    // 加载所有图片以计算每个相册的图片数量
    const allImagesFromDB = await imageDB.getAllImages()
    allImages.value = allImagesFromDB.map(item => ({
      id: item.id,
      name: item.name,
      src: item.editedSrc || item.src,
      originalSrc: item.src,
      thumbnail: item.thumbnail,
      originalFile: new File([item.blob], item.name, { type: item.blob.type }),
      fileHash: item.fileHash,
    }))

    // 计算每个相册的图片数量（包括"非分配图片"）
    const counts = new Map<number, number>()
    for (const img of allImagesFromDB) {
      if (img.albumId !== undefined && !img.isDeleted) {
        counts.set(img.albumId, (counts.get(img.albumId) || 0) + 1)
      }
    }
    albumImageCounts.value = counts
  } catch (error) {
    console.error('加载相册失败:', error)
  }
}

// 获取相册图片数量
function getAlbumImageCount(albumId: number): number {
  return albumImageCounts.value.get(albumId) || 0
}

// 切换相册选择器显示
function toggleAlbumSelector() {
  showAlbumSelector.value = !showAlbumSelector.value
}

// 选择相册
function selectAlbum(albumId: number | null) {
  currentAlbumId.value = albumId
  showAlbumSelector.value = false
  // 同步到全局 store，供上传时使用
  galleryStore.setCurrentAlbumId(albumId)
  emit('album:change', albumId)
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.gallery-title') && !target.closest('.album-selector')) {
    showAlbumSelector.value = false
  }
}

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

// 组件挂载时加载相册
onMounted(() => {
  loadAlbums()
  document.addEventListener('click', handleClickOutside)
})

// 监听图片列表变化，重新加载相册数据以更新图片数量
watch(() => props.images.length, () => {
  loadAlbums()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
  position: relative;
}

.header-left {
  position: relative;
}

.gallery-title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  user-select: none;
}

.gallery-title:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.dropdown-icon {
  transition: transform 0.2s ease;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.album-selector {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 200px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.album-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.album-option:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.album-option.active {
  background-color: rgba(64, 158, 255, 0.15);
  color: #409eff;
}

.album-count {
  color: #888;
  font-size: 12px;
  margin-left: 12px;
}

.album-option.active .album-count {
  color: #409eff;
}

.album-divider {
  height: 1px;
  background: #444;
  margin: 4px 0;
}

.album-empty {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.album-selector::-webkit-scrollbar {
  width: 6px;
}

.album-selector::-webkit-scrollbar-track {
  background: #1f1f1f;
}

.album-selector::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.album-selector::-webkit-scrollbar-thumb:hover {
  background: #555;
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