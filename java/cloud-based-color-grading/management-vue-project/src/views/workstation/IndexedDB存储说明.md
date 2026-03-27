# IndexedDB 存储说明

> 本文档描述 Workstation 工作台的 IndexedDB 持久化方案，涵盖数据库结构、字段说明、版本升级策略、各层 API 及完整使用流程。

---

## 目录

1. 数据库基本信息
2. 数据表结构（当前 v5）
3. 版本升级历史
4. 底层封装：imageDB.ts
5. 业务层封装：useImageStorage.ts
6. 集成层：useImageState.ts
7. 持久化数据分类与写入时机
8. 页面刷新恢复流程
9. 调试方法
10. 浏览器兼容性与容量
11. 注意事项

---

## 1. 数据库基本信息

| 项目 | 值 |
|------|----|
| 数据库名 | `WorkstationDB` |
| 当前版本 | `5` |
| Object Store | `images` |
| 主键 | `id`（number，keyPath） |

---

## 2. 数据表结构（当前 v5）

```typescript
interface ImageDBItem {
  // ── 主键 ──────────────────────────────────────────
  id: number                // Date.now() + Math.random()，唯一标识

  // ── 原始图片（永不覆盖） ──────────────────────────
  name: string              // 文件名，如 "photo.jpg"
  blob: Blob                // 原始图片二进制（用于重新生成 File 对象）
  src: string               // 原始图片 dataUrl（永不被裁切/编辑覆盖）

  // ── 编辑后图片（可选，有则优先用于预览） ──────────
  editedSrc?: string        // 裁切/旋转/翻转后的图片 dataUrl
  cropStateJson?: string    // 非破坏性裁切参数 JSON（CropState）

  // ── 调色参数（可选） ──────────────────────────────
  adjustmentsJson?: string  // 调色参数 JSON（含基础调色 + HSL + 蒙版层）

  // ── 辅助字段 ──────────────────────────────────────
  thumbnail?: string        // 缩略图 dataUrl（最大 200px，JPEG 0.7 质量）
  uploadTime: Date          // 首次上传时间（排序用）
  lastModified: Date        // 最后修改时间
  fileHash?: string         // 去重哈希：name_size_type
}
```

### 索引

| 索引名 | 字段 | unique |
|--------|------|--------|
| `uploadTime` | uploadTime | false |
| `name` | name | false |
| `fileHash` | fileHash | false |

---

## 3. 版本升级历史

| 版本 | 变更内容 |
|------|----------|
| v1 | 初始版本：id / name / blob / src / uploadTime / lastModified |
| v2 | 新增 `fileHash` 字段 + `fileHash` 索引（去重功能） |
| v3 | 无结构变更（内部逻辑调整） |
| v4 | 新增 `adjustmentsJson` 字段（调色参数持久化） |
| v5 | 新增 `editedSrc` + `cropStateJson` 字段（非破坏性裁切） |

> v3 及以后新增的字段均为普通字段（非索引），旧记录读取时值为 `undefined`，自动兼容，无需数据迁移。

升级逻辑（`onupgradeneeded`）：
- 若 Store 不存在 → 全量创建（含所有索引）
- 若 `oldVersion < 2` → 补建 `fileHash` 索引
- v3/v4/v5 字段为普通字段，无需 `onupgradeneeded` 处理

---

## 4. 底层封装：imageDB.ts

路径：`utils/imageDB.ts`

导出单例 `imageDB`（`ImageDatabase` 类实例），所有方法均返回 `Promise`，内部懒初始化（首次调用时 `await this.init()`）。

### 方法列表

