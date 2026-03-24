# WorkstationPage 页面说明文档

## 概述

WorkstationPage 是图片编辑工作台的根页面组件，负责协调所有子模块的状态流转。页面采用三栏布局：左侧图片显示区（预览 + 全览）、中间可拖拽分割线、右侧调色面板。所有业务逻辑通过 Composable 分层管理，页面本身只做状态聚合和事件路由。

---

## 目录结构

```
workstation/
├── WorkstationPage.vue              # 根页面，状态聚合层
├── component-interfaces.ts          # 全局 TypeScript 接口定义
│
├── components/
│   ├── TopNavbar.vue                # 顶部导航栏
│   ├── ImageDisplay.vue             # 左侧图片显示区（容器）
│   ├── ImagePreview.vue             # 图片预览 canvas + 蒙版交互层
│   ├── ImageGallery.vue             # 图片全览缩略图列表
│   ├── GalleryResizer.vue           # 全览区高度拖拽分割线
│   ├── PanelResizer.vue             # 左右面板拖拽分割线
│   ├── AdjustPanel.vue              # 右侧调色面板（容器）
│   ├── BasicAdjustPanel.vue         # 调色面板内容区（聚合子面板）
│   ├── AdjustmentControls.vue       # 基础/色彩调色滑块
│   ├── HSLControls.vue              # HSL 颜色范围调节（7色相）
│   ├── MaskControls.vue             # 蒙版工具栏（层管理 + 操作按钮）
│   ├── MaskAdjustPanel.vue          # 蒙版参数调节面板
│   ├── MaskCanvas.vue               # 蒙版 overlay + 手柄交互层（叠加在 canvas 上）
│   ├── RGBAnalysis.vue              # 直方图 + 波形图分析（tab 切换）
│   ├── RGBHistogram.vue             # RGB 直方图子组件
│   ├── ActionButtons.vue            # 操作按钮（选择/保存/重置）
│   ├── UploadSection.vue            # 上传入口区域
│   └── index.ts                     # 组件统一导出
│
├── composables/
│   ├── useLayoutState.ts            # 布局状态（面板宽度、高度、拖拽）
│   ├── useImageState.ts             # 图片状态（上传、选择、列表）
│   ├── useImageStorage.ts           # IndexedDB 存取封装
│   ├── useAdjustmentState.ts        # 基础调色参数 + CSS filter 计算
│   ├── useHSLState.ts               # 完整处理链状态管理（基础调色 + HSL + 蒙版合成）
│   ├── useHSLProcessor.ts           # HSL 类型定义 + 默认值
│   └── useMaskState.ts              # 蒙版多层状态管理
│
├── workers/
│   ├── basicWorker.ts               # 基础调色像素处理 Web Worker
│   ├── hslWorker.ts                 # HSL 颜色范围像素处理 Web Worker
│   ├── maskWorker.ts                # 蒙版合成 Web Worker（lerp 混合）
│   └── rgbWorker.ts                 # RGB 直方图/波形分析 Web Worker
│
└── utils/
    └── imageDB.ts                   # IndexedDB 数据库类封装
```

---

## 布局结构

