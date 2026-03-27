# Workstation 图片调色工作台 — 项目文档

> 基于 Vue 3 + TypeScript 的浏览器端图片调色工作台，支持基础调色、HSL 颜色范围调节、蒙版局部调色、裁切/旋转/翻转，所有处理均在浏览器本地完成，图片数据持久化于 IndexedDB。

---

## 目录

1. 项目概述
2. 目录结构
3. 架构总览
4. 页面入口：WorkstationPage.vue
5. 组件架构
6. Composables 状态管理
7. Web Workers
8. 工具类与类型定义
9. 数据流与处理链
10. 持久化策略
11. 性能策略
12. 关键交互说明

---

## 1. 项目概述

Workstation 是一个纯前端图片调色工作台，核心能力：

- 多图片管理（上传、切换、IndexedDB 持久化）
- 基础调色：亮度、对比度、清晰度、饱和度、自然饱和度、色相、色温
- HSL 颜色范围调节：对红/橙/黄/绿/青/蓝/紫七个颜色范围独立调整 H/S/L
- 蒙版局部调色：线性渐变蒙版、径向渐变蒙版，每层独立调色参数，多层叠加
- 裁切工具：自由/固定比例裁切，旋转（±90°），水平/垂直翻转，非破坏性存储
- RGB 分析：直方图（screen 混合三通道）、波形图，Web Worker 异步计算
- 布局可拖拽：左右面板宽度、图片全览区高度，localStorage 持久化
- 调色参数自动保存（防抖 500ms 写入 IndexedDB）


---

## 2. 目录结构

```
workstation/
├── WorkstationPage.vue          # 页面根组件，状态编排中心
├── component-interfaces.ts      # 全局 TypeScript 接口定义
│
├── components/                  # UI 组件层
│   ├── index.ts                 # 组件统一导出
│   ├── TopNavbar.vue            # 顶部导航栏（占位，高度 5vh）
│   ├── ImageDisplay.vue         # 左侧区域容器（预览 + 全览 + 分割线）
│   ├── ImagePreview.vue         # 图片预览画布（缩放/平移/蒙版/裁切）
│   ├── ImageGallery.vue         # 图片全览横向列表
│   ├── GalleryResizer.vue       # 全览区高度拖拽分割线
│   ├── PanelResizer.vue         # 左右面板宽度拖拽分割线
│   ├── AdjustPanel.vue          # 右侧调色面板容器（含侧边 tab 导航）
│   ├── BasicAdjustPanel.vue     # 基础调色 tab 内容
│   ├── AdjustmentControls.vue   # 基础调色滑块组（亮度/对比度等）
│   ├── HSLControls.vue          # HSL 颜色范围调节组件
│   ├── SliderRow.vue            # 通用滑块行组件
│   ├── RGBAnalysis.vue          # RGB 直方图 + 波形图分析
│   ├── RGBHistogram.vue         # （空文件，预留）
│   ├── CropPanel.vue            # 裁切 tab 内容（比例/旋转/翻转）
│   ├── CropTool.vue             # 裁切框交互层（叠加在 canvas 上）
│   ├── MaskAdjustPanel.vue      # 蒙版 tab 内容（层列表 + 参数 + 局部调色）
│   ├── MaskCanvas.vue           # 蒙版交互层（手柄拖拽 + overlay 绘制）
│   ├── MaskControls.vue         # 蒙版控件（旧版，已被 MaskAdjustPanel 替代）
│   ├── ActionButtons.vue        # 操作按钮（选择图片/重置/保存）
│   └── UploadSection.vue        # 上传区域（已整合进 ActionButtons）
│
├── composables/                 # 状态管理层（Vue Composables）
│   ├── index.ts                 # 导出入口
│   ├── useLayoutState.ts        # 布局状态（面板宽度/高度/拖拽/持久化）
│   ├── useImageState.ts         # 图片状态（上传/选择/列表/IndexedDB 恢复）
│   ├── useAdjustmentState.ts    # 基础调色参数状态
│   ├── useHSLState.ts           # 图片处理链（基础调色 + HSL + 蒙版，Worker 调度）
│   ├── useHSLProcessor.ts       # HSL 类型定义与默认值工厂
│   ├── useImageStorage.ts       # IndexedDB 操作封装
│   └── useMaskState.ts          # 蒙版层状态管理（多层/生成/合成）
│
├── workers/                     # Web Worker 层（像素处理）
│   ├── basicWorker.ts           # 基础调色像素处理（色温→亮度→对比度→清晰度→饱和度→色相）
│   ├── hslWorker.ts             # HSL 颜色范围像素处理（七色范围权重混合）
│   ├── maskWorker.ts            # 蒙版合成（lerp 混合原图与调整后图）
│   └── rgbWorker.ts             # RGB 分析（直方图 + 波形图计算）
│
├── types/
│   └── cropTypes.ts             # 裁切状态类型定义（CropState/CropRect）
│
└── utils/
    └── imageDB.ts               # IndexedDB 封装类（ImageDatabase 单例）
```


---

