# WorkstationPage.vue 工作站页面说明文档

## 概述

WorkstationPage.vue 是一个基于 Vue 3 + TypeScript 的图片编辑工作站页面，采用组合式 API (Composition API) 和模块化架构设计。该页面提供了完整的图片上传、预览、调色和保存功能，具有响应式布局和用户友好的交互体验。

## 页面结构

### 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│                    TopNavbar (顶部导航栏)                    │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│         ImageDisplay            │       AdjustPanel         │
│        (左侧图片显示区)          │      (右侧调整面板)        │
│                                 │                           │
│  ┌─────────────────────────────┐ │  ┌─────────────────────┐  │
│  │                             │ │  │   UploadSection     │  │
│  │      ImagePreview           │ │  │    (上传区域)       │  │
│  │     (图片预览区)             │ │  └─────────────────────┘  │
│  │                             │ │                           │
│  └─────────────────────────────┘ │  ┌─────────────────────┐  │
│  ═══════════════════════════════ │  │ AdjustmentControls  │  │
│  ┌─────────────────────────────┐ │  │   (调色参数区)      │  │
│  │      ImageGallery           │ │  └─────────────────────┘  │
│  │     (图片全览区)             │ │                           │
│  └─────────────────────────────┘ │  ┌─────────────────────┐  │
│                                 │  │   ActionButtons     │  │
│                                 │  │    (操作按钮)       │  │
│                                 │  └─────────────────────┘  │
└─────────────────────────────────┴───────────────────────────┘
```

## 核心功能模块

### 1. 图片管理功能
- **图片上传**: 支持拖拽和点击上传，自动生成缩略图
- **图片预览**: 实时显示当前选中图片和应用的滤镜效果
- **图片切换**: 在图片全览区快速切换不同图片
- **图片保存**: 将调色后的图片导出为 PNG 格式

### 2. 图片调色功能
- **亮度调整** (brightness): 0-200%，默认100%
- **对比度调整** (contrast): 0-200%，默认100%
- **饱和度调整** (saturation): 0-200%，默认100%
- **色温调整** (temperature): 0-200%，默认100%
- **曝光调整** (exposure): 0-200%，默认100%

### 3. 布局管理功能
- **左右面板调整**: 可拖拽分割线调整左右面板宽度比例 (70%-85%)
- **图片全览区调整**: 可拖拽调整图片全览区高度 (15vh-50vh)
- **布局持久化**: 自动保存用户的布局偏好到 localStorage
- **布局重置**: 一键恢复默认布局设置

## 技术架构

### 组件化设计

#### 主容器组件
- **WorkstationPage.vue**: 主页面容器，负责整体布局和状态协调

#### 功能组件
- **TopNavbar.vue**: 顶部导航栏组件
- **ImageDisplay.vue**: 左侧图片显示区容器
- **AdjustPanel.vue**: 右侧调整面板容器

#### 子功能组件
- **ImagePreview.vue**: 图片预览显示组件
- **ImageGallery.vue**: 图片全览列表组件
- **UploadSection.vue**: 文件上传组件
- **AdjustmentControls.vue**: 调色参数控制组件
- **ActionButtons.vue**: 操作按钮组件

#### 交互组件
- **PanelResizer.vue**: 左右面板分割线拖拽组件
- **GalleryResizer.vue**: 图片全览区拖拽调整组件

### Composables 状态管理

#### useLayoutState.ts - 布局状态管理
```typescript
interface UseLayoutStateReturn {
  // 状态
  leftPanelWidth: Ref<number>        // 左侧面板宽度百分比
  rightPanelWidth: ComputedRef<number> // 右侧面板宽度百分比
  isResizing: Ref<boolean>           // 是否正在拖拽分割线
  galleryHeight: Ref<number>         // 图片全览区高度(vh)
  isGalleryResizing: Ref<boolean>    // 是否正在拖拽全览区
  
  // 方法
  startResize: () => void            // 开始拖拽分割线
  startGalleryResize: () => void     // 开始拖拽全览区
  resetLayout: () => void            // 重置布局
  saveLayoutSettings: () => void     // 保存布局设置
}
```

#### useImageState.ts - 图片状态管理
```typescript
interface UseImageStateReturn {
  // 状态
  imageSrc: Ref<string>              // 当前预览图片源
  uploadedImages: Ref<ImageItem[]>   // 已上传图片列表
  selectedImageId: Ref<number | null> // 当前选中图片ID
  
  // 方法
  handleImageUpload: (file: File) => void  // 处理图片上传
  selectImage: (image: ImageItem) => void  // 选择图片
  getCurrentImage: () => ImageItem | null  // 获取当前图片
  removeImage: (imageId: number) => void   // 删除图片
  clearAllImages: () => void               // 清空所有图片
}
```

#### useAdjustmentState.ts - 调色状态管理
```typescript
interface UseAdjustmentStateReturn {
  // 状态
  adjustments: AdjustmentValues      // 调色参数对象
  imageFilter: ComputedRef<string>   // 计算得出的CSS滤镜字符串
  