```
┌──────────────────────────────────────────────────────────────────────┐
│                           TopNavbar                                  │
├────────────────────────────────┬───┬────────────────────────────────┤
│         ImageDisplay           │   │         AdjustPanel            │
│         (flex-col)             │ P │         (flex-col)             │
│                                │ a │  ┌─────────────────────────┐  │
│  ┌──────────────────────────┐  │ n │  │      panel-header       │  │
│  │       ImagePreview       │  │ e │  │      "图片调整"          │  │
│  │  ┌────────────────────┐  │  │ l │  └─────────────────────────┘  │
│  │  │  canvas (图片渲染)  │  │  │ R │  ┌──────────┬────────────┐   │
│  │  ├────────────────────┤  │  │ e │  │panel-    │  side-rail │   │
│  │  │  MaskCanvas        │  │  │ s │  │content   │  (竖向tab) │   │
│  │  │  overlay + handles │  │  │ i │  │          │  ☀ 基础    │   │
│  │  └────────────────────┘  │  │ z │  │ ┌──────┐ │  ◻ 蒙版    │   │
│  │  scale-indicator (缩放%) │  │ e │  │ │RGB   │ │            │   │
│  │  upload-area (无图提示)  │  │ r │  │ │分析  │ │            │   │
│  └──────────────────────────┘  │   │  │ ├──────┤ │            │   │
│  ┌──────────────────────────┐  │   │  │ │基础  │ │            │   │
│  │      GalleryResizer      │  │   │  │ │调色  │ │            │   │
│  │      (高度拖拽线)         │  │   │  │ ├──────┤ │            │   │
│  └──────────────────────────┘  │   │  │ │HSL   │ │            │   │
│  ┌──────────────────────────┐  │   │  │ │控制  │ │            │   │
│  │       ImageGallery       │  │   │  │ ├──────┤ │            │   │
│  │       缩略图列表          │  │   │  │ │蒙版  │ │            │   │
│  │       galleryHeight vh   │  │   │  │ │控制  │ │            │   │
│  └──────────────────────────┘  │   │  │ ├──────┤ │            │   │
│       leftPanelWidth %         │   │  │ │操作  │ │            │   │
│                                │   │  │ │按钮  │ │            │   │
│                                │   │  │ └──────┘ └────────────┘   │
│                                │   │       rightPanelWidth %       │
└────────────────────────────────┴───┴────────────────────────────────┘
```

组件层级关系：

```
WorkstationPage
├── TopNavbar
├── ImageDisplay  (width: leftPanelWidth%, flex-col)
│   ├── ImagePreview  (flex: 1, calc(100% - galleryHeight vh - 8px))
│   │   ├── canvas  (图片渲染，CSS transform 缩放/平移)
│   │   ├── MaskCanvas  (fixed 定位，overlay + 手柄，叠加在 canvas 上)
│   │   ├── scale-indicator  (缩放比例提示，左上角)
│   │   └── upload-area  (无图时的拖拽上传提示)
│   ├── GalleryResizer  (高度拖拽分割线，minHeight 16vh ~ maxHeight 35vh)
│   └── ImageGallery  (height: galleryHeight vh)
├── PanelResizer  (左右面板拖拽分割线)
└── AdjustPanel  (width: rightPanelWidth%, flex-col)
    ├── panel-header  ("图片调整" 标题栏)
    └── panel-body  (flex-row)
        ├── panel-content  (flex: 1, overflow-y: auto, activeTab 控制显示)
        │   ├── BasicAdjustPanel  (activeTab === 'basic')
        │   │   ├── RGBAnalysis  (直方图 / 波形图)
        │   │   ├── AdjustmentControls  (基础 + 色彩滑块)
        │   │   ├── HSLControls  (7色相 × H/S/L)
        │   │   ├── MaskControls  (蒙版层管理 + 操作按钮)
        │   │   └── ActionButtons  (选择/保存/重置)
        │   └── MaskAdjustPanel  (activeTab === 'mask')
        └── side-rail  (width: 3vh, 竖向 tab 导航)
            ├── ☀ 基础调色 tab
            └── ◻ 蒙版 tab
```

布局参数：
- 左右面板宽度比例可拖拽（PanelResizer），范围 70%~85% / 15%~30%
- 全览区高度可拖拽（GalleryResizer），范围 16vh~35vh
- 右侧面板通过 `side-rail` 的 tab 切换 `BasicAdjustPanel` / `MaskAdjustPanel`
- 布局参数（leftPanelWidth、galleryHeight）持久化到 `localStorage`，刷新后自动恢复

---

## 核心工作流

### 1. 图片上传流程

