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
    resetSettings()
    updateEstimatedSize()
  }
})

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

          <!-- 内容区 -->
          <div class="modal-body">
            <ExportSettingsComponent
              :settings="settings"
              :image-width="imageWidth"
              :image-height="imageHeight"
              :estimated-size="estimatedSize"
              @update:settings="settings = $event"
            />
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
  max-width: 600px;
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
  overflow-y: auto;
  padding: 1.5rem;
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