## 3. 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkstationPage.vue                       │
│  （状态编排：组合所有 composables，处理跨组件事件）            │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
    ┌──────▼──────┐            ┌──────▼──────┐
    │ ImageDisplay│            │ AdjustPanel │
    │  （左侧区域）│            │  （右侧区域）│
    └──────┬──────┘            └──────┬──────┘
           │                          │
    ┌──────▼──────────┐       ┌───────▼──────────────┐
    │  ImagePreview   │       │  BasicAdjustPanel     │
    │  ImageGallery   │       │  CropPanel            │
    │  GalleryResizer │       │  MaskAdjustPanel      │
    └──────┬──────────┘       └───────────────────────┘
           │
    ┌──────▼──────────┐
    │  MaskCanvas     │  ← 蒙版交互层（overlay + 手柄）
    │  CropTool       │  ← 裁切框交互层
    └─────────────────┘

Composables 层（状态管理）：
  useLayoutState   → 面板宽度、全览高度、localStorage
  useImageState    → 图片列表、选中图片、IndexedDB 恢复
  useAdjustmentState → 基础调色参数（reactive）
  useHSLState      → 处理链调度（basicWorker + hslWorker + maskWorker）
  useMaskState     → 蒙版层列表、canvas 生成、合成
  useImageStorage  → IndexedDB CRUD 封装

Workers 层（像素处理，主线程零阻塞）：
  basicWorker  → 基础调色（分片并行 × WORKER_COUNT）
  hslWorker    → HSL 范围调节（分片并行 × WORKER_COUNT）
  maskWorker   → 蒙版 lerp 合成（分片并行 × WORKER_COUNT）
  rgbWorker    → 直方图 + 波形图（单次计算）
