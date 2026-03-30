# 需求文档

## 简介

本功能为 Vue 3 管理系统中的专业图库模块（GalleryPage），参考 Lightroom / Photoshop / 像素蛋糕等专业图库界面风格，提供完整的图片管理、浏览、编辑辅助能力。系统采用深色主题（背景色 #16181c），所有数据持久化至 IndexedDB，无需后端接口。

---

## 词汇表

- **Gallery_System**：整个专业图库系统，即 GalleryPage 及其所有子组件的集合
- **Album**：相册，以日期命名的图片集合（如 "2025-07-15"），是图片的基本组织单元
- **Month_Group**：月份分组，将同月的相册聚合展示，相邻月份组之间以白线分隔
- **Thumbnail_Strip**：左侧缩略图轮播条，占页面宽度 25%，纵向滚动切换图片
- **Image_Viewer**：右侧大图展示区，占页面宽度 75%
- **Favorites**：收藏夹，独立视图，汇聚所有被收藏的图片
- **Trash**：回收站，存放已删除但未永久清除的图片
- **Tag**：标签，用户自定义的图片分类关键词
- **IndexedDB_Store**：浏览器本地 IndexedDB 数据库，用于持久化所有图库数据
- **Context_Menu**：右键菜单，提供快捷操作入口
- **Slideshow**：幻灯片播放模式，自动轮播当前相册图片
- **Quick_Filter**：顶部快速筛选栏，提供"全部 / 仅收藏 / 最新上传"三种视图切换

---

## 需求

### 需求 1：相册列表与月份分组展示

**用户故事：** 作为用户，我希望在图库首页按月份分组查看所有相册，以便快速定位特定时间段的图片。

#### 验收标准

1. THE Gallery_System SHALL 在图库首页将所有相册按创建日期降序排列，每个相册以其日期（格式 YYYY-MM-DD）作为标题展示。
2. THE Gallery_System SHALL 将同一自然月内的相册归入同一 Month_Group，并在相邻 Month_Group 之间渲染一条宽度为 1px 的白色分隔线。
3. WHEN 用户点击某个 Album 卡片，THE Gallery_System SHALL 进入该相册的图片浏览视图，展示该相册内的所有图片。
4. IF 图库中不存在任何相册，THEN THE Gallery_System SHALL 显示空状态提示文案，引导用户上传图片。

---

### 需求 2：图片浏览视图（左侧缩略图条 + 右侧大图）

**用户故事：** 作为用户，我希望在相册内以左右分栏方式浏览图片，以便高效预览和选择图片。

#### 验收标准

1. THE Gallery_System SHALL 将图片浏览视图分为左右两栏：Thumbnail_Strip 占视口宽度的 25%，Image_Viewer 占视口宽度的 75%。
2. THE Thumbnail_Strip SHALL 纵向排列当前相册的所有图片缩略图，支持鼠标滚轮和触摸滑动切换。
3. WHEN 用户在 Thumbnail_Strip 中选中某张图片，THE Thumbnail_Strip SHALL 将该缩略图放大至 1.15 倍并添加高亮边框，同时 Image_Viewer SHALL 展示该图片的原始尺寸大图。
4. WHERE 图片已被收藏，THE Thumbnail_Strip SHALL 为该图片缩略图渲染红色边框（颜色值 #ef4444）。
5. WHEN 用户在 Image_Viewer 中选中图片，THE Gallery_System SHALL 在图片下方显示操作栏，包含"删除"和"收藏/取消收藏"两个按钮。
6. WHEN 用户点击"收藏"按钮，THE Gallery_System SHALL 将该图片的 `isFavorite` 字段置为 `true` 并持久化至 IndexedDB_Store。
7. WHEN 用户点击"取消收藏"按钮，THE Gallery_System SHALL 将该图片的 `isFavorite` 字段置为 `false` 并持久化至 IndexedDB_Store。
8. WHEN 用户点击"删除"按钮，THE Gallery_System SHALL 将该图片移入 Trash，而非立即永久删除。

---

### 需求 3：图片多选与批量操作

**用户故事：** 作为用户，我希望能同时选中多张图片并批量执行操作，以便提升管理效率。

#### 验收标准

