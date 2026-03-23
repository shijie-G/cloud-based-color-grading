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
│   ├── ImagePreview.vue             # 图片预览 canvas
│   ├── ImageGallery.vue             # 图片全览缩略图列表
│   ├── PanelResizer.vue             # 左右面板拖拽分割线
│   ├── AdjustPanel.vue              # 右侧调色面板（容器）
│   ├── AdjustmentControls.vue       # 基础/色彩调色滑块
│   ├── HSLControls.vue              # HSL 颜色范围调节
│   ├── RGBAnalysis.vue              # 直方图 + 波形图分析
│   └── ActionButtons.vue            # 操作按钮（选择/保存/重置）
│
├── composables/
│   ├── useLayoutState.ts            # 布局状态（面板宽度、高度、拖拽）
│   ├── useImageState.ts             # 图片状态（上传、选择、列表）
│   ├── useImageStorage.ts           # IndexedDB 存取封装
│   ├── useAdjustmentState.ts        # 基础调色参数 + CSS filter 计算
│   ├── useHSLState.ts               # HSL 像素级处理状态管理
│   └── useHSLProcessor.ts           # HSL 类型定义 + 默认值
│
├── workers/
│   ├── hslWorker.ts                 # HSL 像素处理 Web Worker
│   └── rgbWorker.ts                 # RGB 直方图/波形分析 Web Worker
│
└── utils/
    └── imageDB.ts                   # IndexedDB 数据库类封装
```

---

## 布局结构

```
┌─────────────────────────────────────────────────────┐
│                    TopNavbar                         │
├──────────────────────────┬──┬──────────────────────┤
│                          │  │                        │
│      ImageDisplay        │  │     AdjustPanel        │
│  ┌────────────────────┐  │P │  ┌──────────────────┐ │
│  │   ImagePreview     │  │a │  │   RGBAnalysis    │ │
│  │   (canvas)         │  │n │  │  直方图 / 波形图  │ │
│  │                    │  │e │  ├──────────────────┤ │
│  ├────────────────────┤  │l │  │AdjustmentControls│ │
│  │   GalleryResizer   │  │R │  │  基础 / 色彩滑块  │ │
│  ├────────────────────┤  │e │  ├──────────────────┤ │
│  │   ImageGallery     │  │s │  │   HSLControls    │ │
│  │   缩略图列表        │  │i │  │  7色相范围调节   │ │
│  └────────────────────┘  │z │  ├──────────────────┤ │
│   leftPanelWidth%        │e │  │  ActionButtons   │ │
│                          │r │  └──────────────────┘ │
│                          │  │   rightPanelWidth%     │
└──────────────────────────┴──┴──────────────────────┘
```

- 左右面板宽度比例可拖拽，范围 70%~85% / 15%~30%
- 全览区高度可拖拽，范围 16vh~35vh
- 布局参数持久化到 `localStorage`，刷新后自动恢复

---

## 核心工作流

### 1. 图片上传流程

```
用户选择文件 / 拖拽文件到预览区
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
            └─ Object.assign(hslAdjustments, data.hslAdjustments)
```

### 3. 基础调色流程（CSS filter）

```
用户拖动亮度/对比度/饱和度等滑块
    │
    ▼
AdjustmentControls emit 'update:adjustments'
    │
    ▼
WorkstationPage → setAdjustments(newValues)
    │
    ▼
useAdjustmentState.adjustments (reactive)
    │
    ▼
imageFilter (computed) 自动重新计算 CSS filter 字符串
    │
    ▼
ImagePreview canvas style.filter = imageFilter   # GPU 加速，无像素遍历
    │
    ▼
RGBAnalysis 监听 imageFilter 变化 → 重新分析
    │
    ▼
scheduleSave() → 500ms 防抖 → IndexedDB 写入
```

**CSS filter 参数映射：**

| 参数 | 范围 | CSS 映射 |
|------|------|----------|
| brightness | -150 ~ +150 | `brightness(0~2)` |
| contrast | -100 ~ +100 | `contrast(0~2)` |
| saturation | -100 ~ +100 | `saturate(0~2)` |
| vibrance | -100 ~ +100 | `saturate` 弱叠加（÷333） |
| hue | -180 ~ +180 | `hue-rotate(-180deg~+180deg)` |
| temperature | -100 ~ +100 | `hue-rotate` ±20deg + `sepia` 最多 15% |
| clarity | -100 ~ +100 | `brightness` 轻微叠加（÷1000） |

### 4. HSL 像素级处理流程

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
useHSLState watch(hslAdjustments)
    │
    ├─ scheduleProcess(adj, hires=false)   # 立即处理预览版（≤1200px）
    │       │
    │       ▼
    │   processParallel(previewData, adj)
    │       │
    │       ├─ 切分像素数组为 N 份（N = min(CPU核数, 8)）
    │       ├─ 每份发给一个 hslWorker（Transferable，零拷贝）
    │       ├─ Worker 并行处理（RGB→HSL→调整→RGB）
    │       └─ 合并结果 → canvas.toDataURL(JPEG, 0.88)
    │               └─ processedSrc.value = dataURL
    │
    └─ scheduleHires(adj)                  # 800ms 后处理原图版
            └─ processParallel(fullData, adj)
                    └─ processedSrc.value = JPEG 0.95
```