```
用户选择文件 / 拖拽文件到预览区（最多 10 张）
    │
    ▼
useImageState.handleImageUpload(file)
    │
    ├─ generateFileHash(file)          # 名称+大小+类型 生成哈希
    ├─ checkFileExists(hash)           # IndexedDB 查重，重复则拒绝
    ├─ FileReader.readAsDataURL        # 读取为 base64
    ├─ generateThumbnail(src)          # canvas 压缩到 200px，JPEG 0.7
    ├─ saveImageToDB(imageData)        # 写入 IndexedDB（含 blob + src + thumbnail）
    └─ selectImage(imageData)          # 触发选中，更新 imageSrc / selectedImageId
```

### 2. 图片选择 / 切换流程

```
用户点击全览区缩略图
    │
    ▼
WorkstationPage.handleSelectImage(image)
    │
    ├─ useImageState.selectImage(image)
    │       └─ imageSrc.value = image.src
    │          selectedImageId.value = image.id
    │
    └─ applyStoredAdjustments(image.id)
            ├─ imageDB.getAdjustments(id)     # 读取 adjustmentsJson
            ├─ isLoadingAdjustments = true     # 防止加载期间触发误保存
            ├─ setAdjustments(data.adjustments)
            ├─ Object.assign(hslAdjustments, data.hslAdjustments)
            └─ 恢复蒙版层（loadMaskFromSerializable）
                    └─ maskInitSize → loadFromSerializable → setMaskCanvas
```

### 3. 完整像素处理链

```
原图 ImageData
    │
    ▼
basicWorker × N（并行分片）
    ├─ 色温 → 亮度 → 对比度 → 清晰度 → 饱和度 → 色相
    │
    ▼
hslWorker × N（并行分片）
    ├─ 红/橙/黄/绿/青/蓝/紫 × H/S/L 颜色范围调节
    │
    ▼
maskWorker × N（有蒙版时，并行分片）
    ├─ lerp(original, adjusted, maskAlpha) 逐像素混合
    │
    ▼
processedSrc（JPEG dataURL）→ ImagePreview canvas 显示
```

所有 Worker 通信使用 `Transferable`（`ArrayBuffer` 零拷贝转移）。

### 4. 基础调色流程（CSS filter + 像素处理双轨）

```
用户拖动亮度/对比度/饱和度等滑块
    │
    ▼
AdjustmentControls emit 'update:adjustments'
    │
    ▼
WorkstationPage → setAdjustments(newValues)
    │
    ├─ useAdjustmentState.adjustments (reactive)
    │       └─ imageFilter (computed) 自动重算 CSS filter 字符串
    │               └─ RGBAnalysis 监听变化 → 重新分析
    │
    └─ watch(adjustments) → setBasicAdjustments(adj)
            └─ useHSLState.triggerProcess()
                    └─ basicWorker → hslWorker → [maskWorker] → processedSrc
    │
    ▼
scheduleSave() → 500ms 防抖 → IndexedDB 写入
```

CSS filter 参数映射：

| 参数 | 范围 | CSS 映射 |
|------|------|----------|
| brightness | -150 ~ +150 | `brightness(0~2)` |
| contrast | -100 ~ +100 | `contrast(0~2)` |
| saturation | -100 ~ +100 | `saturate(0~2)` |
| vibrance | -100 ~ +100 | `saturate` 弱叠加（÷333） |
| hue | -180 ~ +180 | `hue-rotate(-180deg~+180deg)` |
| temperature | -100 ~ +100 | `hue-rotate` ±20deg + `sepia` 最多 15% |
| clarity | -100 ~ +100 | `brightness` 轻微叠加（÷1000） |

### 5. HSL 像素级处理流程

```
用户拖动 HSL 滑块（红/橙/黄/绿/青/蓝/紫 × H/S/L）
    │
    ▼
HSLControls emit 'update:hslAdjustments'
    │
    ▼
WorkstationPage → Object.assign(hslAdjustments, v)
    │
    ▼
useHSLState watch(hslAdjustments) → triggerProcess()
    │
    ├─ scheduleProcess(hires=false)    # 立即处理预览版（≤1200px）
    │       └─ basicWorker → hslWorker → [maskWorker] → JPEG 0.88
    │               └─ processedSrc.value = dataURL
    │
    └─ scheduleHires()                 # 500ms 后处理原图版
            └─ 同上流程，JPEG 0.95
```