1. WHEN 用户按住 Ctrl 键（macOS 为 Cmd 键）并点击缩略图，THE Gallery_System SHALL 将该图片加入或移出多选集合。
2. WHEN 用户按住 Shift 键并点击缩略图，THE Gallery_System SHALL 将上次选中图片到当前图片之间的所有图片加入多选集合。
3. WHILE 多选集合中存在至少一张图片，THE Gallery_System SHALL 在顶部显示批量操作栏，包含"批量删除"、"批量收藏"、"批量移动相册"三个操作按钮，并显示已选中数量。
4. WHEN 用户点击"批量删除"，THE Gallery_System SHALL 将多选集合中的所有图片移入 Trash。
5. WHEN 用户点击"批量收藏"，THE Gallery_System SHALL 将多选集合中所有未收藏图片的 `isFavorite` 置为 `true` 并持久化至 IndexedDB_Store。
6. WHEN 用户点击"批量移动相册"，THE Gallery_System SHALL 弹出相册选择对话框，用户确认后将所选图片的 `albumId` 更新为目标相册 ID 并持久化至 IndexedDB_Store。
7. WHEN 用户按下 Escape 键，THE Gallery_System SHALL 清空多选集合并隐藏批量操作栏。

---

### 需求 4：相册管理（新建、重命名、拖拽排序）

**用户故事：** 作为用户，我希望能自由管理相册，以便按需组织图片。

#### 验收标准

1. WHEN 用户点击"新建相册"按钮，THE Gallery_System SHALL 弹出输入框，用户输入名称后创建新相册并持久化至 IndexedDB_Store。
2. IF 用户输入的相册名称为空字符串，THEN THE Gallery_System SHALL 阻止创建并显示错误提示"相册名称不能为空"。
3. WHEN 用户双击相册标题，THE Gallery_System SHALL 将标题切换为可编辑输入框，用户确认后更新相册名称并持久化至 IndexedDB_Store。
4. WHEN 用户拖拽相册卡片并释放到目标位置，THE Gallery_System SHALL 更新相册的 `sortOrder` 字段并持久化至 IndexedDB_Store，列表随即按新顺序重新渲染。
5. IF 用户输入的重命名内容为空字符串，THEN THE Gallery_System SHALL 恢复原相册名称并显示错误提示"相册名称不能为空"。

---

### 需求 5：大图查看器高级功能（缩放、旋转、全屏、幻灯片）

**用户故事：** 作为用户，我希望在查看大图时拥有专业级的浏览控制能力，以便精细审阅图片。

#### 验收标准

1. WHEN 用户在 Image_Viewer 中滚动鼠标滚轮，THE Image_Viewer SHALL 以鼠标位置为中心对图片进行缩放，缩放范围为 10% 至 1000%。
2. WHEN 用户点击"旋转"按钮，THE Image_Viewer SHALL 将图片顺时针旋转 90 度，旋转状态仅影响当前浏览会话，不修改原始文件。
3. WHEN 用户点击"全屏"按钮，THE Gallery_System SHALL 调用浏览器全屏 API 进入全屏模式，Image_Viewer 占满整个屏幕。
4. WHEN 用户在全屏模式下按下 Escape 键，THE Gallery_System SHALL 退出全屏模式并恢复正常布局。
5. WHEN 用户点击"幻灯片播放"按钮，THE Gallery_System SHALL 以 3 秒为间隔自动切换当前相册中的图片，并在 Image_Viewer 中展示。
6. WHEN 幻灯片播放中用户点击"停止"按钮，THE Gallery_System SHALL 立即停止自动切换并保持当前图片。
7. WHEN 用户双击 Image_Viewer 中的图片，THE Gallery_System SHALL 将缩放比例重置为 100%。

---

### 需求 6：独立收藏夹视图

**用户故事：** 作为用户，我希望有一个独立的收藏夹页面，以便集中查看所有收藏图片。

#### 验收标准

1. THE Gallery_System SHALL 在导航区提供"收藏夹"入口，点击后进入 Favorites 视图。
2. THE Favorites SHALL 展示所有 `isFavorite` 为 `true` 的图片，按收藏时间降序排列。
3. WHEN 用户在 Favorites 视图中取消收藏某张图片，THE Gallery_System SHALL 将该图片从 Favorites 视图中移除，并将 `isFavorite` 置为 `false` 持久化至 IndexedDB_Store。
4. IF Favorites 中不存在任何图片，THEN THE Gallery_System SHALL 显示空状态提示"暂无收藏图片"。

---

### 需求 7：图片元数据展示

**用户故事：** 作为用户，我希望查看图片的详细信息，以便了解图片属性。

#### 验收标准

1. WHEN 用户选中某张图片，THE Gallery_System SHALL 在信息面板中展示该图片的以下字段：文件名、图片尺寸（宽 × 高，单位 px）、文件格式（如 JPEG / PNG / WEBP）、文件大小（单位 KB，保留一位小数）、上传时间（格式 YYYY-MM-DD HH:mm）。
2. THE Gallery_System SHALL 在图片上传时自动提取并存储上述元数据至 IndexedDB_Store。
3. IF 某字段无法获取，THEN THE Gallery_System SHALL 在对应位置显示占位符"—"。

---

### 需求 8：拖拽上传多图

