# IndexedDB 图片存储实现说明

## 📁 文件结构

```
management-vue-project/src/views/workstation/
├── utils/
│   └── imageDB.ts                    # IndexedDB底层封装
├── composables/
│   ├── useImageStorage.ts            # 存储管理composable
│   └── useImageState.ts              # 图片状态管理（已集成存储）
```

## 🗄️ 数据库结构

### 数据库信息
- **数据库名**: `WorkstationDB`
- **版本**: `1`
- **存储表**: `images`

### 数据表结构 (images)
```typescript
{
  id: number              // 主键，图片唯一标识
  name: string            // 图片文件名
  blob: Blob              // 原始图片二进制数据
  src: string             // Base64格式的图片预览
  uploadTime: Date        // 上传时间
  lastModified: Date      // 最后修改时间
}
```

### 索引
- `uploadTime`: 按上传时间查询
- `name`: 按文件名查询

## 🔧 核心功能

### 1. imageDB.ts - 底层数据库操作

提供的方法：
- `init()` - 初始化数据库连接
- `saveImage(image)` - 保存图片
- `getAllImages()` - 获取所有图片
- `getImage(id)` - 根据ID获取图片
- `deleteImage(id)` - 删除图片
- `clearAll()` - 清空所有图片
- `getCount()` - 获取图片数量

### 2. useImageStorage.ts - 存储管理层

提供的方法：
- `saveImageToDB(image)` - 保存ImageItem到数据库
- `loadImagesFromDB()` - 从数据库加载所有图片
- `deleteImageFromDB(imageId)` - 删除指定图片
- `clearAllImagesFromDB()` - 清空所有图片
- `getStoredImageCount()` - 获取存储数量

### 3. useImageState.ts - 业务逻辑层（已集成）

新增功能：
- ✅ 上传图片时自动保存到IndexedDB
- ✅ 删除图片时同步删除IndexedDB记录
- ✅ 清空图片时同步清空IndexedDB
- ✅ 页面加载时自动从IndexedDB恢复图片
- ✅ 新增 `isLoadingFromDB` 状态（可用于显示加载提示）

## 🚀 使用方式

### 自动持久化
无需额外操作，图片会自动保存和恢复：

1. **上传图片** → 自动保存到IndexedDB
2. **删除图片** → 自动从IndexedDB删除
3. **刷新页面** → 自动从IndexedDB恢复

### 手动操作（可选）

如果需要手动控制存储，可以直接使用 `useImageStorage`：

```typescript
import { useImageStorage } from './composables/useImageStorage'

const { 
  saveImageToDB, 
  loadImagesFromDB, 
  clearAllImagesFromDB 
} = useImageStorage()

// 手动保存
await saveImageToDB(imageItem)

// 手动加载
const images = await loadImagesFromDB()

// 手动清空
await clearAllImagesFromDB()
```

## 💾 存储容量

### IndexedDB容量限制
- **Chrome/Edge**: 可用磁盘空间的 60%
- **Firefox**: 可用磁盘空间的 50%
- **Safari**: 约 1GB（会提示用户）

### 实际可存储图片数量估算
假设单张图片平均 2MB：
- 可存储约 **500-1000张** 图片（取决于浏览器和磁盘空间）

## 🔍 调试和监控

### 查看IndexedDB数据
1. 打开浏览器开发者工具
2. 进入 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）
3. 展开 **IndexedDB** → **WorkstationDB** → **images**
4. 可以查看、编辑、删除存储的数据

### 控制台日志
代码中已添加详细的日志输出：
- ✅ 图片保存成功
- ✅ 图片加载成功
- ✅ 图片删除成功
- ❌ 操作失败的错误信息

## ⚠️ 注意事项

### 1. 浏览器兼容性
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+

### 2. 隐私模式
- 隐私/无痕模式下，IndexedDB数据会在关闭浏览器后清除

### 3. 跨域限制
- IndexedDB数据按域名隔离
- 不同域名无法访问彼此的数据

### 4. 存储清理
用户可以通过以下方式清除数据：
- 浏览器设置 → 清除浏览数据 → 选择"网站数据"
- 开发者工具 → Application → Clear storage

## 🔮 未来扩展

### 可以添加的功能：
1. **图片编辑历史** - 保存每张图片的调整历史
2. **导出/导入** - 支持导出所有图片为ZIP
3. **云端同步** - 集成后端API实现跨设备同步
4. **自动清理** - 定期清理超过30天的旧图片
5. **压缩优化** - 自动压缩大图片节省空间
6. **标签分类** - 为图片添加标签和分类

## 📊 性能优化建议

### 已实现的优化：
- ✅ 使用Blob存储原始文件（比Base64节省空间）
- ✅ 异步操作不阻塞UI
- ✅ 按上传时间排序

### 可以进一步优化：
- 🔄 添加图片缩略图（减少内存占用）
- 🔄 分页加载（图片很多时）
- 🔄 懒加载（只加载可见图片）

## 🧪 测试建议

### 功能测试：
1. 上传图片 → 刷新页面 → 验证图片是否恢复
2. 上传多张图片 → 验证顺序是否正确
3. 删除图片 → 刷新页面 → 验证是否真的删除
4. 清空所有图片 → 刷新页面 → 验证是否清空

### 边界测试：
1. 上传超大图片（10MB+）
2. 上传大量图片（100+张）
3. 在隐私模式下测试
4. 清除浏览器数据后测试

## 📝 总结

✅ **已完成**：
- IndexedDB底层封装
- 存储管理composable
- 自动保存和恢复功能
- 完整的增删改查操作

✅ **优势**：
- 刷新后数据不丢失
- 无需后端支持
- 容量大（可存储数百张图片）
- 性能好（异步操作）

🎯 **使用简单**：
- 零配置，开箱即用
- 自动持久化，无需手动操作
- 完全透明，不影响现有功能