hslWorker 颜色范围权重算法：

```
rangeWeight(hue, center, half, soft):
  diff = 色相环最短距离(hue, center)
  if diff >= half  → weight = 0（完全不影响）
  if diff <= soft  → weight = 1（完全影响）
  else             → weight = 线性插值（软边缘过渡）

颜色范围参数：
  红(0°)   half=40  soft=20
  橙(30°)  half=30  soft=15
  黄(60°)  half=35  soft=20
  绿(120°) half=50  soft=30
  青(180°) half=40  soft=20
  蓝(240°) half=50  soft=30
  紫(300°) half=50  soft=30

最终调整量 = Σ(调整值 × weight) / max(totalWeight, 1)
```

### 6. 蒙版系统流程

蒙版支持多层叠加，每层独立参数，类型为线性（linear）或径向（radial）。

```
用户在 MaskControls 点击"添加蒙版"
    │
    ▼
WorkstationPage.handleMaskToggleActive / handleMaskAddLayer(type)
    │
    ├─ 首次添加：加载原图尺寸 → maskInitSize(w, h)
    ├─ maskAddLayer(type)              # 创建新层，默认参数
    └─ setMaskCanvas(compositeCanvas)  # 触发处理链重新合成

用户在 ImagePreview 上拖拽蒙版手柄
    │
    ▼
MaskCanvas emit 'update:layer' / 'commit'
    │
    ▼
WorkstationPage.handleMaskUpdateLayer / handleMaskCommit
    │
    ├─ maskUpdateLayer(newLayer)       # 更新层参数
    ├─ generateLayerMask(layer)        # 重绘该层 canvas（线性/径向渐变）
    ├─ _rebuildComposite()             # 所有启用层 multiply 合成
    └─ setMaskCanvas(compositeCanvas)  # 注入处理链 → 触发 maskWorker 合成
            └─ requestAnimationFrame → triggerProcess()
```

蒙版层合成规则：
- 第一层直接绘制到 compositeCanvas
- 后续层使用 `globalCompositeOperation = 'multiply'` 叠加（灰度相乘 = 交集收窄）
- 禁用的层不参与合成
- compositeCanvas 为 null 时（无层/全禁用），处理链跳过蒙版步骤

MaskCanvas 手柄说明：

| 蒙版类型 | 手柄 | 功能 |
|----------|------|------|
| 线性 | p1（白色） | 起点（完全应用区域） |
| 线性 | p2（灰色） | 终点（不应用区域） |
| 线性 | mid（蓝色） | 中点，拖拽平移整条线 |
| 径向 | center（白色） | 中心点，拖拽平移 |
| 径向 | edge-x（蓝色） | X 轴半径调节 |
| 径向 | edge-y（蓝色） | Y 轴半径调节 |
| 径向 | rotate（橙色） | 旋转角度调节 |

蒙版操作：
- 反转（invert）：线性蒙版交换 p1/p2；径向蒙版切换 `invert` 标志
- 清除（clear）：将当前层 canvas 填充为黑色（全不应用）
- 叠加预览（overlay）：在 ImagePreview 上显示半透明蓝色渐变指示蒙版范围

### 7. 图像分析流程（直方图/波形图）