**用户故事：** 作为用户，我希望通过拖拽方式批量上传图片，以便快速导入素材。

#### 验收标准

1. WHEN 用户将图片文件拖拽至 Gallery_System 的上传区域并释放，THE Gallery_System SHALL 读取所有拖入的图片文件并将其归入当前激活相册。
2. THE Gallery_System SHALL 支持同时拖入多个图片文件（JPEG、PNG、WEBP、GIF 格式），单次上传数量上限为 50 张。
3. IF 拖入的文件包含非图片格式，THEN THE Gallery_System SHALL 跳过该文件并在上传完成后显示提示"X 个文件格式不支持，已跳过"。
4. WHILE 图片正在上传处理中，THE Gallery_System SHALL 显示进度指示器，展示已处理数量与总数量（格式：X / Y）。
5. WHEN 所有图片处理完成，THE Gallery_System SHALL 隐藏进度指示器并刷新当前相册的缩略图列表。

---

### 需求 9：图片排序

**用户故事：** 作为用户，我希望能按不同维度对图片排序，以便快速找到目标图片。

#### 验收标准

1. THE Gallery_System SHALL 提供排序选择器，支持以下排序方式：按上传时间升序、按上传时间降序、按文件大小升序、按文件大小降序、收藏优先。
2. WHEN 用户选择某种排序方式，THE Gallery_System SHALL 立即按所选规则重新排列当前视图中的图片，无需刷新页面。
3. THE Gallery_System SHALL 将用户最后一次选择的排序方式持久化至 IndexedDB_Store，下次进入同一相册时自动应用。

---

### 需求 10：回收站功能

**用户故事：** 作为用户，我希望误删的图片能在回收站中恢复，以防止数据丢失。

#### 验收标准

1. THE Gallery_System SHALL 在导航区提供"回收站"入口，点击后进入 Trash 视图。
2. THE Trash SHALL 展示所有已删除图片，按删除时间降序排列，并显示每张图片的删除时间。
3. WHEN 用户点击回收站中某张图片的"恢复"按钮，THE Gallery_System SHALL 将该图片的 `isDeleted` 置为 `false`，恢复至原相册，并持久化至 IndexedDB_Store。
4. WHEN 用户点击"永久删除"按钮，THE Gallery_System SHALL 弹出确认对话框，用户确认后从 IndexedDB_Store 中彻底删除该图片记录及其 Blob 数据。
5. WHEN 用户点击"清空回收站"按钮，THE Gallery_System SHALL 弹出确认对话框，用户确认后永久删除 Trash 中的所有图片。
6. IF Trash 中不存在任何图片，THEN THE Gallery_System SHALL 显示空状态提示"回收站为空"。

---

### 需求 11：图片标签与标签筛选

**用户故事：** 作为用户，我希望为图片添加自定义标签并按标签筛选，以便灵活分类管理图片。

#### 验收标准

1. WHEN 用户在图片信息面板中输入标签名称并按 Enter 键，THE Gallery_System SHALL 将该标签添加至图片的 `tags` 数组并持久化至 IndexedDB_Store。
2. WHEN 用户点击标签旁的删除图标，THE Gallery_System SHALL 从图片的 `tags` 数组中移除该标签并持久化至 IndexedDB_Store。
3. THE Gallery_System SHALL 在筛选栏展示当前相册中所有已使用的标签，用户点击某标签后，视图仅展示包含该标签的图片。
4. WHEN 用户点击已激活的标签筛选，THE Gallery_System SHALL 取消该标签筛选并恢复展示全部图片。
5. THE Gallery_System SHALL 支持同时激活多个标签筛选，展示同时包含所有已激活标签的图片（AND 逻辑）。

---

### 需求 12：右键菜单

**用户故事：** 作为用户，我希望通过右键菜单快速执行常用操作，以便提升操作效率。

#### 验收标准

1. WHEN 用户右键点击缩略图，THE Gallery_System SHALL 在鼠标位置显示 Context_Menu，包含以下选项：收藏 / 取消收藏、移动到相册、添加标签、移至回收站。
2. WHEN 用户点击 Context_Menu 外部区域，THE Gallery_System SHALL 关闭 Context_Menu。
3. WHEN 用户按下 Escape 键，THE Gallery_System SHALL 关闭 Context_Menu。
4. IF Context_Menu 显示位置超出视口边界，THEN THE Gallery_System SHALL 自动调整 Context_Menu 位置使其完整显示在视口内。

---

### 需求 13：顶部快速筛选栏

**用户故事：** 作为用户，我希望通过顶部筛选栏快速切换图片视图，以便聚焦特定类型的图片。

#### 验收标准