| 方法 | 说明 |
|------|------|
| `init()` | 打开/升级数据库，建立连接 |
| `saveImage(item)` | 写入或覆盖一条记录（`put`） |
| `getAllImages()` | 读取全部记录，按 `uploadTime` 升序排序 |
| `getImage(id)` | 按主键读取单条记录，不存在返回 `null` |
| `deleteImage(id)` | 按主键删除记录 |
| `clearAll()` | 清空整个 Store |
| `getCount()` | 返回记录总数 |
| `existsByHash(fileHash)` | 通过 `fileHash` 索引查重，返回 `boolean` |
| `updateAdjustments(id, json)` | 只更新 `adjustmentsJson` 字段（先 get 再 put，不重写 blob） |
| `getAdjustments(id)` | 读取 `adjustmentsJson`，不存在返回 `null` |
| `updateCropData(id, editedSrc, cropStateJson)` | 只更新 `editedSrc` + `cropStateJson`（不覆盖原图） |
| `getCropData(id)` | 读取 `{ editedSrc, cropStateJson }`，不存在返回 `null` |
| `clearCropData(id)` | 删除 `editedSrc` 和 `cropStateJson` 字段（复原原图时调用） |

### 关键设计原则

- `blob` 和 `src`（原图）**永不被覆盖**，裁切/编辑只写 `editedSrc`
- `updateAdjustments` / `updateCropData` 均采用 **先 get 再 put** 模式，只修改目标字段，避免覆盖其他字段
- `existsByHash` 捕获索引不存在的异常（旧版本数据库），返回 `false` 而非抛出错误

---

## 5. 业务层封装：useImageStorage.ts

路径：`composables/useImageStorage.ts`

对 `imageDB` 的业务语义封装，供 `useImageState` 和 `WorkstationPage` 调用。

### 方法列表

| 方法 | 说明 |
|------|------|
| `saveImageToDB(image)` | 保存 ImageItem（先读已有记录，保留 editedSrc/cropStateJson/adjustmentsJson，再写入） |
| `loadImagesFromDB()` | 加载全部图片，`src` 优先使用 `editedSrc`（有裁切版本则展示裁切后图片） |
| `deleteImageFromDB(id)` | 删除指定图片 |
| `clearAllImagesFromDB()` | 清空所有图片 |
| `getStoredImageCount()` | 获取存储数量 |
| `generateFileHash(file)` | 生成去重哈希：`${name}_${size}_${type}` |
| `checkFileExists(hash)` | 查重，重复返回 `true` |
| `saveAdjustments(id, json)` | 保存调色参数 JSON |
| `loadAdjustments(id)` | 读取调色参数 JSON，不存在返回 `null` |
| `saveCropData(id, editedSrc, cropState)` | 保存裁切数据（editedSrc + CropState 序列化） |
| `loadCropData(id)` | 读取裁切数据，返回 `{ editedSrc?, cropState? }` |
| `loadOriginalSrc(id)` | 读取原始图片 src（永不被裁切覆盖的原图 dataUrl） |

### saveImageToDB 的保留逻辑

```
1. imageDB.getImage(id)  → 读取已有记录
2. 构建新 ImageDBItem：
   - blob / src / name / thumbnail / fileHash  ← 来自新上传的 ImageItem
   - editedSrc / cropStateJson / adjustmentsJson ← 保留已有记录的值（若存在）
   - uploadTime ← 已有记录的值（首次上传时间不变）
   - lastModified ← new Date()
3. imageDB.saveImage(newItem)
```

这样即使重新调用 `saveImageToDB`，也不会丢失已保存的调色参数和裁切数据。

---

## 6. 集成层：useImageState.ts

路径：`composables/useImageState.ts`

图片状态管理，`onMounted` 自动从 IndexedDB 恢复。

### 上传流程

```
handleImageUpload(file)
  ├─ generateFileHash(file)
  ├─ checkFileExists(hash) → 重复则 alert 并 return
  ├─ FileReader.readAsDataURL
  ├─ generateThumbnail(src)  ← canvas 压缩到 200px，JPEG 0.7
  ├─ 构建 ImageItem { id: Date.now()+random, name, src, originalSrc: src, thumbnail, originalFile, fileHash }
  ├─ uploadedImages.value.push(imageData)
  ├─ saveImageToDB(imageData)  ← 写 IndexedDB
  └─ selectImage(imageData)   ← 更新 imageSrc + selectedImageId
```