```
processedSrc 或 imageFilter 变化
    │
    ▼
RGBAnalysis watch 触发 scheduleAnalyze()
    │
    ├─ 图片切换：80ms 防抖
    └─ 参数变化：立即触发
            │
            ▼
        sendToWorker(src)
            ├─ 加载图片（processedSrc 优先，否则 imageSrc）
            ├─ canvas 缩放到 ≤600px
            ├─ 应用 CSS filter（imageFilter）
            ├─ getImageData → 拷贝 buffer
            └─ postMessage 到 rgbWorker（Transferable）
                    │
                    ▼
                rgbWorker 计算：
                    ├─ 直方图：R/G/B 各 256 桶统计
                    └─ 波形：256列 × 120行采样
                            │
                            ▼
                    postMessage 返回（Transferable）
                            │
                            ▼
                    主线程 requestAnimationFrame
                            ├─ drawHistogram（screen 混合模式）
                            └─ drawWaveform
```

直方图渲染使用 `globalCompositeOperation = 'screen'` 混合三通道，避免半透明叠加产生黑柱割裂。切换 tab（直方图↔波形图）直接用缓存结果重绘，不重算。

### 8. 图片导出流程

```
用户点击"保存图片"，选择格式（PNG / JPEG）
    │
    ▼
WorkstationPage.handleSaveImage(format)
    │
    └─ exportProcessed(format, quality)
            ├─ 无任何调整（基础/HSL/蒙版均为默认）→ 直接返回原图 src
            └─ 有调整 → runFullChain(fullData, basicAdj, hslAdj, hires=true, maskCanvas)
                    └─ basicWorker → hslWorker → [maskWorker]（原图完整尺寸）
                    └─ PNG 格式：二次 canvas 转换保证无损
                    └─ JPEG 格式：quality 0.95
            │
            ▼
        <a> 元素触发下载，文件名 edited-{timestamp}.{format}
```

导出保证：处理链使用原图完整尺寸（fullData），不经过预览缩放，输出与预览效果一致。

### 9. 调色参数持久化流程

```
用户调整任意参数（adjustments / hslAdjustments / 蒙版）
    │
    ▼
watch(adjustments / hslAdjustments, scheduleSave, { deep: true })
蒙版操作后手动调用 scheduleSave()
    │
    ├─ isLoadingAdjustments === true → 跳过（防止加载期间误写）
    └─ 500ms 防抖 → saveAdjustments(imageId, serializeAdjustments())
            │
            ▼
        IndexedDB updateAdjustments(id, json)
            └─ 只更新 adjustmentsJson 字段，不重写 blob

JSON 结构：
{
  "adjustments": {
    "brightness": 20, "contrast": -10, "saturation": 30,
    "vibrance": 0, "hue": 0, "temperature": 15, "clarity": 0
  },
  "hslAdjustments": {
    "red":    { "hue": 15, "saturation": 20, "lightness": 0 },
    "orange": { "hue": 0,  "saturation": 0,  "lightness": 0 },
    ...
  },
  "mask": [
    {
      "id": "mask-1", "name": "线性 1", "enabled": true, "type": "linear",
      "linear": { "x1": 0.2, "y1": 0.5, "x2": 0.8, "y2": 0.5, "feather": 0.1 },
      "radial": { "cx": 0.5, "cy": 0.5, "rx": 0.25, "ry": 0.25, "angle": 0, "feather": 0.15, "invert": false }
    }
  ]
}
```

---

## 数据持久化

### IndexedDB 结构

数据库名：`WorkstationDB`，Store：`images`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 主键，`Date.now() + Math.random()` |
| name | string | 文件名 |
| blob | Blob | 原始文件二进制 |
| src | string | base64 DataURL（用于预览） |
| thumbnail | string | 200px 压缩缩略图 base64，JPEG 0.7 |
| fileHash | string | `文件名_大小_类型` 去重标识 |
| adjustmentsJson | string | JSON 格式调色参数（含蒙版），向后兼容 |
| uploadTime | Date | 上传时间（用于排序） |
| lastModified | Date | 最后修改时间 |

索引：`uploadTime`、`name`、`fileHash`

### localStorage 结构

键名：`workstation-layout-settings`

```json
{
  "leftPanelWidth": 80,
  "galleryHeight": 20,
  "timestamp": 1234567890
}
```

---

## 性能设计

### Web Worker 并行化