  // 方法
  resetAdjustments: () => void       // 重置所有调色参数
  setAdjustment: (key, value) => void // 设置单个参数
  setAdjustments: (values) => void   // 批量设置参数
  saveImage: (imageRef) => void      // 保存调色后的图片
}
```

### TypeScript 接口定义

#### 核心数据接口
```typescript
// 图片数据接口
interface ImageItem {
  id: number
  name: string
  src: string
  originalFile: File
}

// 调整参数接口
interface AdjustmentValues {
  brightness: number    // 亮度 0-200
  contrast: number      // 对比度 0-200
  saturation: number    // 饱和度 0-200
  temperature: number   // 色温 0-200
  exposure: number      // 曝光 0-200
}

// 布局状态接口
interface LayoutState {
  leftPanelWidth: number      // 左侧面板宽度百分比
  rightPanelWidth: number     // 右侧面板宽度百分比
  isResizing: boolean         // 是否正在调整大小
  galleryHeight: number       // 图片全览区高度
  isGalleryResizing: boolean  // 是否正在调整全览区
  maxGalleryHeight: number    // 最大全览区高度
}
```

## 文件结构

```
src/views/workstation/
├── WorkstationPage.vue              # 主页面组件
├── component-interfaces.ts          # TypeScript 接口定义
├── WorkstationPage-说明文档.md       # 本说明文档
├── components/                      # 子组件目录
│   ├── index.ts                     # 组件统一导出
│   ├── TopNavbar.vue               # 顶部导航栏
│   ├── ImageDisplay.vue            # 图片显示区容器
│   ├── AdjustPanel.vue             # 调整面板容器
│   ├── ImagePreview.vue            # 图片预览组件
│   ├── ImageGallery.vue            # 图片全览组件
│   ├── UploadSection.vue           # 上传区域组件
│   ├── AdjustmentControls.vue      # 调色控制组件
│   ├── ActionButtons.vue           # 操作按钮组件
│   ├── PanelResizer.vue            # 面板分割线组件
│   └── GalleryResizer.vue          # 全览区调整组件
└── composables/                     # 状态管理目录
    ├── index.ts                     # Composables 统一导出
    ├── useLayoutState.ts            # 布局状态管理
    ├── useImageState.ts             # 图片状态管理
    └── useAdjustmentState.ts        # 调色状态管理
```

## 主要特性

### 1. 响应式设计
- 支持不同屏幕尺寸的自适应布局
- 可拖拽调整的面板分割比例
- 流畅的用户交互体验

### 2. 状态持久化
- 布局设置自动保存到 localStorage
- 页面刷新后恢复用户偏好设置
- 智能的默认值和边界检查

### 3. 模块化架构
- 组件职责单一，易于维护和测试
- Composables 提供可复用的状态逻辑
- TypeScript 提供完整的类型安全

### 4. 性能优化
- 使用 Vue 3 的 Composition API
- 计算属性自动缓存和更新
- 事件监听器的正确清理

### 5. 用户体验
- 实时预览调色效果
- 直观的拖拽交互
- 清晰的视觉反馈

## 使用方法

### 基本操作流程
1. **上传图片**: 点击上传区域或拖拽图片文件
2. **选择图片**: 在图片全览区点击切换不同图片
3. **调整参数**: 使用右侧滑块调整各项参数
4. **预览效果**: 左侧实时显示调整后的效果
5. **保存图片**: 点击保存按钮下载处理后的图片

### 布局调整
- **调整左右比例**: 拖拽中间的分割线
- **调整全览区高度**: 拖拽图片全览区上方的分割线
- **重置布局**: 在图片全览区右键选择重置布局

## 扩展性

### 添加新的调色参数
1. 在 `AdjustmentValues` 接口中添加新字段
2. 在 `useAdjustmentState.ts` 中更新默认值和计算逻辑
3. 在 `AdjustmentControls.vue` 中添加对应的控制组件

### 添加新的功能组件
1. 在 `components/` 目录下创建新组件
2. 在 `components/index.ts` 中导出
3. 在相应的容器组件中引入和使用

### 扩展状态管理
1. 创建新的 Composable 文件
2. 定义相应的 TypeScript 接口
3. 在 `composables/index.ts` 中导出

## 维护说明

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 Vue 3 Composition API 最佳实践
- 组件和 Composable 都有完整的类型定义
- 使用 ESLint 和 Prettier 保持代码风格一致

### 测试策略
- 项目配置了完整的测试框架 (Vitest + Vue Test Utils)
- 支持组件单元测试和 Composables 测试
- 支持端到端测试 (Playwright)
- 当前专注于核心功能实现，测试文件按需添加

### 性能监控
- 监控大图片文件的处理性能
- 检查内存泄漏（特别是事件监听器）
- 优化频繁的状态更新操作

---

*本文档最后更新时间: 2024年*