### 页面恢复流程（onMounted）

```
loadImagesFromDB()
  ├─ 返回 ImageItem[]（src = editedSrc ?? originalSrc）
  ├─ uploadedImages.value = savedImages
  └─ selectImage(savedImages[0])  ← 自动选中第一张
```

---

## 7. 持久化数据分类与写入时机

| 数据类型 | 字段 | 写入时机 | 是否覆盖原图 |
|----------|------|----------|-------------|
| 原始图片 Blob | `blob` | 上传时一次性写入 | — |
| 原始图片 dataUrl | `src` | 上传时一次性写入 | 永不覆盖 |
| 缩略图 | `thumbnail` | 上传时生成并写入 | — |
| 去重哈希 | `fileHash` | 上传时写入 | — |
| 裁切/旋转后图片 | `editedSrc` | 裁切提交 / 旋转翻转后 | 否（独立字段） |
| 裁切状态参数 | `cropStateJson` | 裁切提交 / 旋转翻转后 | 否（独立字段） |
| 调色参数（全量） | `adjustmentsJson` | 防抖 500ms 自动保存 | 否（独立字段） |

### adjustmentsJson 的内容结构

```json
{
  "adjustments": {
    "brightness": 30,
    "contrast": 0,
    "saturation": 20,
    "vibrance": 0,
    "hue": 0,
    "temperature": -15,
    "clarity": 10
  },
  "hslAdjustments": {
    "red":    { "hue": 0, "saturation": 0, "lightness": 0 },
    "orange": { "hue": 0, "saturation": 0, "lightness": 0 },
    "yellow": { "hue": 0, "saturation": 0, "lightness": 0 },
    "green":  { "hue": 0, "saturation": 0, "lightness": 0 },
    "cyan":   { "hue": 0, "saturation": 0, "lightness": 0 },
    "blue":   { "hue": 0, "saturation": 0, "lightness": 0 },
    "purple": { "hue": 0, "saturation": 0, "lightness": 0 }
  },
  "mask": [
    {
      "id": "mask-1",
      "name": "线性 1",
      "enabled": true,
      "type": "linear",
      "linear": { "x1": 0.2, "y1": 0.5, "x2": 0.8, "y2": 0.5, "feather": 0.1 },
      "radial": { "cx": 0.5, "cy": 0.5, "rx": 0.25, "ry": 0.25, "angle": 0, "feather": 0.15, "invert": false },
      "adjustments": { "brightness": 40, "contrast": 0, "saturation": 0, "vibrance": 0, "hue": 0, "temperature": 0, "clarity": 0 }
    }
  ]
}
```

> 蒙版的 `canvas` 字段不序列化（canvas 不可 JSON 化），恢复时根据参数重新调用 `generateLayerMask` 重建。

### cropStateJson 的内容结构

```json
{
  "rotate": 90,
  "flipH": false,
  "flipV": false,
  "rect": { "x": 100, "y": 50, "w": 800, "h": 600 }
}
```

---

## 8. 页面刷新恢复流程

```
浏览器刷新
  │
  ├─ useLayoutState.onMounted
  │    └─ localStorage.getItem('workstation-layout-settings')
  │         → 恢复面板宽度 + 全览高度
  │
  ├─ useImageState.onMounted
  │    └─ loadImagesFromDB()
  │         → uploadedImages = [...]
  │         → selectImage(images[0])
  │              → imageSrc = editedSrc ?? src
  │              → selectedImageId = images[0].id
  │
  └─ WorkstationPage: watch(selectedImageId, { immediate: true })
       ├─ loadCropData(id)
       │    → currentCropState = cropData.cropState ?? DEFAULT_CROP_STATE
       └─ applyStoredAdjustments(id)
            ├─ loadAdjustments(id)  → JSON.parse
            ├─ setAdjustments(data.adjustments)
            ├─ Object.assign(hslAdjustments, data.hslAdjustments)
            └─ 若有蒙版数据：
                 new Image().onload → maskInitSize(w, h)
                                    → loadFromSerializable(data.mask)
                                    → setMaskLayers([...maskLayers])
```

