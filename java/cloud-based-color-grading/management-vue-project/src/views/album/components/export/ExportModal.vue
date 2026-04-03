<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ExportSettings } from '../../types/export'
import { DEFAULT_EXPORT_SETTINGS } from '../../types/export'
import { useImageExport } from '../../composables/useImageExport'
import ExportSettingsComponent from './ExportSettings.vue'

interface Props {
  visible: boolean
  imageSrc: string
  imageWidth: number
  imageHeight: number
  filename?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'export-complete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { exportImage, estimateFileSize } = useImageExport()

const settings = ref<ExportSettings>({ ...DEFAULT_EXPORT_SETTINGS })
const isExporting = ref(false)
const estimatedSize = ref('计算中...')
const imageWrapperRef = ref<HTMLElement | null>(null)
const previewImageRef = ref<HTMLImageElement | null>(null)
const previewContainerRef = ref<HTMLElement | null>(null)

// 强制更新缩放比例的触发器
const scaleUpdateTrigger = ref(0)

// 基准字体大小（相对于图片宽度的百分比）
const BASE_FONT_SIZE_RATIO = 0.03 // 3% 的图片宽度作为基准字体大小

// 水印位置间距（百分比）
const PADDING_RATIO = 0.02 // 距离边缘 2%

// 计算图片的最大显示尺寸（确保完整显示在容器内）
const maxImageSize = computed(() => {
  if (!previewContainerRef.value || !props.imageWidth || !props.imageHeight) {
    return { maxWidth: '100%', maxHeight: '100%' }
  }

  // 获取容器的可用空间（减去 padding）
  const containerWidth = previewContainerRef.value.clientWidth - 64 // 2rem padding * 2
  const containerHeight = previewContainerRef.value.clientHeight - 64

  // 计算图片的宽高比
  const imageRatio = props.imageWidth / props.imageHeight
  const containerRatio = containerWidth / containerHeight

  let maxWidth: number, maxHeight: number

  if (imageRatio > containerRatio) {
    // 图片更宽，以宽度为基准
    maxWidth = containerWidth
    maxHeight = containerWidth / imageRatio
  } else {
    // 图片更高，以高度为基准
    maxHeight = containerHeight
    maxWidth = containerHeight * imageRatio
  }

  console.log('计算最大图片尺寸:', {
    containerWidth,
    containerHeight,
    imageWidth: props.imageWidth,
    imageHeight: props.imageHeight,
    imageRatio,
    containerRatio,
    maxWidth,
    maxHeight
  })

  return {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`
  }
})

// 计算图片缩放比例（预览图相对于原图的缩放）
const imageScale = computed(() => {
  // 依赖触发器，确保能重新计算
  scaleUpdateTrigger.value

  if (!previewImageRef.value || !props.imageWidth || !props.imageHeight) {
    console.log('缩放比例计算：缺少必要数据', {
      hasRef: !!previewImageRef.value,
      imageWidth: props.imageWidth,
      imageHeight: props.imageHeight
    })
    return 1
  }
  // 获取实际显示的图片尺寸
  const displayWidth = previewImageRef.value.clientWidth
  const displayHeight = previewImageRef.value.clientHeight

  if (displayWidth === 0 || displayHeight === 0) {
    console.log('缩放比例计算：图片尺寸为 0，等待加载')
    return 1
  }

  // 计算缩放比例（取较小的比例，因为是 contain 模式）
  const scaleX = displayWidth / props.imageWidth
  const scaleY = displayHeight / props.imageHeight
  const scale = Math.min(scaleX, scaleY)

  console.log('缩放比例计算完成:', {
    displayWidth,
    displayHeight,
    originalWidth: props.imageWidth,
    originalHeight: props.imageHeight,
    scaleX,
    scaleY,
    finalScale: scale
  })

  return scale
})

// 计算水印样式（按图片缩放比例调整）
const watermarkStyle = computed(() => {
  const watermark = settings.value.watermark

  console.log('计算水印样式:', {
    enabled: watermark.enabled,
    text: watermark.text,
    watermarkScale: watermark.scale,
    imageScale: imageScale.value
  })

  if (!watermark.enabled || !watermark.text) {
    return { display: 'none' }
  }

  const imgScale = imageScale.value

  // 获取预览图的实际显示尺寸
  const displayWidth = previewImageRef.value?.clientWidth || props.imageWidth * imgScale
  const displayHeight = previewImageRef.value?.clientHeight || props.imageHeight * imgScale

  // 计算基准字体大小（基于预览图的宽度）
  const baseFontSize = displayWidth * BASE_FONT_SIZE_RATIO

  // 应用用户设置的缩放比例
  const fontSize = baseFontSize * watermark.scale

  // 间距使用百分比计算实际像素值（相对于预览图尺寸）
  const paddingX = displayWidth * PADDING_RATIO
  const paddingY = displayHeight * PADDING_RATIO

  let position: any = {
    position: 'absolute',
    fontSize: `${fontSize}px`,
    color: watermark.color,
    opacity: watermark.opacity,
    fontWeight: watermark.bold ? 'bold' : 'normal',
    fontFamily: 'Arial, sans-serif',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  }

  // 根据位置设置（使用像素值，相对于图片）
  switch (watermark.position) {
    case 'top-left':
      position.top = `${paddingY}px`
      position.left = `${paddingX}px`
      break
    case 'top-right':
      position.top = `${paddingY}px`
      position.right = `${paddingX}px`
      break
    case 'bottom-left':
      position.bottom = `${paddingY}px`
      position.left = `${paddingX}px`
      break
    case 'bottom-right':
      position.bottom = `${paddingY}px`
      position.right = `${paddingX}px`
      break
    case 'center':
      position.top = '50%'
      position.left = '50%'
      position.transform = 'translate(-50%, -50%)'
      break
  }

  console.log('水印样式计算完成:', {
    fontSize,
    paddingX,
    paddingY,
    displayWidth,
    displayHeight,
    paddingRatio: PADDING_RATIO,
    position
  })

  return position
})

// 实时计算文件大小
const updateEstimatedSize = async () => {
  if (!props.imageSrc || !props.visible) {
    console.log('跳过文件大小计算:', { hasImageSrc: !!props.imageSrc, visible: props.visible })
    return
  }
  console.log('开始更新文件大小估算')
  estimatedSize.value = '计算中...'
  try {
    const size = await estimateFileSize(props.imageSrc, props.imageWidth, props.imageHeight, settings.value)
    estimatedSize.value = size
    console.log('文件大小估算完成:', size)
  } catch (error) {
    console.error('文件大小估算失败:', error)
    estimatedSize.value = '未知'
  }
}

// 监听设置变化，重新计算文件大小（防抖）
let updateTimer: ReturnType<typeof setTimeout> | null = null
watch([() => settings.value.format, () => settings.value.quality, () => settings.value.scale, () => settings.value.watermark.enabled, () => settings.value.watermark.text], () => {
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    updateEstimatedSize()
  }, 500)
}, { deep: true })

// 监听弹窗显示，初始化计算
watch(() => props.visible, (newVal) => {
  if (newVal) {
    console.log('弹窗显示，初始化设置')
    resetSettings()
    updateEstimatedSize()
    // 延迟触发缩放计算，确保 DOM 已渲染
    setTimeout(() => {
      console.log('触发缩放比例重新计算')
      scaleUpdateTrigger.value++
    }, 100)
  }
})

// 监听图片源变化
watch(() => props.imageSrc, () => {
  console.log('图片源变化')
  // 延迟触发，等待图片加载
  setTimeout(() => {
    console.log('触发缩放比例重新计算')
    scaleUpdateTrigger.value++
  }, 100)
})

// 监听水印设置变化
watch(() => settings.value.watermark, () => {
  console.log('水印设置变化')
}, { deep: true })

// 重置设置
const resetSettings = () => {
  settings.value = { ...DEFAULT_EXPORT_SETTINGS }
}

// 执行导出
const handleExport = async () => {
  if (isExporting.value) return

  try {
    isExporting.value = true
    await exportImage(props.imageSrc, settings.value, props.filename || 'exported-image', settings.value.dpi)
    emit('export-complete')
    emit('close')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  if (!isExporting.value) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="export-modal-overlay" @click.self="handleClose">
        <div class="export-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3>导出图片</h3>
            <button class="close-btn" @click="handleClose" :disabled="isExporting">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- 左右两栏内容区 -->
          <div class="modal-body">
            <!-- 左侧：图片预览区 -->
            <div class="preview-section">
              <div class="preview-container" ref="previewContainerRef">
                <div class="image-wrapper" ref="imageWrapperRef">
                  <img
                    ref="previewImageRef"
                    :src="imageSrc"
                    :alt="filename"
                    class="preview-image"
                    :style="{ maxWidth: maxImageSize.maxWidth, maxHeight: maxImageSize.maxHeight }"
                    @load="scaleUpdateTrigger++"
                  />
                  <!-- 水印图层（相对于图片定位，按比例缩放） -->
                  <div
                    v-if="settings.watermark.enabled && settings.watermark.text"
                    class="watermark-layer"
                    :style="watermarkStyle"
                  >
                    {{ settings.watermark.text }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：参数调节区 -->
            <div class="settings-section">
              <ExportSettingsComponent
                :settings="settings"
                :image-width="imageWidth"
                :image-height="imageHeight"
                :estimated-size="estimatedSize"
                @update:settings="settings = $event"
              />
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="footer-btn reset-btn" @click="resetSettings" :disabled="isExporting">
              重置
            </button>
            <div class="footer-actions">
              <button class="footer-btn cancel-btn" @click="handleClose" :disabled="isExporting">
                取消
              </button>
              <button class="footer-btn export-btn" @click="handleExport" :disabled="isExporting">
                {{ isExporting ? '导出中...' : '确认导出' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.export-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 2rem;
}

.export-modal {
  width: 100%;
  max-width: 1200px;
  background: #1c1e22;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e4e9;
}

.close-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e9;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow: hidden;
  height: 600px;
  max-height: calc(90vh - 180px);
}

/* 左侧预览区 */
.preview-section {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.preview-container {
  flex: 1;
  background: #16181c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.image-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.preview-image {
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  display: block;
  vertical-align: top;
}

.watermark-layer {
  position: absolute;
  z-index: 10;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 右侧设置区 */
.settings-section {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* 滚动条样式 */
.settings-section::-webkit-scrollbar {
  width: 6px;
}

.settings-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.settings-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.settings-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.footer-btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn {
  background: transparent;
  color: #9ca3af;
}

.reset-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: #e2e4e9;
}

.cancel-btn {
  background: #24272d;
  color: #e2e4e9;
}

.cancel-btn:hover:not(:disabled) {
  background: #2a2d35;
  border-color: rgba(255, 255, 255, 0.2);
}

.export-btn {
  background: #5b6af0;
  border-color: #5b6af0;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: #4a59df;
  border-color: #4a59df;
  transform: translateY(-1px);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .modal-body {
    grid-template-columns: 1fr;
  }

  .preview-section {
    max-height: 300px;
  }

  .settings-section {
    max-height: 400px;
  }
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .export-modal,
.modal-leave-active .export-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .export-modal,
.modal-leave-to .export-modal {
  transform: scale(0.95) translateY(20px);
}
</style>
