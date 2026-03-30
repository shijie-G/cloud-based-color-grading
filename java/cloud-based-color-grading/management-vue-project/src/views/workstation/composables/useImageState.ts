import { ref, onMounted, type Ref } from 'vue'
import type { ImageItem } from '../component-interfaces'
import { useImageStorage } from './useImageStorage'
import { uploadImageToDB } from '../utils/imageUploadHelper'

/**
 * 图片状态管理 Composable
 * 管理图片上传、选择、列表状态和相关操作
 * 集成IndexedDB持久化存储
 */

interface UseImageStateReturn {
  // 状态
  imageSrc: Ref<string>
  uploadedImages: Ref<ImageItem[]>
  selectedImageId: Ref<number | null>
  isLoadingFromDB: Ref<boolean>
  
  // 方法
  handleImageUpload: (file: File) => void
  selectImage: (image: ImageItem) => void
  getCurrentImage: () => ImageItem | null
  removeImage: (imageId: number) => void
  clearAllImages: () => void
  hasImages: () => boolean
  hasSelectedImage: () => boolean
}

export function useImageState(): UseImageStateReturn {
  // 图片源
  const imageSrc = ref<string>('')
  // 已上传的图片列表
  const uploadedImages = ref<ImageItem[]>([])
  // 当前选中的图片ID
  const selectedImageId = ref<number | null>(null)
  // 是否正在从数据库加载
  const isLoadingFromDB = ref<boolean>(false)

  // 使用存储管理
  const {
    loadImagesFromDB,
    deleteImageFromDB,
    clearAllImagesFromDB,
  } = useImageStorage()

  // 处理图片上传（使用统一的上传逻辑）
  const handleImageUpload = async (file: File): Promise<void> => {
    try {
      // 使用统一的上传逻辑（包含缩略图生成、哈希检查等）
      const result = await uploadImageToDB(file)

      const imageData: ImageItem = {
        id: result.id,
        name: result.name,
        src: result.src,
        originalSrc: result.src,
        thumbnail: result.thumbnail,
        originalFile: file,
        fileHash: result.fileHash
      }

      // 添加到已上传图片列表
      uploadedImages.value.push(imageData)

      // 设置为当前预览图片
      selectImage(imageData)
    } catch (error: any) {
      console.error('上传图片失败:', error)
      if (error.message.includes('已存在')) {
        alert(error.message)
      } else {
        alert('上传图片失败')
      }
    }
  }

  // 选择图片进行编辑
  const selectImage = (image: ImageItem): void => {
    imageSrc.value = image.src
    selectedImageId.value = image.id
  }

  // 获取当前选中的图片对象
  const getCurrentImage = (): ImageItem | null => {
    if (!selectedImageId.value) return null
    return uploadedImages.value.find(img => img.id === selectedImageId.value) || null
  }

  // 删除图片
  const removeImage = async (imageId: number): Promise<void> => {
    const index = uploadedImages.value.findIndex(img => img.id === imageId)
    if (index > -1) {
      uploadedImages.value.splice(index, 1)
      
      // 从IndexedDB删除
      try {
        await deleteImageFromDB(imageId)
      } catch (error) {
        console.error('从数据库删除图片失败:', error)
      }
      
      // 如果删除的是当前选中的图片，清空预览
      if (selectedImageId.value === imageId) {
        imageSrc.value = ''
        selectedImageId.value = null
        
        // 如果还有其他图片，选择第一张
        if (uploadedImages.value.length > 0) {
          selectImage(uploadedImages.value[0])
        }
      }
    }
  }

  // 清空所有图片
  const clearAllImages = async (): Promise<void> => {
    uploadedImages.value = []
    imageSrc.value = ''
    selectedImageId.value = null
    
    // 清空IndexedDB
    try {
      await clearAllImagesFromDB()
    } catch (error) {
      console.error('清空数据库失败:', error)
    }
  }

  // 检查是否有图片
  const hasImages = (): boolean => {
    return uploadedImages.value.length > 0
  }

  // 检查是否有选中的图片
  const hasSelectedImage = (): boolean => {
    return !!imageSrc.value
  }

  // 组件挂载时从IndexedDB加载图片
  onMounted(async () => {
    isLoadingFromDB.value = true
    try {
      const savedImages = await loadImagesFromDB()
      if (savedImages.length > 0) {
        uploadedImages.value = savedImages
        // 自动选择第一张图片
        selectImage(savedImages[0])
        console.log(`已恢复 ${savedImages.length} 张图片`)
      }
    } catch (error) {
      console.error('加载图片失败:', error)
    } finally {
      isLoadingFromDB.value = false
    }
  })

  return {
    // 状态
    imageSrc,
    uploadedImages,
    selectedImageId,
    isLoadingFromDB,
    
    // 方法
    handleImageUpload,
    selectImage,
    getCurrentImage,
    removeImage,
    clearAllImages,
    hasImages,
    hasSelectedImage
  }
}