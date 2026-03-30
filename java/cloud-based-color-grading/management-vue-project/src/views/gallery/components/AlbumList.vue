<script setup lang="ts">
import type { MonthGroup } from '../types/gallery'
import AlbumCard from './AlbumCard.vue'
import { UNASSIGNED_ALBUM_ID } from '@/views/workstation/utils/imageDB'

interface Props {
  monthGroups: MonthGroup[]
  unassignedCount: number  // 非分配图片数量
  albumCovers: Map<number, string>  // 相册封面 Map
}

interface Emits {
  (e: 'select', albumId: number): void
  (e: 'rename', albumId: number, newName: string): void
  (e: 'delete', albumId: number): void
  (e: 'create'): void
  (e: 'upload', albumId: number, files: File[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  return `${year}年${m}月`
}
</script>

<template>
  <div class="album-list">
    <div class="list-header">
      <h2>相册列表</h2>
      <button class="create-btn" @click="emit('create')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建相册
      </button>
    </div>

    <!-- 非分配图片特殊相册 -->
    <div v-if="unassignedCount > 0" class="special-albums">
      <div class="special-album-card" @click="emit('select', UNASSIGNED_ALBUM_ID)">
        <div class="special-album-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="special-album-info">
          <h3>非分配图片</h3>
          <p>{{ unassignedCount }} 张图片</p>
        </div>
      </div>
    </div>

    <div v-if="monthGroups.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p>暂无相册，点击"新建相册"开始</p>
    </div>

    <div v-else class="month-groups">
      <div v-for="(group, index) in monthGroups" :key="group.month" class="month-group">
        <div v-if="index > 0" class="month-divider"></div>
        <h3 class="month-title">{{ formatMonth(group.month) }}</h3>
        <div class="albums-grid">
          <AlbumCard
            v-for="album in group.albums"
            :key="album.id"
            :album="album"
            :cover-url="albumCovers.get(album.id)"
            @click="emit('select', album.id)"
            @rename="(name) => emit('rename', album.id, name)"
            @delete="emit('delete', album.id)"
            @upload="(files) => emit('upload', album.id, files)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  background: #16181c;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.list-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #e2e4e9;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: #5b6af0;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  font-weight: 500;
}

.create-btn svg {
  width: 20px;
  height: 20px;
}

.create-btn:hover {
  background: #4a59df;
  transform: translateY(-2px);
}

.special-albums {
  margin-bottom: 2rem;
}

.special-album-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #2a2d35 0%, #1f2228 100%);
  border: 1px solid rgba(91, 106, 240, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.special-album-card:hover {
  background: linear-gradient(135deg, #2f3239 0%, #24272d 100%);
  border-color: rgba(91, 106, 240, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 106, 240, 0.2);
}

.special-album-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(91, 106, 240, 0.15);
  border-radius: 8px;
  color: #5b6af0;
}

.special-album-icon svg {
  width: 28px;
  height: 28px;
}

.special-album-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e4e9;
  margin: 0 0 0.25rem 0;
}

.special-album-info p {
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #4b5563;
}

.empty-state svg {
  width: 64px;
  height: 64px;
}

.empty-state p {
  font-size: 1rem;
}

.month-groups {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.month-group {
  position: relative;
}

.month-divider {
  width: 100%;
  height: 1px;
  background: #fff;
  margin-bottom: 2rem;
}

.month-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.album-list::-webkit-scrollbar {
  width: 8px;
}

.album-list::-webkit-scrollbar-track {
  background: #1c1e22;
}

.album-list::-webkit-scrollbar-thumb {
  background: #24272d;
  border-radius: 4px;
}

.album-list::-webkit-scrollbar-thumb:hover {
  background: #2d3139;
}
</style>
