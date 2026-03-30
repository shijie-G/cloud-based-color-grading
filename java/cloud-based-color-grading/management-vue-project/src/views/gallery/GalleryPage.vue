<script setup lang="ts">
// Gallery 页面 - 图库管理

</script>

<template>

</template>

<style scoped>
.gallery-page {
  width: 100%;
  height: 100%;
  padding: 2rem;
  background: #16181c;
  overflow-y: auto;
}

.gallery-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: #5b6af0;
  flex-shrink: 0;
}

.gallery-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #e2e4e9;
  letter-spacing: 0.5px;
}

.gallery-subtitle {
  font-size: 0.95rem;
  color: #9ca3af;
  padding-left: 2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.gallery-item {
  background: #1c1e22;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}

.gallery-item:hover {
  border-color: rgba(91, 106, 240, 0.3);
  transform: translateY(-4px);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #24272d;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .image-overlay {
  opacity: 1;
}

.view-icon {
  width: 32px;
  height: 32px;
  color: #5b6af0;
}

.view-text {
  color: #e2e4e9;
  font-size: 0.9rem;
  font-weight: 500;
}

.image-info {
  padding: 1rem;
  background: #1c1e22;
}

.image-title {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e4e9;
  margin-bottom: 0.5rem;
}

.image-date {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* 详情弹窗 */
.image-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.modal-content {
  position: relative;
  background: #1c1e22;
  border-radius: 12px;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #e2e4e9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.close-btn:hover {
  background: rgba(91, 106, 240, 0.8);
}

.detail-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  background: #24272d;
}

.detail-info {
  padding: 1.5rem;
  background: #1c1e22;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-info h2 {
  font-size: 1.25rem;
  color: #e2e4e9;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.detail-info p {
  color: #9ca3af;
  font-size: 0.9rem;
}

/* 滚动条样式 */
.gallery-page::-webkit-scrollbar {
  width: 8px;
}

.gallery-page::-webkit-scrollbar-track {
  background: #1c1e22;
}

.gallery-page::-webkit-scrollbar-thumb {
  background: #24272d;
  border-radius: 4px;
}

.gallery-page::-webkit-scrollbar-thumb:hover {
  background: #2d3139;
}
</style>