```

---

## 4. 页面入口：WorkstationPage.vue

页面根组件，职责：

- 组合所有 composables，持有全局状态
- 将状态以 props 向下传递给 `ImageDisplay` 和 `AdjustPanel`
- 监听子组件 emit 的事件，调用对应 composable 方法
- 管理跨模块联动逻辑（如裁切预览备份/恢复、蒙版与裁切互斥清除）
- 防抖自动保存调色参数（500ms）
- 图片切换时加载对应的调色参数和裁切状态

### 关键状态

| 变量 | 类型 | 说明 |
|------|------|------|
| `imageSrc` | `Ref<string>` | 当前预览图片 dataUrl（可能是裁切后版本） |
| `processedSrc` | `Ref<string>` | 处理链输出的 dataUrl（空字符串时显示原图） |
| `selectedImageId` | `Ref<number\|null>` | 当前选中图片 ID |
| `adjustments` | `AdjustmentValues` | 基础调色参数（reactive） |
| `hslAdjustments` | `HSLAdjustments` | HSL 颜色范围参数（reactive） |
| `maskLayers` | `MaskLayer[]` | 蒙版层列表 |
| `currentCropState` | `Ref<CropState>` | 当前裁切状态（旋转/翻转/裁切区域） |
| `activePanelTab` | `Ref<'basic'\|'crop'\|'mask'>` | 右侧面板当前 tab |
| `cropToolActive` | `Ref<boolean>` | 裁切工具是否激活 |
| `adjSliderDragging` | `Ref<boolean>` | 蒙版局部调色滑块拖动中（临时隐藏 overlay） |

### 关键方法

| 方法 | 说明 |
|------|------|
| `applyTransforms` | 对原图应用旋转/翻转，内置 Map 缓存，相同参数直接返回 |
| `handleCropRatioChange` | 进入裁切模式，备份 imageSrc，重建变换后预览图 |
| `handleCropCommit` | 裁切提交，canvas 裁剪，写入 IndexedDB |
| `handleCropRestore` | 复原原图，清除 IndexedDB 裁切数据 |
| `applyEditedSrc` | 统一更新 imageSrc + 持久化 editedSrc + 清除失效蒙版 |
| `serializeAdjustments` | 序列化全部调色参数（含蒙版）为 JSON |
| `applyStoredAdjustments` | 从 IndexedDB 反序列化并应用调色参数 |
| `scheduleSave` | 防抖 500ms 写入 IndexedDB |


---

## 5. 组件架构

### 5.1 ImageDisplay.vue

左侧区域容器，纯透传组件。

- 包含：`ImagePreview`（上）+ `GalleryResizer`（分割线）+ `ImageGallery`（下）
- 宽度由 `leftPanelWidth`（%）控制
- 向上透传所有子组件事件（mask/crop/upload/layout）
- `defineExpose({ imagePreviewRef })` 供父组件调用 `onceDrawComplete`

### 5.2 ImagePreview.vue

核心预览组件，承载所有图片交互。

- 用 `<canvas>` 渲染图片（`drawImage`），不使用 `<img>` 标签，保证像素精度
- 支持鼠标滚轮缩放（0.2x ~ 4x）、拖拽平移（scale > 1 时）、双击复位/放大
- 文件拖拽上传（支持批量，最多 10 张）
- 叠加 `MaskCanvas`（蒙版交互层，cropActive 时隐藏）
- 叠加 `CropTool`（裁切框，maskActive 时隐藏）
- 裁切操作栏（悬浮底部，显示尺寸/取消/应用按钮）
- `defineExpose({ previewCanvas, resetTransform, onceDrawComplete })`

**watch 逻辑：**
```
[processedSrc, imageSrc] → drawSrc（优先 processedSrc，无则用 imageSrc）
```

### 5.3 ImageGallery.vue

横向滚动图片列表。

- 图片项尺寸按 16:9 比例动态计算（基于 galleryHeight）
- 选中项高亮边框 + 发光效果
- 支持添加图片（隐藏 file input）
- 重置布局按钮

### 5.4 GalleryResizer.vue / PanelResizer.vue

拖拽分割线组件，逻辑相似：

- `mousedown` 开始监听 `document.mousemove/mouseup`
- 计算新尺寸（vh 或 %），限制在 min/max 范围内
- emit `layout:updateGalleryHeight` / `layout:updatePanelWidth`
- `onUnmounted` 清理事件监听

### 5.5 AdjustPanel.vue

右侧调色面板容器。

- 宽度由 `rightPanelWidth`（%）控制
- 右侧竖向 tab 导航（基础调色 / 裁切 / 蒙版），图标 SVG
- 根据 `activeTab` 渲染对应子面板：`BasicAdjustPanel` / `CropPanel` / `MaskAdjustPanel`
- 切换 tab 时 emit `tab:change`，切离裁切 tab 时自动取消裁切预览

### 5.6 BasicAdjustPanel.vue

基础调色 tab，组合以下子组件：

```
RGBAnalysis        ← 直方图/波形图
AdjustmentControls ← 基础调色滑块
HSLControls        ← HSL 颜色范围滑块
ActionButtons      ← 选择图片/重置/保存
```

### 5.7 AdjustmentControls.vue

基础调色滑块组，分两组：

- 基础组：亮度（-150~+150）、对比度（-100~+100）、清晰度（-100~+100）
- 色彩组：饱和度、自然饱和度、色相（-180~+180°）、色温（-100~+100）
- 色温/饱和度/色相滑块有对应渐变轨道
- 每项显示当前值，非零时高亮，有单项重置按钮

### 5.8 HSLControls.vue

HSL 颜色范围调节，7 个颜色 tab（红/橙/黄/绿/青/蓝/紫）：

- 每个 tab 对应独立的 H/S/L 三个滑块
- 色相滑块轨道随当前颜色变化（渐变）
- 饱和度轨道：灰 → 当前颜色
- 明度轨道：黑 → 白
- 全部重置按钮（任意非零时显示）

### 5.9 SliderRow.vue

通用滑块行，props：`label / min / max / value / unit`，emit `update`。

### 5.10 RGBAnalysis.vue

RGB 分析组件，两个 tab：

- 直方图：三通道 screen 混合叠加，鼠标悬停显示像素值 tooltip
- 波形图：按列采样，三通道叠加
- 通道可见性切换（全部/R/G/B）
- Web Worker 异步计算，防抖 80ms，Worker 忙时排队最新请求
- 切换 tab 直接用缓存结果重绘，无需重新计算

### 5.11 CropPanel.vue

裁切 tab 内容：

- 比例预设网格（自由/1:1/4:3/3:4/16:9/9:16），每项有 SVG 示意图
- 自定义比例输入（宽:高）
- 旋转/翻转按钮（逆时针/顺时针/水平/垂直）
- 操作提示（Enter 确认，Esc 取消）
- 复原原图按钮

### 5.12 CropTool.vue

裁切框交互层，叠加在 `image-wrapper` 上：

- 用比例坐标（0~1）存储裁切框，与图片缩放无关
- 四角 + 四边 + 中心共 8 个拖拽手柄（固定比例时只显示四角）
- 阴影遮罩（上下左右四块 div）
- 三等分参考线（九宫格）
- `ResizeObserver` + `MutationObserver` 监听 canvas 尺寸变化
- `requestAnimationFrame` 轮询 canvas 位置变化（面板拖拽时同步）
- Enter 确认，Esc 取消
- `defineExpose({ doCommit, pixelW, pixelH })`

### 5.13 MaskAdjustPanel.vue

蒙版 tab 内容：

- 顶部：添加线性/径向蒙版按钮，预览开关
- 层列表：缩略图（SVG 渐变示意）+ 名称（双击编辑）+ 类型标签 + 显隐/删除按钮
- 选中层详情：
  - 形状参数：羽化滑块，径向蒙版的内部/外部切换
  - 操作：反转、清除
  - 局部调色：7 个滑块（曝光/对比度/饱和度/自然饱和度/色温/清晰度/色相），带填充条可视化

### 5.14 MaskCanvas.vue

蒙版交互层，`position: fixed` 叠加在图片上：

- overlay canvas：绘制蒙版预览（线性渐变蓝色叠加 + 虚线路径，径向椭圆 + 旋转手柄连线）
- 交互层 div：捕获鼠标事件（新建拖拽）
- 手柄 div：线性蒙版（p1/p2/mid），径向蒙版（center/edge-x/edge-y/rotate）
- 坐标系：始终基于完整图片 rect 归一化，overlay 裁剪到容器交集
- `ResizeObserver` 监听 canvas 和容器尺寸，`imgScale/imgOffsetX/imgOffsetY` 变化时重新同步

### 5.15 ActionButtons.vue

操作按钮组：

- 选择图片（触发隐藏 file input）
- 重置参数（emit `action:reset`）
- 保存图片（emit `action:save`，带格式选择 PNG/JPEG）


---

## 6. Composables 状态管理

### 6.1 useLayoutState.ts

管理布局尺寸，持久化到 `localStorage`（key: `workstation-layout-settings`）。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `leftPanelWidth` | `Ref<number>` | 左侧面板宽度 %（70~85，默认 80） |
| `rightPanelWidth` | `ComputedRef<number>` | 100 - leftPanelWidth |
| `galleryHeight` | `Ref<number>` | 全览区高度 vh（16~35，默认 20） |
| `isResizing` | `Ref<boolean>` | 左右分割线拖动中 |
| `isGalleryResizing` | `Ref<boolean>` | 全览分割线拖动中 |
| `resetLayout` | `() => void` | 重置为默认值并清除 localStorage |
| `saveLayoutSettings` | `() => void` | 写入 localStorage |

`onMounted` 自动恢复，`onUnmounted` 清理事件监听。

---

### 6.2 useImageState.ts

管理图片列表和选中状态，`onMounted` 从 IndexedDB 恢复。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `imageSrc` | `Ref<string>` | 当前预览图片 dataUrl |
| `uploadedImages` | `Ref<ImageItem[]>` | 图片列表 |
| `selectedImageId` | `Ref<number\|null>` | 当前选中 ID |
| `handleImageUpload` | `(file: File) => void` | 上传图片（去重检查 + 生成缩略图 + 写 IndexedDB） |
| `selectImage` | `(image: ImageItem) => void` | 切换选中图片 |

上传流程：
1. 生成 `fileHash`（name + size + type）
2. `checkFileExists` 查 IndexedDB，重复则拒绝
3. `FileReader` 读取 dataUrl
4. 生成 200px 缩略图（canvas 压缩）
5. 写入 IndexedDB，`selectImage` 切换预览

---

### 6.3 useAdjustmentState.ts

管理基础调色参数，提供 CSS filter 计算（用于旧版 CSS 滤镜方案，现已被 Worker 像素处理替代，但 `imageFilter` computed 仍保留）。

| 返回值 | 说明 |
|--------|------|
| `adjustments` | reactive AdjustmentValues（7 个参数，默认全 0） |
| `imageFilter` | computed CSS filter 字符串（brightness/contrast/saturate/hue-rotate/sepia） |
| `resetAdjustments` | 全部归零 |
| `setAdjustments` | 批量设置 |

---

### 6.4 useHSLState.ts

**核心处理链调度器**，管理 Worker 池，驱动图片处理。

#### 处理链顺序（与 PS/Lightroom 一致）

```
原图 ImageData
  → basicWorker × N（色温→亮度→对比度→清晰度→饱和度→自然饱和度→色相）
  → hslWorker × N（七色范围 H/S/L 权重混合）
  → 逐层蒙版：
      对当前结果再跑 basicWorker（该层独立调色参数）
      → maskWorker × N（lerp 混合：current + layerAdjusted，权重=蒙版 alpha）
  → canvas.toDataURL → processedSrc
