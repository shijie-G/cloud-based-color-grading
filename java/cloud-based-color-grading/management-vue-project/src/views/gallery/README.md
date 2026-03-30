# 专业图库系统 (Gallery System)

## 功能概述

专业图库系统是一个基于 Vue 3 + TypeScript + IndexedDB 的本地图片管理应用，提供类似 Lightroom 的专业图库体验。

### 核心功能

- ✅ 相册管理（创建、重命名、删除、月份分组）
- ✅ 图片浏览（左侧缩略图条 + 右侧大图查看器）
- ✅ 图片操作（收藏、删除、标签、批量操作）
- ✅ 拖拽上传（支持批量上传，最多 50 张）
- ✅ 快速筛选（全部/仅收藏/最新上传）
- ✅ 多选操作（Ctrl/Cmd + 点击，Shift + 点击）
- ✅ 图片缩放旋转（鼠标滚轮缩放，双击重置）
- ✅ 本地持久化（IndexedDB 存储，无需后端）

## 目录结构

```
src/views/gallery/
├── GalleryPage.vue              # 主页面
├── components/
│   ├── AlbumCard.vue            # 相册卡片
│   ├── AlbumList.vue            # 相册列表（月份分组）
│   ├── ThumbnailStrip.vue       # 缩略图轮播条
│   ├── ImageViewer.vue          # 大图查看器
│   ├── ImageBrowser.vue         # 图片浏览视图
│   ├── QuickFilterBar.vue       # 快速筛选栏
│   ├── BatchActionBar.vue       # 批量操作栏
│   └── index.ts                 # 组件导出
├── composables/
│   ├── useGalleryDB.ts          # IndexedDB 封装
│   ├── useAlbumState.ts         # 相册状态管理
│   ├── useImageState.ts         # 图片状态管理
│   ├── useSelection.ts          # 多选状态管理
│   └── index.ts                 # Composables 导出
└── types/
    └── gallery.ts               # TypeScript 类型定义
```

## 使用指南

### 1. 创建相册

1. 在图库首页点击"新建相册"按钮
2. 输入相册名称（如 "2025-07-15"）
3. 相册将按月份自动分组展示

### 2. 上传图片

**方式一：拖拽上传**
- 进入相册后，直接将图片文件拖拽到页面任意位置
- 支持同时上传多张（最多 50 张）
- 支持格式：JPEG、PNG、WEBP、GIF

**方式二：点击上传**
- 点击上传按钮选择文件（功能待实现）

### 3. 浏览图片

- 左侧缩略图条：纵向滚动查看所有图片
- 右侧大图区：展示当前选中图片
- 鼠标滚轮：缩放图片（10% - 1000%）
- 双击图片：重置缩放和旋转
- 拖拽图片：平移查看（缩放后可用）

### 4. 图片操作

**单张操作：**
- 收藏：点击星标按钮
- 删除：点击删除按钮（移至回收站）
- 旋转：点击旋转按钮（顺时针 90°）
- 全屏：点击全屏按钮

**多选操作：**
- Ctrl/Cmd + 点击：多选/取消选择
- Shift + 点击：范围选择
- Esc 键：取消所有选择

**批量操作：**
- 批量收藏：将所有选中图片标记为收藏
- 批量删除：将所有选中图片移至回收站
- 批量移动：将选中图片移动到其他相册

### 5. 快速筛选

- 全部：显示相册内所有图片
- 仅收藏：只显示已收藏的图片
- 最新上传：显示 24 小时内上传的图片

### 6. 相册管理

- 重命名：双击相册标题进入编辑模式
- 删除：右键菜单选择删除（将同时删除相册内所有图片）
- 排序：拖拽相册卡片调整顺序（功能待实现）

## 数据结构

### AlbumRecord（相册记录）

```typescript
interface AlbumRecord {
  id: number           // 自增主键
  name: string         // 相册名称
  createdAt: number    // 创建时间戳（ms）
  sortOrder: number    // 排序权重
  coverImageId?: number // 封面图片 ID
}
```

### ImageRecord（图片记录）

```typescript
interface ImageRecord {
  id: number           // 自增主键
  albumId: number      // 所属相册 ID
  blob: Blob           // 图片二进制数据
  filename: string     // 文件名
  format: string       // 格式（jpeg/png/webp/gif）
  width: number        // 宽度（px）
  height: number       // 高度（px）
  size: number         // 文件大小（字节）
  uploadedAt: number   // 上传时间戳（ms）
  isFavorite: boolean  // 是否收藏
  favoritedAt?: number // 收藏时间戳
  isDeleted: boolean   // 是否在回收站
  deletedAt?: number   // 删除时间戳
  tags: string[]       // 标签数组
  sortOrder: number    // 排序权重
}
```

## 技术栈

- **Vue 3**: Composition API + `<script setup>`
- **TypeScript**: 完整类型支持
- **IndexedDB**: 本地数据持久化
- **CSS**: 深色主题（#16181c）

## 待实现功能

以下功能已在需求文档中定义，但尚未实现：

- [ ] 回收站视图（TrashView）
- [ ] 收藏夹视图（FavoritesView）
- [ ] 右键菜单（ContextMenu）
- [ ] 图片标签管理（添加/删除/筛选）
- [ ] 幻灯片播放模式
- [ ] 相册拖拽排序
- [ ] 图片元数据详细面板
- [ ] 全屏模式
- [ ] 图片排序选择器

## 注意事项

1. **浏览器兼容性**：需要支持 IndexedDB 的现代浏览器
2. **存储限制**：IndexedDB 存储空间受浏览器限制（通常为几 GB）
3. **性能优化**：大量图片时建议分批加载
4. **数据备份**：IndexedDB 数据存储在浏览器本地，清除浏览器数据会丢失

## 开发建议

1. 使用 Chrome DevTools 的 Application 面板查看 IndexedDB 数据
2. 测试时建议使用小尺寸图片以提高加载速度
3. 批量操作前建议先小范围测试
4. 定期导出重要图片数据（功能待实现）