| Worker | 数量 | 职责 |
|--------|------|------|
| basicWorker | min(CPU核数, 8) | 基础调色像素处理，分片并行 |
| hslWorker | min(CPU核数, 8) | HSL 颜色范围处理，分片并行 |
| maskWorker | min(CPU核数, 8) | 蒙版 lerp 合成，分片并行 |
| rgbWorker | 1（复用） | 直方图 + 波形数据计算 |

所有 Worker 通信使用 `Transferable`（`ArrayBuffer` 零拷贝转移），避免结构化克隆的内存复制开销。

### 双缓存策略

- 预览版：原图缩放到 ≤1200px，拖动时实时处理，JPEG 0.88 输出
- 原图版：完整尺寸，停止操作 500ms 后处理，JPEG 0.95 输出
- 导出时：强制用原图版重新处理，保证输出质量

### 跳帧策略

Worker 忙时只保留最新请求（`pendingReq`），丢弃中间帧，避免请求堆积导致的延迟累积。

### 蒙版异步读取

蒙版 canvas 通过 `createImageBitmap` 异步读取（`readCanvasAsync`），完全不阻塞主线程渲染帧，松手后延迟一帧（`requestAnimationFrame`）再触发处理，保证视觉流畅。

---

## 状态流向图

```
                    WorkstationPage
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
  useLayoutState   useImageState      useAdjustmentState
  leftPanelWidth   imageSrc           adjustments
  galleryHeight    uploadedImages     imageFilter (computed)
  localStorage     selectedImageId    IndexedDB (adjustmentsJson)
                   IndexedDB
                        │
              ┌─────────┴──────────┐
              │                    │
         useHSLState          useMaskState
         hslAdjustments       layers[]
         processedSrc         compositeCanvas
              │                    │
         ┌────┴────┐               │
         │         │               │
   basicWorker  hslWorker    maskWorker
   × N 并行     × N 并行     × N 并行
         │         │               │
         └────┬────┘               │
              │◄───────────────────┘
              ▼
        ImagePreview (canvas)
              │
        RGBAnalysis
              │
        rgbWorker × 1
        (直方图+波形)
```

---

## 重置行为

用户点击"重置"按钮，WorkstationPage 执行：

```javascript
resetAdjustments()                                    // 基础调色归零
setBasicAdjustments({ brightness:0, contrast:0, ... }) // 同步处理链
resetHSL()                                            // HSL 归零
resetMask()                                           // 清空所有蒙版层
setMaskCanvas(null)                                   // 断开蒙版处理链
```

重置不删除 IndexedDB 中的图片，但会在下次 `scheduleSave` 时将归零参数写回。

---

## 扩展说明

### 新增基础调色参数

1. 在 `component-interfaces.ts` 的 `AdjustmentValues` 加字段
2. 在 `useAdjustmentState.ts` 的 `adjustments` 初始值和 `imageFilter` computed 加映射
3. 在 `basicWorker.ts` 加对应像素处理逻辑
4. 在 `AdjustmentControls.vue` 的 `basicItems` 或 `colorItems` 加滑块定义
5. `adjustmentsJson` 自动包含新字段，旧记录读取时缺失字段会被忽略（向后兼容）

### 新增 HSL 颜色范围

在 `useHSLProcessor.ts` 的 `HSLAdjustments` 加键，同步更新 `hslWorker.ts` 的 `COLOR_KEYS`、`CENTERS`、`HALF`、`SOFT` 数组，以及 `HSLControls.vue` 的 `tabs` 数组。

### 新增蒙版类型

1. 在 `useMaskState.ts` 的 `MaskType` 联合类型加新值
2. 实现对应的 `drawXxxMask` 纯函数（参考 `drawLinearMask` / `drawRadialMask`）
3. 在 `generateLayerMask` 的 switch 分支加处理
4. 在 `MaskCanvas.vue` 的 `handles` computed 和 `applyHandle` 加手柄定义
5. 在 `MaskControls.vue` 加对应的添加按钮
