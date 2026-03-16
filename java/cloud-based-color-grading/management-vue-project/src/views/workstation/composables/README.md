# Workstation Composables

这个目录包含了从 WorkstationPage.vue 组件中提取的状态管理逻辑，分为三个独立的 composables：

## useLayoutState.ts

管理布局相关状态和操作：

- **状态**：
  - `leftPanelWidth` - 左侧面板宽度百分比
  - `rightPanelWidth` - 右侧面板宽度百分比（计算属性）
  - `galleryHeight` - 图片全览区高度（vh）
  - `isResizing` - 是否正在拖拽左右分割线
  - `isGalleryResizing` - 是否正在拖拽图片全览区

- **方法**：
  - `startResize()` - 开始拖拽左右分割线
  - `startGalleryResize()` - 开始拖拽图片全览区
  - `resetLayout()` - 重置布局到默认设置
  - `restoreLayoutSettings()` - 从 localStorage 恢复布局设置
  - `saveLayoutSettings()` - 保存布局设置到 localStorage

## useImageState.ts

管理图片上传、选择和列表状态：

- **状态**：
  - `imageSrc` - 当前预览图片的源地址
  - `uploadedImages` - 已上传的图片列表
  - `selectedImageId` - 当前选中的图片ID

- **方法**：
  - `handleImageUpload(file)` - 处理图片上传
  - `selectImage(image)` - 选择图片进行编辑
  - `getCurrentImage()` - 获取当前选中的图片对象
  - `removeImage(imageId)` - 删除指定图片
  - `clearAllImages()` - 清空所有图片
  - `hasImages()` - 检查是否有图片
  - `hasSelectedImage()` - 检查是否有选中的图片

## useAdjustmentState.ts

管理图片调整参数和滤镜计算：

- **状态**：
  - `adjustments` - 调整参数对象（brightness, contrast, saturation, temperature, exposure）
  - `imageFilter` - 计算得出的CSS滤镜字符串（计算属性）

- **方法**：
  - `resetAdjustments()` - 重置所有调色参数
  - `setAdjustment(key, value)` - 设置单个调整参数
  - `setAdjustments(newAdjustments)` - 批量设置调整参数
  - `getAdjustments()` - 获取当前调整参数的副本
  - `hasAdjustments()` - 检查是否有调整（非默认值）
  - `saveImage(previewImageRef)` - 保存图片（应用滤镜效果）
  - `updateImageFilter()` - 更新滤镜（兼容性方法）

## 使用示例

```typescript
import { useLayoutState, useImageState, useAdjustmentState } from './composables';

export default {
  setup() {
    // 使用布局状态管理
    const {
      leftPanelWidth,
      rightPanelWidth,
      galleryHeight,
      startResize,
      startGalleryResize,
      resetLayout
    } = useLayoutState();

    // 使用图片状态管理
    const {
      imageSrc,
      uploadedImages,
      selectedImageId,
      handleImageUpload,
      selectImage,
      hasSelectedImage
    } = useImageState();

    // 使用调整状态管理
    const {
      adjustments,
      imageFilter,
      resetAdjustments,
      saveImage
    } = useAdjustmentState();

    return {
      // 布局相关
      leftPanelWidth,
      rightPanelWidth,
      galleryHeight,
      startResize,
      startGalleryResize,
      resetLayout,
      
      // 图片相关
      imageSrc,
      uploadedImages,
      selectedImageId,
      handleImageUpload,
      selectImage,
      hasSelectedImage,
      
      // 调整相关
      adjustments,
      imageFilter,
      resetAdjustments,
      saveImage
    };
  }
};
```

## 设计原则

1. **单一职责**：每个 composable 只负责一个特定的功能领域
2. **状态封装**：相关的状态和操作被封装在一起
3. **可复用性**：composables 可以在不同组件中独立使用
4. **响应式**：所有状态都是响应式的，支持 Vue 的响应式系统
5. **类型安全**：使用 TypeScript 提供完整的类型定义和参数验证

## 文件结构

```
composables/
├── index.ts                    # 统一导出入口
├── useLayoutState.ts          # 布局状态管理
├── useImageState.ts           # 图片状态管理
├── useAdjustmentState.ts      # 调色状态管理
└── README.md                  # 本说明文档
```

所有 composables 都使用 TypeScript 编写，提供完整的类型安全和 IDE 支持。