```

#### Worker 池策略

- `WORKER_COUNT = min(hardwareConcurrency, 8)`
- 每类 Worker 懒创建，整个组件生命周期复用
- 像素数据按字节数均分为 N 片，并行处理后合并
- `poolBusy` 标志位：忙时新请求存入 `pendingReq`（只保留最新）
- `hiresTimer`：500ms 后触发原图高清处理（预览版最大 1200px）

#### 双缓存

| 缓存 | 说明 |
|------|------|
| `previewData` | 缩放到 ≤1200px 的 ImageData，实时拖动用 |
| `fullData` | 原图尺寸 ImageData，500ms 后精细处理 |

#### 关键方法

| 方法 | 说明 |
|------|------|
| `setSourceImage(src)` | 加载新图片，生成双缓存，触发处理 |
| `setBasicAdjustments(adj)` | 注入基础调色参数，触发处理 |
| `setMaskLayers(layers)` | 注入蒙版层列表（含 canvas 引用），触发处理 |
| `updateMaskLayerAdj(id, adj)` | 仅更新某层调色参数，不重传 canvas，直接触发处理 |
| `exportProcessed(format, quality)` | 用 fullData 走完整处理链，返回指定格式 dataUrl |

---

### 6.5 useHSLProcessor.ts

纯类型定义文件，导出：

- `HSLRange`：`{ hue, saturation, lightness }`
- `HSLAdjustments`：七个颜色范围的 HSLRange
- `defaultHSLRange()`、`defaultHSLAdjustments()` 工厂函数

---

### 6.6 useImageStorage.ts

封装 `imageDB` 单例，提供业务层接口：

| 方法 | 说明 |
|------|------|
| `saveImageToDB` | 保存图片（保留已有 editedSrc/cropStateJson/adjustmentsJson） |
| `loadImagesFromDB` | 加载所有图片（src 优先用 editedSrc） |
| `saveAdjustments` | 仅更新 adjustmentsJson 字段 |
| `loadAdjustments` | 读取 adjustmentsJson |
| `saveCropData` | 仅更新 editedSrc + cropStateJson（不覆盖原图） |
| `loadCropData` | 读取裁切数据 |
| `loadOriginalSrc` | 读取原始图片 src（永不被裁切覆盖） |
| `generateFileHash` | name + size + type 拼接哈希 |
| `checkFileExists` | 按 fileHash 查重 |

---

### 6.7 useMaskState.ts

管理多层蒙版状态。

#### 数据结构

```typescript
MaskLayer {
  id: string
  name: string
  enabled: boolean
  type: 'linear' | 'radial'
  linear: LinearMaskParams   // x1,y1,x2,y2,feather
  radial: RadialMaskParams   // cx,cy,rx,ry,angle,feather,invert
  adjustments: AdjustmentValues  // 该层独立调色参数
  canvas: HTMLCanvasElement | null  // 原图尺寸离屏 canvas
}
```

#### 蒙版生成

- `generateLayerMask(layer)`：在 layer.canvas 上用 canvas 2D API 绘制渐变（线性/径向）
- `drawLinearMask`：`createLinearGradient`，白→黑，带羽化延伸
- `drawRadialMask`：`createRadialGradient`，旋转变换，支持 invert
- `_rebuildComposite`：所有启用层 multiply 叠加到 compositeCanvas（供旧接口兼容）

#### 持久化

- `getSerializable()`：序列化为纯 JSON（不含 canvas）
- `loadFromSerializable(data)`：反序列化并重新生成所有层 canvas


---

## 7. Web Workers

所有像素处理均在 Worker 中完成，主线程零阻塞。Worker 通过 `Transferable`（ArrayBuffer）传递数据，避免拷贝开销。

### 7.1 basicWorker.ts

基础调色，处理顺序：

```
色温（R+/B- 或 R-/B+）
→ 亮度（RGB 直接偏移）
→ 对比度（PS 公式：factor = 259*(c+255) / (255*(259-c))，以 128 为中心）
→ 清晰度（中间调 S 曲线近似：(v-128)*clarityFactor+128）
→ 饱和度 + 自然饱和度 + 色相（转 HSL 处理）
```

接收：`{ buffer: ArrayBuffer, adj: BasicAdjustments }`
返回：`{ buffer: ArrayBuffer }`

### 7.2 hslWorker.ts

HSL 颜色范围调节，七色权重混合：

- 每个颜色范围定义中心色相（CENTERS）、硬边半径（HALF）、软边半径（SOFT）
- 权重函数：`diff <= soft → 1`，`diff >= half → 0`，中间线性插值
- 多个范围权重之和 > 1 时归一化
- 对每像素转 HSL，叠加加权 dH/dS/dL，转回 RGB

接收：`{ buffer, adj: HSLAdjustments, chunkIndex, hires }`
返回：`{ buffer, chunkIndex, hires }`

### 7.3 maskWorker.ts

蒙版 lerp 合成：

```
output[i] = original[i] * (1 - alpha) + adjusted[i] * alpha
alpha = mask[i] / 255  （取蒙版 R 通道）
```

接收：`{ original: ArrayBuffer, adjusted: ArrayBuffer, mask: ArrayBuffer }`
返回：`{ buffer: ArrayBuffer }`

### 7.4 rgbWorker.ts

RGB 分析（一次性计算，不分片）：

- 直方图：三通道各 256 桶 Uint32Array，计算 histMax
- 波形图：按列采样（最多 256 列 × 120 行），三通道 Uint8Array

接收：`{ buffer, width, height, waveformCols }`
返回：`{ rHist, gHist, bHist, histMax, waveR, waveG, waveB, waveRows, waveCols }`（全部 Transferable）

---

## 8. 工具类与类型定义

### 8.1 component-interfaces.ts

全局接口定义：

```typescript
ImageItem          // id, name, src, originalSrc, thumbnail, originalFile, fileHash
AdjustmentValues   // brightness, contrast, saturation, vibrance, hue, temperature, clarity
LayoutState        // leftPanelWidth, rightPanelWidth, isResizing, galleryHeight, isGalleryResizing
// 各组件 Props/Events 接口（ImagePreviewProps, ImageGalleryProps 等）
```

### 8.2 types/cropTypes.ts

```typescript
CropRect    // x, y, w, h（原图像素坐标）
CropState   // rotate(0/90/180/270), flipH, flipV, rect: CropRect|null
DEFAULT_CROP_STATE  // 全部归零的默认值
```

### 8.3 utils/imageDB.ts

`ImageDatabase` 类，IndexedDB 封装（DB: `WorkstationDB` v5，Store: `images`）：

| 字段 | 说明 |
|------|------|
| `id` | 主键（number，Date.now() + random） |
| `blob` | 原始图片 Blob（永不覆盖） |
| `src` | 原始图片 dataUrl（永不覆盖） |
| `editedSrc` | 裁切/旋转后的 dataUrl（可选） |
| `cropStateJson` | CropState JSON 字符串（可选） |
| `adjustmentsJson` | 调色参数 JSON 字符串（可选） |
| `thumbnail` | 缩略图 dataUrl |
| `fileHash` | name_size_type 去重哈希 |

索引：`uploadTime`、`name`、`fileHash`

版本升级策略：v3→v4 新增 `adjustmentsJson`（普通字段，旧记录自动兼容），v4→v5 新增 `editedSrc`/`cropStateJson`（同上）。

关键方法：
- `updateAdjustments`：只读取记录 → 修改 adjustmentsJson → put 回去（不重写 blob）
- `updateCropData`：同上，只更新 editedSrc + cropStateJson
- `clearCropData`：删除 editedSrc 和 cropStateJson 字段
- `existsByHash`：通过 fileHash 索引查重

---

## 9. 数据流与处理链

### 9.1 图片上传流程

```
用户选择文件
  → useImageState.handleImageUpload
  → 生成 fileHash → 查重（IndexedDB）
  → FileReader.readAsDataURL
  → 生成缩略图（canvas 200px）
  → 构建 ImageItem（id = Date.now() + random）
  → saveImageToDB（写 IndexedDB）
  → selectImage → imageSrc.value = src
  → watch(imageSrc) → setSourceImage → 加载双缓存 → triggerProcess