1. THE Gallery_System SHALL 在图库顶部渲染 Quick_Filter 栏，包含三个互斥选项："全部"、"仅收藏"、"最新上传"。
2. WHEN 用户点击"全部"，THE Gallery_System SHALL 展示当前相册中所有未删除图片。
3. WHEN 用户点击"仅收藏"，THE Gallery_System SHALL 仅展示当前相册中 `isFavorite` 为 `true` 的图片。
4. WHEN 用户点击"最新上传"，THE Gallery_System SHALL 展示当前相册中上传时间距今 24 小时以内的图片。
5. THE Gallery_System SHALL 在每个筛选选项旁显示对应图片数量。

---

### 需求 14：IndexedDB 数据结构

**用户故事：** 作为开发者，我希望有清晰规范的 IndexedDB 数据结构，以便可靠地持久化和查询图库数据。

#### 验收标准

1. THE IndexedDB_Store SHALL 包含名为 `albums` 的对象仓库，每条记录包含以下字段：

   ```typescript
   interface AlbumRecord {
     id: number;           // 自增主键
     name: string;         // 相册名称（如 "2025-07-15"）
     createdAt: number;    // 创建时间戳（ms）
     sortOrder: number;    // 拖拽排序权重
     coverImageId?: number; // 封面图片 ID（可选）
   }
   ```

2. THE IndexedDB_Store SHALL 包含名为 `images` 的对象仓库，每条记录包含以下字段：

   ```typescript
   interface ImageRecord {
     id: number;           // 自增主键
     albumId: number;      // 所属相册 ID（外键）
     blob: Blob;           // 原始图片二进制数据
     filename: string;     // 原始文件名
     format: string;       // 文件格式（'jpeg' | 'png' | 'webp' | 'gif'）
     width: number;        // 图片宽度（px）
     height: number;       // 图片高度（px）
     size: number;         // 文件大小（字节）
     uploadedAt: number;   // 上传时间戳（ms）
     isFavorite: boolean;  // 是否收藏
     favoritedAt?: number; // 收藏时间戳（ms，可选）
     isDeleted: boolean;   // 是否在回收站
     deletedAt?: number;   // 删除时间戳（ms，可选）
     tags: string[];       // 标签数组
     sortOrder: number;    // 相册内排序权重
   }
   ```

3. THE IndexedDB_Store SHALL 在 `images` 对象仓库上建立以下索引：`albumId`（用于按相册查询）、`isFavorite`（用于收藏夹查询）、`isDeleted`（用于回收站查询）、`uploadedAt`（用于时间排序）。

4. THE IndexedDB_Store SHALL 使用数据库名称 `GalleryDB`，版本号为 `1`，所有对象仓库在 `onupgradeneeded` 回调中统一创建。

5. FOR ALL 写入 IndexedDB_Store 的操作，THE Gallery_System SHALL 使用 IndexedDB 事务（transaction）保证原子性，IF 事务失败，THEN THE Gallery_System SHALL 在控制台输出错误信息并向用户显示操作失败提示。

---

### 需求 15：组件化架构

**用户故事：** 作为开发者，我希望图库系统采用清晰的组件化架构，以便维护和扩展。

#### 验收标准

1. THE Gallery_System SHALL 按以下结构拆分组件，每个组件文件不超过 400 行：

   ```
   src/views/gallery/
   ├── GalleryPage.vue              # 根页面，负责路由与状态协调
   ├── components/
   │   ├── AlbumList.vue            # 相册列表（月份分组）
   │   ├── AlbumCard.vue            # 单个相册卡片
   │   ├── ImageBrowser.vue         # 图片浏览视图（左右分栏容器）
   │   ├── ThumbnailStrip.vue       # 左侧缩略图轮播条
   │   ├── ImageViewer.vue          # 右侧大图查看器
   │   ├── ImageInfoPanel.vue       # 图片信息与标签面板
   │   ├── BatchActionBar.vue       # 批量操作栏
   │   ├── QuickFilterBar.vue       # 顶部快速筛选栏
   │   ├── ContextMenu.vue          # 右键菜单
   │   ├── FavoritesView.vue        # 收藏夹视图
   │   ├── TrashView.vue            # 回收站视图
   │   └── UploadDropzone.vue       # 拖拽上传区域
   ├── composables/
   │   ├── useGalleryDB.ts          # IndexedDB 读写封装
   │   ├── useAlbumState.ts         # 相册状态管理
   │   ├── useImageState.ts         # 图片状态管理
   │   └── useSelection.ts          # 多选状态管理
   └── types/
       └── gallery.ts               # 所有 TypeScript 类型定义
   ```

2. THE Gallery_System SHALL 使用 Vue 3 Composition API 和 TypeScript 编写所有组件与 composable。
3. THE Gallery_System SHALL 通过 props / emits 进行父子组件通信，跨层级状态通过 composable 共享，不使用全局 Pinia store。
