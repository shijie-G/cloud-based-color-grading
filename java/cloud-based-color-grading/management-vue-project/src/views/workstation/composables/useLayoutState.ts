import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'

/**
 * 布局状态管理 Composable
 * 管理左右面板宽度、图片全览区高度、拖拽状态和布局设置持久化
 */

interface LayoutSettings {
  leftPanelWidth: number
  galleryHeight: number
  timestamp: number
}

interface UseLayoutStateReturn {
  // 状态
  leftPanelWidth: Ref<number>
  rightPanelWidth: ComputedRef<number>
  isResizing: Ref<boolean>
  galleryHeight: Ref<number>
  isGalleryResizing: Ref<boolean>
  maxGalleryHeight: ComputedRef<number>
  
  // 方法
  startResize: (e: MouseEvent) => void
  startGalleryResize: (e: MouseEvent) => void
  resetLayout: () => void
  restoreLayoutSettings: () => void
  saveLayoutSettings: () => void
  cleanup: () => void
}

export function useLayoutState(): UseLayoutStateReturn {
  // localStorage 键名
  const LAYOUT_STORAGE_KEY = 'workstation-layout-settings'

  // 面板宽度控制
  const leftPanelWidth = ref<number>(80) // 左侧面板宽度百分比
  const rightPanelWidth = computed(() => 100 - leftPanelWidth.value) // 右侧面板宽度
  const isResizing = ref<boolean>(false) // 是否正在拖拽左右分割线

  // 图片全览区高度控制
  const galleryHeight = ref<number>(20) // 图片全览区高度（视口高度的百分比）
  const isGalleryResizing = ref<boolean>(false) // 是否正在拖拽图片全览区
  const maxGalleryHeight = computed(() => 35) // 最大高度为35vh

  // 从 localStorage 恢复布局设置
  const restoreLayoutSettings = (): void => {
    try {
      const savedSettings = localStorage.getItem(LAYOUT_STORAGE_KEY)
      
      if (savedSettings) {
        const settings: LayoutSettings = JSON.parse(savedSettings)
        
        // 恢复左侧面板宽度（验证范围）
        if (settings.leftPanelWidth && settings.leftPanelWidth >= 70 && settings.leftPanelWidth <= 85) {
          leftPanelWidth.value = settings.leftPanelWidth
        } else {
          leftPanelWidth.value = 80
        }
        
        // 恢复图片全览区高度（验证范围）
        if (settings.galleryHeight && settings.galleryHeight >= 16 && settings.galleryHeight <= 35) {
          galleryHeight.value = settings.galleryHeight
        } else {
          galleryHeight.value = 20
        }
      } else {
        leftPanelWidth.value = 80
        galleryHeight.value = 20
      }
    } catch (error) {
      console.error('恢复布局设置失败:', error)
      // 如果恢复失败，使用默认值
      leftPanelWidth.value = 80
      galleryHeight.value = 20
    }
  }

  // 保存布局设置到 localStorage
  const saveLayoutSettings = (): void => {
    try {
      const settings: LayoutSettings = {
        leftPanelWidth: leftPanelWidth.value,
        galleryHeight: galleryHeight.value,
        timestamp: Date.now()
      }
      
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存布局设置失败:', error)
    }
  }

  // 开始拖拽分割线
  const startResize = (e: MouseEvent): void => {
    isResizing.value = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }

  // 处理拖拽
  const handleResize = (e: MouseEvent): void => {
    if (!isResizing.value) return
    
    const container = document.querySelector('.editor-container')
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    
    // 限制最小和最大宽度
    if (newLeftWidth >= 70 && newLeftWidth <= 85) {
      leftPanelWidth.value = newLeftWidth
    }
  }

  // 停止拖拽
  const stopResize = (): void => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // 保存布局设置
    saveLayoutSettings()
  }

  // 开始拖拽图片全览区
  const startGalleryResize = (e: MouseEvent): void => {
    isGalleryResizing.value = true
    document.addEventListener('mousemove', handleGalleryResize)
    document.addEventListener('mouseup', stopGalleryResize)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }

  // 处理图片全览区拖拽
  const handleGalleryResize = (e: MouseEvent): void => {
    if (!isGalleryResizing.value) return
    
    const leftPanel = document.querySelector('.image-display')
    if (!leftPanel) return
    
    const leftPanelRect = leftPanel.getBoundingClientRect()
    
    // 计算新的高度（从底部向上计算，转换为vh）
    const newHeightPx = leftPanelRect.bottom - e.clientY
    const newHeightVh = (newHeightPx / window.innerHeight) * 100
    
    // 限制最小高度16vh，最大高度为35vh
    const minHeight = 16
    const maxHeight = maxGalleryHeight.value
    
    if (newHeightVh >= minHeight && newHeightVh <= maxHeight) {
      galleryHeight.value = newHeightVh
    }
  }

  // 停止拖拽图片全览区
  const stopGalleryResize = (): void => {
    isGalleryResizing.value = false
    document.removeEventListener('mousemove', handleGalleryResize)
    document.removeEventListener('mouseup', stopGalleryResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // 保存布局设置
    saveLayoutSettings()
  }

  // 重置布局到默认设置
  const resetLayout = (): void => {
    leftPanelWidth.value = 80
    galleryHeight.value = 20
    
    // 清除localStorage中的旧数据并保存新的默认值
    localStorage.removeItem(LAYOUT_STORAGE_KEY)
    saveLayoutSettings()
  }

  // 清理事件监听器
  const cleanup = (): void => {
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.removeEventListener('mousemove', handleGalleryResize)
    document.removeEventListener('mouseup', stopGalleryResize)
  }

  // 组件挂载时恢复布局设置
  onMounted(() => {
    restoreLayoutSettings()
  })

  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    leftPanelWidth,
    rightPanelWidth,
    isResizing,
    galleryHeight,
    isGalleryResizing,
    maxGalleryHeight,
    
    // 方法
    startResize,
    startGalleryResize,
    resetLayout,
    restoreLayoutSettings,
    saveLayoutSettings,
    cleanup
  }
}