```

### 9.2 调色参数变化流程

```
用户拖动滑块
  → AdjustmentControls emit update:adjustments
  → WorkstationPage setAdjustments（reactive 更新）
  → watch(adjustments) → setBasicAdjustments → triggerProcess
  → scheduleProcess（预览版）+ scheduleHires（500ms 后原图版）
  → runFullChain → basicWorker + hslWorker + maskWorker
  → processedSrc.value = dataUrl
  → ImagePreview watch([processedSrc, imageSrc]) → drawSrc
  → watch(adjustments) → scheduleSave（防抖 500ms → IndexedDB）
```

### 9.3 蒙版操作流程

```
用户在图片上拖拽（MaskCanvas）
  → emit update:layer → WorkstationPage handleMaskUpdateLayer
  → maskUpdateLayer → generateLayerMask（重绘 canvas）
  → syncMaskLayers → setMaskLayers（传入处理链）
  → triggerProcess → runFullChain（逐层蒙版 lerp）
  → processedSrc 更新

用户拖动蒙版局部调色滑块
  → emit mask:updateLayerAdj → handleMaskUpdateLayerAdj
  → updateMaskLayerAdj（直接修改 currentMaskLayers 中的参数）
  → triggerProcess（不重传 canvas，避免 rAF 延迟）
