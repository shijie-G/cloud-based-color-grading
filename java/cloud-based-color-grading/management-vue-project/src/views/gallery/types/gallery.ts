// Gallery 系统类型定义

/**
 * 相册记录
 */
export interface AlbumRecord {
  id: number;           // 自增主键
  name: string;         // 相册名称（如 "2025-07-15"）
  createdAt: number;    // 创建时间戳（ms）
  sortOrder: number;    // 拖拽排序权重
  coverImageId?: number; // 封面图片 ID（可选）
}

/**
 * 图片记录
 */
export interface ImageRecord {
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

/**
 * 图片显示对象（包含 URL）
 */
export interface ImageDisplay extends Omit<ImageRecord, 'blob'> {
  url: string;          // Blob URL 用于显示
}

/**
 * 月份分组
 */
export interface MonthGroup {
  month: string;        // 月份标识（如 "2025-07"）
  albums: AlbumRecord[];
}

/**
 * 排序方式
 */
export type SortMode =
  | 'uploadedAt-asc'    // 按上传时间升序
  | 'uploadedAt-desc'   // 按上传时间降序
  | 'size-asc'          // 按文件大小升序
  | 'size-desc'         // 按文件大小降序
  | 'favorite-first';   // 收藏优先

/**
 * 快速筛选模式
 */
export type QuickFilterMode = 'all' | 'favorites' | 'recent';

/**
 * 视图模式
 */
export type ViewMode = 'albums' | 'browser' | 'favorites' | 'trash';

/**
 * 右键菜单选项
 */
export interface ContextMenuOption {
  label: string;
  icon?: string;
  action: () => void;
  divider?: boolean;
}