---

## 9. 调试方法

### 浏览器开发者工具查看数据

1. 打开 DevTools（F12）
2. 进入 **Application**（Chrome/Edge）或 **Storage**（Firefox）标签
3. 展开 **IndexedDB → WorkstationDB → images**
4. 可直接查看每条记录的所有字段

### 常用调试操作

```javascript
// 控制台直接操作（开发环境）

// 查看所有图片记录
const req = indexedDB.open('WorkstationDB')
req.onsuccess = e => {
  const db = e.target.result
  const tx = db.transaction('images', 'readonly')
  tx.objectStore('images').getAll().onsuccess = r => console.log(r.target.result)
}

// 清空数据库（重置测试）
const req2 = indexedDB.open('WorkstationDB')
req2.onsuccess = e => {
  const db = e.target.result
  db.transaction('images', 'readwrite').objectStore('images').clear()
}
```

### 控制台日志

代码中已有以下日志输出：

| 日志内容 | 触发位置 |
|----------|----------|
| `已恢复 N 张图片` | useImageState.onMounted |
| `图片已从IndexedDB删除: ID xxx` | deleteImageFromDB |
| `已清空IndexedDB中的所有图片` | clearAllImagesFromDB |
| `图片已存在，跳过上传: xxx` | handleImageUpload 去重检查 |
| `从IndexedDB加载了 N 张图片` | loadImagesFromDB |

---

## 10. 浏览器兼容性与容量

### 兼容性

| 浏览器 | 最低版本 | 备注 |
|--------|----------|------|
| Chrome / Edge | 24+ | 完全支持 |
| Firefox | 16+ | 完全支持 |
| Safari | 10+ | 隐私模式下数据会话结束后清除 |

### 存储容量

| 浏览器 | 配额 |
|--------|------|
| Chrome / Edge | 可用磁盘空间的 60% |
| Firefox | 可用磁盘空间的 50% |
| Safari | 约 1GB（超出时提示用户） |

单张图片平均 2~5MB（含原图 blob + dataUrl + 缩略图），实际可存储数百张图片。

---

## 11. 注意事项

### 原图保护

`blob` 和 `src` 字段在上传后**永不被覆盖**。裁切/旋转/翻转的结果写入 `editedSrc`，复原原图时调用 `clearCropData` 删除 `editedSrc` 和 `cropStateJson` 字段，`src` 始终保持原始状态。

### 蒙版 canvas 不持久化

蒙版层的 `canvas`（`HTMLCanvasElement`）无法序列化为 JSON，持久化时只保存数学参数（`linear` / `radial` / `adjustments`）。恢复时根据参数重新调用 `generateLayerMask` 重建 canvas，效果完全一致。

### 调色参数防抖保存

调色参数变化后不立即写库，而是防抖 500ms 后写入，避免滑块拖动时频繁 I/O。`isLoadingAdjustments` 标志位在加载参数期间为 `true`，此时 watch 触发的 `scheduleSave` 会直接 return，防止加载时覆盖已有数据。

### 隐私模式

Safari 隐私模式下 IndexedDB 配额极小（约 20MB），Chrome/Firefox 隐私模式下数据在关闭浏览器后清除。

### 跨域隔离

IndexedDB 按域名（origin）隔离，不同域名无法访问彼此的数据库。

### 清除数据

用户可通过以下方式清除：
- 浏览器设置 → 清除浏览数据 → 勾选"网站数据"
- DevTools → Application → Clear storage → Clear site data