```

### 9.4 裁切流程

```
用户点击裁切比例
  → cropRatio 更新 → cropToolActive = true
  → handleCropRatioChange：
      备份 imageSrc → cropPreviewBackup
      从 originalSrc 重建变换后预览图（applyTransforms，有缓存）
      imageSrc = rebuiltSrc（仅预览，不写 DB）
      等待 canvas 重绘完成 → resetTransform（复位缩放）

用户拖拽裁切框 → CropTool 内部状态更新（比例坐标）

用户按 Enter / 点击应用
  → CropTool.doCommit → emit crop:commit(rect)
  → handleCropCommit：canvas 裁剪 → applyEditedSrc
  → applyEditedSrc：更新 imageSrc + saveCropData（IndexedDB）

用户按 Esc / 点击取消
  → restoreCropPreview：imageSrc = cropPreviewBackup
```

---

## 10. 持久化策略

| 数据 | 存储位置 | 时机 |
|------|----------|------|
| 图片原始 Blob + dataUrl | IndexedDB `blob` + `src` | 上传时一次性写入，永不覆盖 |
| 裁切后图片 dataUrl | IndexedDB `editedSrc` | 裁切提交时写入 |
| 裁切状态（旋转/翻转/区域） | IndexedDB `cropStateJson` | 裁切提交时写入 |
| 调色参数（基础 + HSL + 蒙版） | IndexedDB `adjustmentsJson` | 防抖 500ms 自动保存 |
| 面板布局（宽度/高度） | localStorage | 拖拽结束时保存 |
| 缩略图 | IndexedDB `thumbnail` | 上传时生成并写入 |

**页面刷新恢复顺序：**
1. `useImageState.onMounted` → `loadImagesFromDB` → 恢复图片列表，`src` 优先用 `editedSrc`
2. `watch(selectedImageId, immediate)` → `loadCropData` + `applyStoredAdjustments`
3. `applyStoredAdjustments` → 反序列化 adjustments + hslAdjustments + mask（重建 canvas）

---

## 11. 性能策略

| 策略 | 实现位置 | 说明 |
|------|----------|------|
| Worker 分片并行 | useHSLState | 像素数据均分 N 片，N = min(hardwareConcurrency, 8) |
| 双缓存（预览/原图） | useHSLState | 预览版 ≤1200px 实时响应，原图版 500ms 后精细处理 |
| Worker 跳帧 | useHSLState | poolBusy 时只保留最新请求（pendingReq） |
| Transferable 传输 | 所有 Worker | ArrayBuffer 零拷贝传递 |
| 变换缓存 | WorkstationPage.applyTransforms | Map 缓存相同参数的变换结果 |
| 预热变换缓存 | WorkstationPage | 图片加载后 requestIdleCallback 预热 |
| 蒙版参数直接更新 | useHSLState.updateMaskLayerAdj | 滑块拖动时不重传 canvas，直接修改参数触发处理 |
| RGB 分析防抖 | RGBAnalysis | 80ms 防抖，Worker 忙时排队最新 src |
| 直方图缓存 | RGBAnalysis | 切换 tab 直接用 cachedResult 重绘 |
| canvas 渲染 | ImagePreview | 用 canvas 而非 img，保证像素精度，will-change: transform |
| 蒙版 overlay 裁剪 | MaskCanvas | overlay 与容器取交集，不超出预览区 |
| 位置轮询 | CropTool | rAF 轮询 canvas 位置（面板拖拽时 CSS transform 不触发 ResizeObserver） |

---

## 12. 关键交互说明

### 裁切预览与取消

进入裁切模式时，`imageSrc` 被替换为变换后的预览图（不含裁切），`cropPreviewBackup` 保存原值。取消时恢复 `cropPreviewBackup`，不触发蒙版重置等副作用（通过 `isCropPreviewRestoring` 标志位跳过相关 watch）。

### 蒙版与裁切互斥

裁切提交（`applyEditedSrc`）时，如果存在蒙版层，强制清除（蒙版坐标基于裁切前图片，裁切后坐标失效）。复原原图（`handleCropRestore`）时同样清除蒙版。

### 蒙版 overlay 隐藏时机

`maskShowOverlay` 传入 `ImagePreview` 的条件：
```
!!maskShowOverlay
&& !adjSliderDragging        // 局部调色滑块拖动中隐藏（避免频繁重绘干扰）
&& activePanelTab === 'mask' // 只在蒙版 tab 显示
&& !!maskActiveLayerId       // 有选中层
&& maskActiveLayer?.enabled  // 选中层已启用
```

### 图片切换

切换图片时：
1. 清除 `cropPreviewBackup`
2. 重置 `currentCropState`
3. 从 IndexedDB 加载该图片的裁切状态
4. `applyStoredAdjustments` 加载调色参数（`isLoadingAdjustments = true` 期间不触发自动保存）
5. 后台预热变换缓存

### 保存图片

`handleSaveImage` 调用 `exportProcessed`，在 Worker 中用 `fullData`（原图尺寸）走完整处理链，返回高质量 dataUrl，触发浏览器下载。PNG 格式通过 canvas.toDataURL 转换，JPEG 直接用 Worker 输出的 JPEG dataUrl。


---

## 13. 页面布局图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TopNavbar  (height: 5vh, #666)                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┬───┬─────────────────────────────┐
│                  ImageDisplay (80%)               │ ║ │       AdjustPanel (20%)     │
│                                                   │ ║ │                             │
│  ┌────────────────────────────────────────────┐  │ ║ │  ┌───────────────────────┐  │
│  │                                            │  │ ║ │  │  图片调整  [header]   │  │
│  │                                            │  │ ║ │  └───────────────────────┘  │
│  │                                            │  │ ║ │                             │
│  │            ImagePreview                    │  │ ║ │  ┌─────────────────────┐ ┌┐ │
│  │         (canvas + MaskCanvas               │  │ ║ │  │                     │ │☀│ │
│  │              + CropTool)                   │  │ ║ │  │   panel-content     │ │✂│ │
│  │                                            │  │ ║ │  │                     │ │◻│ │
│  │   ┌──────────────────────────────────┐    │  │ ║ │  │  (BasicAdjustPanel  │ │ │ │
│  │   │  [scale: 120%]  [复位]           │    │  │ ║ │  │   / CropPanel       │ │ │ │
│  │   └──────────────────────────────────┘    │  │ ║ │  │   / MaskAdjustPanel)│ │ │ │
│  │                                            │  │ ║ │  │                     │ │ │ │
│  │   ┌──────────────────────────────────┐    │  │ ║ │  │                     │ └┘ │
│  │   │  [裁切操作栏: 800×600  取消 应用]│    │  │ ║ │  │                     │    │
│  │   └──────────────────────────────────┘    │  │ ║ │  └─────────────────────┘    │
│  │                                            │  │ ║ │       side-rail             │
│  └────────────────────────────────────────────┘  │ ║ │  (☀基础 / ✂裁切 / ◻蒙版)  │
│  ════════════════ GalleryResizer ════════════════ │ ║ │                             │
│  ┌────────────────────────────────────────────┐  │ ║ │                             │
│  │  图片全览  [3张]  [⟳]  [+]               │  │ ║ │                             │
│  │  ┌──────┐  ┌──────┐  ┌──────┐             │  │ ║ │                             │
│  │  │ img1 │  │ img2 │  │ img3 │  ←scroll→  │  │ ║ │                             │
│  │  │[选中]│  │      │  │      │             │  │ ║ │                             │
│  │  └──────┘  └──────┘  └──────┘             │  │ ║ │                             │
│  └────────────────────────────────────────────┘  │ ║ │                             │
│              ImageGallery (height: 20vh)          │ ║ │                             │
└──────────────────────────────────────────────────┴───┴─────────────────────────────┘
                                              PanelResizer


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BasicAdjustPanel 展开图（右侧 panel-content，activeTab = 'basic'）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────┐
  │  图像分析  [直方图] [波形图]         │
  │  ┌───────────────────────────────┐  │
  │  │  ██ ▓▓ ░░  (RGB histogram)   │  │
  │  └───────────────────────────────┘  │
  │  [全部] [●红] [●绿] [●蓝]          │
  ├─────────────────────────────────────┤
  │  基础                               │
  │  亮度    +30  ↺  ────●──────────   │
  │  对比度   0      ──────●──────────  │
  │  清晰度  -10  ↺  ────●──────────   │
  │  色彩                               │
  │  饱和度   0      ──────●──────────  │
  │  自然饱和度 +20 ↺ ──────●────────  │
  │  色相    +15  ↺  ──────●────────── │
  │  色温    -30  ↺  ────●──────────   │
  ├─────────────────────────────────────┤
  │  色相 / 饱和度 / 明度               │
  │  [红][橙][黄][绿][青][蓝][紫]       │
  │  色相 H  +0    ──────●──────────   │
  │  饱和度 S +0   ──────●──────────   │
  │  明度 L  +0    ──────●──────────   │
  ├─────────────────────────────────────┤
  │  [    选择图片    ]                 │
  │  [  重置参数  ]  [ 保存图片 ] [PNG▾]│
  └─────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CropPanel 展开图（activeTab = 'crop'）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────┐
  │  裁切比例                           │
  │  ┌──────┐ ┌──────┐ ┌──────┐        │
  │  │  □   │ │  ■   │ │  ▬   │        │
  │  │ 自由 │ │ 1:1  │ │ 4:3  │        │
  │  └──────┘ └──────┘ └──────┘        │
  │  ┌──────┐ ┌──────┐ ┌──────┐        │
  │  │  ▮   │ │  ━   │ │  ▯   │        │
  │  │ 3:4  │ │ 16:9 │ │ 9:16 │        │
  │  └──────┘ └──────┘ └──────┘        │
  │  [自定义]  [宽___] : [高___]        │
  ├─────────────────────────────────────┤
  │  旋转 / 翻转                        │
  │  [↺逆时针] [↻顺时针] [↔水平] [↕垂直]│
  ├─────────────────────────────────────┤
  │  在左侧图片上拖拽调整裁切框          │
  │  按 Enter 确认，Esc 取消            │
  ├─────────────────────────────────────┤
  │  [↺ 复原原图]                       │
  └─────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MaskAdjustPanel 展开图（activeTab = 'mask'）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────┐
  │  蒙版                    [预览]     │
  │  [+ 线性渐变]  [+ 径向渐变]         │
  ├─────────────────────────────────────┤
  │  ┌────┐  线性 1    线性  [👁] [×]   │
  │  │▓▒░ │                             │
  │  └────┘                             │
  │  ┌────┐  径向 2    径向  [👁] [×]   │
  │  │ ◎  │  ← 选中层（高亮）           │
  │  └────┘                             │
  ├─────────────────────────────────────┤
  │  形状                               │
  │  拖拽图片设置椭圆范围               │
  │  羽化  ────────●──  35%             │
  │  区域  [内部●] [外部 ]              │
  │  [反转]  [清除]                     │
  ├─────────────────────────────────────┤
  │  局部调整                [全部重置] │
  │  曝光    ──────|──────  +0          │
  │  对比度  ──────|──────  +0          │
  │  饱和度  ──────|──────  +0          │
  │  自然饱和度 ───|──────  +0          │
  │  色温    ──────|──────  +0          │
  │  清晰度  ──────|──────  +0          │
  │  色相    ──────|──────  +0          │
  └─────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  裁切工具叠加层（CropTool，叠加在 ImagePreview canvas 上）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────────────────────┐
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← shade top
  │▓▓▓┌──────────────────────────────────┐▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓│  ·  ·  ·  │  ·  ·  ·  │  ·  ·  │▓▓▓▓▓▓▓▓▓▓▓▓│  ← shade left/right
  │▓▓▓│           │           │         │▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │▓▓▓▓▓▓▓▓▓▓▓▓│  ← 三等分参考线
  │▓▓▓│           │           │         │▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓│           │           │         │▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓└──────────────────────────────────┘▓▓▓▓▓▓▓▓▓▓▓▓│
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← shade bottom
  │              ┌──────────────────────┐              │
  │              │ 1280×720  取消  应用 │              │  ← crop-toolbar
  │              └──────────────────────┘              │
  └─────────────────────────────────────────────────────┘
  ■ = 角落手柄（corner）   □ = 边缘手柄（handle）   ─ = 参考线（gl）
```
