import { ref, onMounted, type Ref } from 'vue'
import type { ImageItem } from '../component-interfaces'
import { useImageStorage } from './useImageStorage'

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
    saveImageToDB,
    loadImagesFromDB,
    deleteImageFromDB,
    clearAllImagesFromDB,
    generateFileHash,
    checkFileExists
  } = useImageStorage()

  // 生成缩略图（压缩到最大 200px，保持比例）
  const generateThumbnail = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 200
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => resolve(src) // 失败时降级用原图
      img.src = src
    })
  }

  // 处理图片上传
  const handleImageUpload = async (file: File): Promise<void> => {
    if (file) {
      // 生成文件哈希
      const fileHash = generateFileHash(file)
      
      // 检查文件是否已存在
      try {
        const exists = await checkFileExists(fileHash)
        if (exists) {
          console.log(`图片已存在，跳过上传: ${file.name}`)
          alert(`图片 "${file.name}" 已存在，无法重复添加`)
          return
        }
      } catch (error) {
        console.warn('检查文件是否存在时出错，继续上传:', error)
      }
      
      const reader = new FileReader()
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          // 生成缩略图
          const thumbnail = await generateThumbnail(result)

          const imageData: ImageItem = {
            id: Date.now() + Math.random(), // 添加随机数避免ID冲突
            name: file.name,
            src: result,
            thumbnail,
            originalFile: file,
            fileHash: fileHash
          }
          
          // 添加到已上传图片列表
          uploadedImages.value.push(imageData)
          
          // 保存到IndexedDB
          try {
            await saveImageToDB(imageData)
          } catch (error) {
            console.error('保存图片到数据库失败:', error)
          }
          
          // 设置为当前预览图片
          selectImage(imageData)
        }
      }
      reader.readAsDataURL(file)
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