**hslWorker 颜色范围权重算法：**

每个像素先转换为 HSL，然后对 7 个颜色范围分别计算权重：

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

### 5. 图像分析流程（直方图/波形图）

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
            │
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

**直方图渲染优化：** 使用 `globalCompositeOperation = 'screen'` 混合三通道，避免半透明叠加产生黑柱割裂。

### 6. 图片导出流程

```
用户点击"保存图片"，选择格式（PNG / JPEG）
    │
    ▼
WorkstationPage.handleSaveImage(format)
    │
    ├─ exportProcessed(format, quality)
    │       │
    │       ├─ 无 HSL 调整 → 直接返回原图 src
    │       └─ 有 HSL 调整 → processParallel(fullData, adj)
    │               └─ 原图完整尺寸处理（不缩小）
    │               └─ canvas.toDataURL(format, quality)
    │
    ├─ 创建 canvas（原图尺寸）
    ├─ ctx.filter = imageFilter（叠加 CSS filter）
    ├─ ctx.drawImage(hslResult)
    └─ canvas.toDataURL → <a> 下载
```

导出保证：HSL 像素处理用原图完整尺寸，CSS filter 通过 canvas 二次渲染叠加，最终输出与预览效果一致。

### 7. 调色参数持久化流程

```
用户调整任意参数（adjustments 或 hslAdjustments）
    │
    ▼
watch(adjustments / hslAdjustments, scheduleSave, { deep: true })
    │
    ├─ isLoadingAdjustments === true → 跳过（防止加载期间误写）
    └─ 500ms 防抖 → saveAdjustments(imageId, JSON)
            │
            ▼
        IndexedDB updateAdjustments(id, json)
            └─ 只更新 adjustmentsJson 字段，不重写 blob（性能优化）

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
  }
}
```

---

## 数据持久化

### IndexedDB 结构

数据库名：`WorkstationDB`，版本：`v4`，Store：`images`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 主键，`Date.now() + Math.random()` |
| name | string | 文件名 |
| blob | Blob | 原始文件二进制 |
| src | string | base64 DataURL（用于预览） |
| thumbnail | string | 200px 压缩缩略图 base64，JPEG 0.7 |
| fileHash | string | `文件名_大小_类型` 去重标识 |
| adjustmentsJson | string | JSON 格式调色参数，向后兼容 |
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
| hslWorker | min(CPU核数, 8) | HSL 像素处理，分片并行 |
| rgbWorker | 1（复用） | 直方图 + 波形数据计算 |

所有 Worker 通信使用 `Transferable`（`ArrayBuffer` 零拷贝转移），避免结构化克隆的内存复制开销。

### 双缓存策略（HSL）

- 预览版：原图缩放到 ≤1200px，拖动时实时处理，JPEG 0.88 输出
- 原图版：完整尺寸，停止操作 800ms 后处理，JPEG 0.95 输出
- 导出时：强制用原图版重新处理，保证输出质量

### 跳帧策略

Worker 忙时只保留最新请求（`pendingReq`），丢弃中间帧，避免请求堆积导致的延迟累积。

### 直方图优化

- 图片缩放到 ≤600px 再分析，减少像素量
- Worker 计算完成后主线程只做 canvas 绘制，无像素遍历
- 参数变化立即触发（无防抖），图片切换 80ms 防抖
- 切换 tab（直方图↔波形图）直接用缓存结果重绘，不重算

---

## 状态流向图

```
                    WorkstationPage
                         │
        ┌────────────────┼────────────────┐
        │                │                │
  useLayoutState   useImageState    useAdjustmentState
  leftPanelWidth   imageSrc         adjustments
  galleryHeight    uploadedImages   imageFilter (computed)
  localStorage     selectedImageId  IndexedDB (adjustmentsJson)
                   IndexedDB
                        │
                   useHSLState
                   hslAdjustments
                   processedSrc
                        │
                   hslWorker × N
                   (并行分片处理)
                        │
                   ImagePreview (canvas)
                        │
                   RGBAnalysis
                        │
                   rgbWorker × 1
                   (直方图+波形)
```

---

## 扩展说明

### 新增调色参数

1. 在 `component-interfaces.ts` 的 `AdjustmentValues` 加字段
2. 在 `useAdjustmentState.ts` 的 `adjustments` 初始值和 `imageFilter` computed 加映射
3. 在 `AdjustmentControls.vue` 的 `basicItems` 或 `colorItems` 加滑块定义
4. `adjustmentsJson` 自动包含新字段，旧记录读取时缺失字段会被忽略（向后兼容）

### 新增 HSL 颜色范围

在 `useHSLProcessor.ts` 的 `HSLAdjustments` 加键，同步更新 `hslWorker.ts` 的 `COLOR_KEYS`、`CENTERS`、`HALF`、`SOFT` 数组，以及 `HSLControls.vue` 的 `tabs` 数组。

### 接入蒙版工具

蒙版合成结果替换 `processedSrc` 的位置，`RGBAnalysis` 和 `ImagePreview` 无需改动，直方图自动反映合成后的像素分布。
