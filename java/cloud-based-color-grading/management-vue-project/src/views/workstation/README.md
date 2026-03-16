# Workstation 组件架构

## 概述

本目录包含重构后的 Workstation 组件架构，将原来的单体 `WorkstationPage.vue` 拆分为多个独立、可复用的组件。

## 目录结构

```
src/views/workstation/
├── WorkstationPage.vue          # 主容器组件
├── components/                  # 组件目录
│   ├── TopNavbar.vue           # 顶部导航栏
│   ├── ImageDisplay.vue        # 左侧图片显示区容器
│   ├── ImagePreview.vue        # 图片预览组件
│   ├── ImageGallery.vue        # 图片全览区组件
│   ├── GalleryResizer.vue      # 图片全览区拖拽分割线
│   ├── PanelResizer.vue        # 左右面板拖拽分割线
│   ├── AdjustPanel.vue         # 右侧调整面板容器
│   ├── UploadSection.vue       # 上传区域组件
│   ├── AdjustmentControls.vue  # 参数调整组件
│   ├── ActionButtons.vue       # 操作按钮组件
│   └── index.js               # 组件导入导出配置
├── composables/                # 状态管理目录
│   ├── useLayoutState.js       # 布局状态管理
│   ├── useImageState.js        # 图片状态管理
│   ├── useAdjustmentState.js   # 调整参数状态管理
│   └── index.js               # Composables 导入导出配置
└── README.md                   # 本文档
```

## 组件职责

### 主要容器组件

- **WorkstationPage.vue**: 主容器组件，负责组件组合和数据流管理
- **ImageDisplay.vue**: 左侧图片显示区容器
- **AdjustPanel.vue**: 右侧调整面板容器

### 功能组件

- **TopNavbar.vue**: 顶部导航栏，独立的导航功能
- **ImagePreview.vue**: 图片预览显示，可复用的图片展示组件
- **ImageGallery.vue**: 图片全览区，管理多图片列表和选择
- **UploadSection.vue**: 文件上传区域，独立的上传功能
- **AdjustmentControls.vue**: 参数调整控件，独立的参数控制
- **ActionButtons.vue**: 操作按钮组，独立的操作功能

### 布局组件

- **GalleryResizer.vue**: 图片全览区拖拽分割线
- **PanelResizer.vue**: 左右面板拖拽分割线

## 状态管理

### Composables

- **useLayoutState**: 管理布局相关状态（面板宽度、拖拽状态、设置持久化）
- **useImageState**: 管理图片相关状态（图片列表、选中状态、上传处理）
- **useAdjustmentState**: 管理调整参数状态（滤镜参数、效果计算、保存功能）

## 组件通信

### Props 接口

各组件通过标准化的 Props 接口接收数据：

```typescript
// 示例：ImagePreview 组件
interface ImagePreviewProps {
  imageSrc: string
  imageFilter: string
  showUploadTips: boolean
}
```

### 事件通信

组件通过事件向父组件传递消息：

```typescript
// 事件命名约定
emit('update:*')  // 数据更新事件
emit('action:*')  // 用户操作事件
emit('layout:*')  // 布局变更事件
```

## 开发状态

### 已完成 ✅

- [x] 目录结构创建
- [x] 组件骨架文件创建
- [x] Composables 基础结构
- [x] 导入导出配置
- [x] 基础文档

### 待实现 🚧

- [ ] 具体组件功能实现（任务 3.2-3.4）
- [ ] 状态管理逻辑实现
- [ ] 组件间数据流集成
- [ ] 主容器组件重构（任务 3.5）

## 使用方式

### 导入组件

```javascript
// 导入单个组件
import { TopNavbar, ImagePreview } from './components'

// 导入组件分组
import { ImageComponents, AdjustComponents } from './components'

// 导入所有组件
import { AllComponents } from './components'
```

### 导入状态管理

```javascript
// 导入单个 Composable
import { useLayoutState, useImageState } from './composables'

// 导入组合状态管理
import { useWorkstationState } from './composables'
```

## 设计原则

1. **单一职责**: 每个组件只负责一个特定功能
2. **可复用性**: 组件设计为可在其他页面复用
3. **可测试性**: 组件独立，便于单元测试
4. **可维护性**: 清晰的组件边界和数据流
5. **行为保持**: 重构后保持所有原有功能不变