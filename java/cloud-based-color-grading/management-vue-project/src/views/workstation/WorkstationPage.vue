<template>
  <div class="editor-container">
    <!-- 顶部导航栏 -->
    <TopNavbar />
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧图片显示区 -->
      <ImageDisplay
        :leftPanelWidth="leftPanelWidth"
        :images="uploadedImages"
        :selectedImageId="selectedImageId"
        :imageSrc="imageSrc"
        :processedSrc="processedSrc"
        :showUploadTips="!imageSrc"
        :galleryHeight="galleryHeight"
        :maskActive="maskLayers.length > 0"
        :maskActiveLayer="maskActiveLayer"
        :maskShowOverlay="!!maskShowOverlay && !adjSliderDragging && activePanelTab === 'mask' && !!maskActiveLayerId && (maskActiveLayer?.enabled ?? false)"
        :cropActive="activePanelTab === 'crop' && cropToolActive"
        :cropRatio="cropRatio"
        :cropInitialRect="currentCropState.rect"
        :transformPending="transformPending"
        :gridSettings="gridSettings"
        :applyGridPreset="applyGridPreset"
        @action:selectImage="handleSelectImage"
        @action:uploadImage="handleImageUpload"
        @layout:resetLayout="resetLayout"
        @layout:updateGalleryHeight="updateGalleryHeight"
        @resize:start="handleGalleryResizeStart"
        @resize:end="handleGalleryResizeEnd"
        @mask:commit="handleMaskCommit"
        @mask:updateLayer="handleMaskUpdateLayer"
        @crop:commit="handleCropCommit"
        @crop:cancel="() => { cropToolActive = false; restoreCropPreview() }"
        @transform:confirm="handleTransformConfirm"
        @transform:cancel="handleTransformCancel"
        ref="imageDisplayRef"
      />

      <!-- 可拖拽的分割线 -->
      <PanelResizer
        :currentWidth="leftPanelWidth"
        :isResizing="isResizing"
        @layout:updatePanelWidth="updatePanelWidth"
        @resize:start="handlePanelResizeStart"
        @resize:end="handlePanelResizeEnd"
      />

      <!-- 右侧调色区 -->
      <AdjustPanel
        :rightPanelWidth="rightPanelWidth"
        :adjustments="adjustments"
        :hslAdjustments="hslAdjustments"
        :canSave="!!imageSrc"
        :canReset="!!imageSrc"
        :imageSrc="imageSrc"
        :processedSrc="processedSrc"
        :maskLayers="maskLayers"
        :maskActiveLayerId="maskActiveLayerId"
        :maskActiveLayer="maskActiveLayer"
        :maskShowOverlay="!!maskShowOverlay"
        :gridSettings="gridSettings"
        @update:adjustments="setAdjustments"
        @update:hslAdjustments="(v) => Object.assign(hslAdjustments, v)"
        @action:uploadImage="handleImageUpload"
        @action:save="handleSaveImage"
        @action:reset="() => { resetAdjustments(); setBasicAdjustments({ brightness:0, contrast:0, saturation:0, vibrance:0, hue:0, temperature:0, clarity:0 }); resetHSL(); resetMask(); setMaskLayers([]) }"
        @mask:toggleOverlay="handleMaskToggleOverlay"
        @mask:addLayer="handleMaskAddLayer"
        @mask:removeLayer="handleMaskRemoveLayer"
        @mask:selectLayer="handleMaskSelectLayer"
        @mask:toggleLayerEnabled="handleMaskToggleLayerEnabled"
        @mask:updateLayer="handleMaskUpdateLayer"
        @mask:invert="handleMaskInvert"
        @mask:clear="handleMaskClear"
        @mask:updateLayerAdj="handleMaskUpdateLayerAdj"
        @mask:adjSliderStart="adjSliderDragging = true"
        @mask:adjSliderEnd="adjSliderDragging = false"
        @tab:change="(t) => { activePanelTab = t; if (t !== 'crop') { cropToolActive = false; if (transformPending) { handleTransformCancel() } else { restoreCropPreview() } } if (t === 'crop') prewarmTransformCache() }"
        @mask:clearSelection="maskSetActiveLayer('')"
        @crop:ratio="(r) => { cropRatio = r; cropToolActive = true; handleCropRatioChange() }"
        @crop:rotate="(d) => { handleCropRotate(d) }"
        @crop:flip="(dir) => { handleCropFlip(dir) }"
        @crop:restore="handleCropRestore"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';;
import type { ImageItem } from './component-interfaces'
import type { CropState } from './types/cropTypes'
import { DEFAULT_CROP_STATE } from './types/cropTypes'
import { imageDB } from './utils/imageDB'
import TopNavbar from './components/TopNavbar.vue';
import ImageDisplay from './components/ImageDisplay.vue';
import PanelResizer from './components/PanelResizer.vue';
import AdjustPanel from './components/AdjustPanel.vue';

import { useLayoutState } from './composables/useLayoutState'
import { useImageState } from './composables/useImageState'
import { useAdjustmentState } from './composables/useAdjustmentState'
import { useHSLState } from './composables/useHSLState'
import { useImageStorage } from './composables/useImageStorage'
import { useMaskState } from './composables/useMaskState'
import { useGridState } from './composables/useGridState'

// 使用布局状态管理
const {
  leftPanelWidth,
  rightPanelWidth,
  isResizing,
  galleryHeight,
  isGalleryResizing,
  startResize,
  startGalleryResize,
  resetLayout,
  saveLayoutSettings
} = useLayoutState();

// 使用图片状态管理
const {
  imageSrc,
  uploadedImages,
  selectedImageId,
  handleImageUpload,
  selectImage,
} = useImageState();

// 使用调整状态管理
const {
  adjustments,
  imageFilter,
  resetAdjustments,
  setAdjustments,
} = useAdjustmentState();

// HSL 颜色范围调节 + 基础调色像素链
const {
  hslAdjustments,
  processedSrc,
  resetHSL,
  setSourceImage,
  setBasicAdjustments,
  setMaskCanvas,
  setMaskLayers,
  updateMaskLayerAdj,
  exportProcessed,
} = useHSLState()

// 蒙版状态
const {
  layers: maskLayers,
  activeLayerId: maskActiveLayerId,
  activeLayer: maskActiveLayer,
  compositeCanvas: maskCompositeCanvas,
  showOverlay: maskShowOverlay,
  maskActive,
  addLayer: maskAddLayer,
  removeLayer: maskRemoveLayer,
  setActiveLayer: maskSetActiveLayer,
  toggleLayerEnabled: maskToggleLayerEnabled,
  updateLayer: maskUpdateLayer,
  generateLayerMask,
  initSize: maskInitSize,
  invertActiveLayer: maskInvertActive,
  clearActiveLayer: maskClearActive,
  toggleOverlay: toggleMaskOverlay,
  getSerializable: getMaskSerializable,
  loadFromSerializable: loadMaskFromSerializable,
  resetMask,
} = useMaskState()

const { settings: gridSettings, applyPreset: applyGridPreset } = useGridState()

// 调色参数持久化
const { saveAdjustments, loadAdjustments, saveImageToDB, saveCropData, loadCropData, loadOriginalSrc } = useImageStorage()

// 防抖保存 timer
let saveTimer: ReturnType<typeof setTimeout> | null = null
// 加载参数期间不触发保存
let isLoadingAdjustments = false

// 序列化当前所有调色参数为 JSON（含蒙版）
const serializeAdjustments = () => {
  return JSON.stringify({
    adjustments: { ...adjustments },
    hslAdjustments: JSON.parse(JSON.stringify(hslAdjustments)),
    mask: getMaskSerializable(),
  })
}

// 防抖自动保存（500ms 无操作后写入 DB）
const scheduleSave = () => {
  if (!selectedImageId.value || isLoadingAdjustments) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveAdjustments(selectedImageId.value!, serializeAdjustments())
  }, 500)
}

// 从 DB 加载并应用调色参数
const applyStoredAdjustments = async (imageId: number) => {
  isLoadingAdjustments = true
  try {
    const json = await loadAdjustments(imageId)
    if (!json) {
      resetAdjustments(); resetHSL(); resetMask()
      setMaskLayers([])
      return
    }
    const data = JSON.parse(json)
    if (data.adjustments) setAdjustments(data.adjustments)
    if (data.hslAdjustments) Object.assign(hslAdjustments, data.hslAdjustments)
    // 恢复蒙版
    if (data.mask && Array.isArray(data.mask) && data.mask.length > 0 && imageSrc.value) {
      const img = new Image()
      img.onload = () => {
        maskInitSize(img.naturalWidth, img.naturalHeight)
        loadMaskFromSerializable(data.mask)
        setMaskLayers([...maskLayers])
      }
      img.src = imageSrc.value
    } else {
      resetMask()
      setMaskLayers([])
    }
  } catch {
    resetAdjustments(); resetHSL(); resetMask()
    setMaskLayers([])
  } finally {
    isLoadingAdjustments = false
  }
}

// 监听调色参数变化 → 自动保存
watch(adjustments, scheduleSave, { deep: true })
watch(hslAdjustments, scheduleSave, { deep: true })

// 裁切预览恢复标志位（需在 watch 之前声明，避免 TDZ 错误）
let isCropPreviewRestoring = false

// 恢复裁切预览：只恢复 imageSrc，跳过调色链重跑和蒙版重置，避免闪烁
const restoreCropPreview = () => {
  if (cropPreviewBackup === null) return
  isCropPreviewRestoring = true
  imageSrc.value = cropPreviewBackup
  cropPreviewBackup = null
  // 微任务结束后关闭标志位，再触发一次处理链（此时 imageSrc 已稳定）
  Promise.resolve().then(() => {
    isCropPreviewRestoring = false
    setSourceImage(imageSrc.value)  // 恢复完成后补一次处理链，不触发蒙版重置
  })
}

// 当选中图片变化时，通知 HSL 处理器
watch(imageSrc, (src) => {
  if (isCropPreviewRestoring) return  // 裁切预览恢复时跳过
  setSourceImage(src)
}, { immediate: true })

// adjustments 变化时同步给处理链（基础调色像素级处理）
watch(adjustments, (adj) => {
  setBasicAdjustments({ ...adj })
}, { deep: true })

// 图片切换时重置蒙版（裁切预览恢复时跳过）
watch(imageSrc, () => {
  if (isCropPreviewRestoring) return
  resetMask()
  setMaskLayers([])
})

// 统一触发蒙版处理链更新
const syncMaskLayers = () => {
  setMaskLayers([...maskLayers])
}

// 蒙版 commit（拖拽结束，重新生成蒙版并触发处理链）
const handleMaskCommit = () => {
  if (maskActiveLayer.value) generateLayerMask(maskActiveLayer.value)
  syncMaskLayers()
  scheduleSave()
}

// 蒙版参数更新（来自 MaskCanvas 拖拽或 MaskControls 控件）
const handleMaskUpdateLayer = (newLayer: import('./composables/useMaskState').MaskLayer) => {
  maskUpdateLayer(newLayer)
  syncMaskLayers()
  scheduleSave()
}

// 蒙版工具栏事件
const handleMaskAddLayer = (type: import('./composables/useMaskState').MaskType) => {
  if (maskLayers.length === 0 && imageSrc.value) {
    const img = new Image()
    img.onload = () => { maskInitSize(img.naturalWidth, img.naturalHeight); maskAddLayer(type); syncMaskLayers() }
    img.src = imageSrc.value
  } else {
    maskAddLayer(type)
    syncMaskLayers()
  }
  scheduleSave()
}
const handleMaskRemoveLayer = (id: string) => { maskRemoveLayer(id); syncMaskLayers(); scheduleSave() }
const handleMaskSelectLayer = (id: string) => { maskSetActiveLayer(id) }
const handleMaskToggleLayerEnabled = (id: string) => { maskToggleLayerEnabled(id); syncMaskLayers(); scheduleSave() }
const handleMaskToggleOverlay = () => { toggleMaskOverlay() }
const handleMaskInvert = () => { maskInvertActive(); syncMaskLayers(); scheduleSave() }
const handleMaskClear  = () => { maskClearActive();  syncMaskLayers(); scheduleSave() }

// 蒙版层独立调色参数更新
const handleMaskUpdateLayerAdj = (payload: { id: string; adjustments: import('./component-interfaces').AdjustmentValues }) => {
  const layer = maskLayers.find(l => l.id === payload.id)
  if (!layer) return
  Object.assign(layer.adjustments, payload.adjustments)
  // 直接更新处理链中的参数，不重传 canvas，避免 rAF 延迟导致蒙版闪烁
  updateMaskLayerAdj(payload.id, payload.adjustments)
  scheduleSave()
}

// selectedImageId 变化时（含页面刷新后 onMounted 恢复）加载调色参数和裁切状态
watch(selectedImageId, async (id) => {
  if (id == null) return
  currentCropState.value = { ...DEFAULT_CROP_STATE }
  const cropData = await loadCropData(id)
  if (cropData?.cropState) currentCropState.value = cropData.cropState
  applyStoredAdjustments(id)
}, { immediate: true })

// imageSrc 有值时（图片已加载到内存）立即后台预热变换缓存
// 用 requestIdleCallback 在浏览器空闲时执行，不影响首屏渲染
watch(imageSrc, (src) => {
  if (!src || selectedImageId.value == null) return
  const doPrewarm = () => {
    const item = uploadedImages.value.find(i => i.id === selectedImageId.value)
    const originalSrc = item?.originalSrc ?? src
    const { rotate, flipH, flipV } = currentCropState.value
    applyTransforms(originalSrc, rotate, flipH, flipV)
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(doPrewarm, { timeout: 3000 })
  } else {
    setTimeout(doPrewarm, 800)
  }
})

// 图片显示组件引用（供模板 ref 使用）
const imageDisplayRef = ref(null)
// 局部调色滑块拖动中：临时隐藏蒙版叠加层
const adjSliderDragging = ref(false)
// 当前激活的面板 tab
const activePanelTab = ref<'basic' | 'crop' | 'mask'>('basic')

// ── 裁切状态 ──────────────────────────────────────────────────
const cropRatio = ref<number | null>(null)
const cropToolActive = ref(false)
const currentCropState = ref<CropState>({ ...DEFAULT_CROP_STATE })
// 裁切预览前保存的 imageSrc，取消时恢复
let cropPreviewBackup: string | null = null
// 旋转/翻转待确认标志（true 时显示确认/取消操作栏）
const transformPending = ref(false)

/**
 * 从原始 src 按 rotate → flipH → flipV 顺序重建图片（不含裁切）
 * 内置缓存：相同参数直接返回缓存结果，避免重复 canvas 变换
 */
const transformCache = new Map<string, string>()

const applyTransforms = (src: string, rotate: number, flipH: boolean, flipV: boolean): Promise<string> => {
  // 无变换直接返回原图
  if (rotate === 0 && !flipH && !flipV) return Promise.resolve(src)

  const cacheKey = `${src.slice(-32)}_${rotate}_${flipH}_${flipV}`
  if (transformCache.has(cacheKey)) return Promise.resolve(transformCache.get(cacheKey)!)

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      let c = document.createElement('canvas')
      if (rotate !== 0) {
        const rad = (rotate * Math.PI) / 180
        const sw = rotate % 180 !== 0 ? img.naturalHeight : img.naturalWidth
        const sh = rotate % 180 !== 0 ? img.naturalWidth  : img.naturalHeight
        c.width = sw; c.height = sh
        const ctx = c.getContext('2d')!
        ctx.translate(sw / 2, sh / 2); ctx.rotate(rad)
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      } else {
        c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext('2d')!.drawImage(img, 0, 0)
      }
      if (flipH || flipV) {
        const c2 = document.createElement('canvas')
        c2.width = c.width; c2.height = c.height
        const ctx2 = c2.getContext('2d')!
        if (flipH) { ctx2.translate(c.width, 0); ctx2.scale(-1, 1) }
        if (flipV) { ctx2.translate(0, c.height); ctx2.scale(1, -1) }
        ctx2.drawImage(c, 0, 0)
        c = c2
      }
      const result = c.toDataURL('image/png')
      transformCache.set(cacheKey, result)
      resolve(result)
    }
    img.src = src
  })
}

/**
 * 触发裁切比例切换时：
 * 1. 从原图 + cropState 重建旋转/翻转后的图（不含裁切）
 * 2. 更新 imageSrc，等 canvas 重绘完成后重置缩放到 100%
 * 3. CropTool 用上次的 rect 初始化裁切框
 */
/**
 * 进入裁切 tab 时预热变换缓存：
 * 在后台异步执行 applyTransforms，等用户点比例时缓存已就绪
 */
const prewarmTransformCache = () => {
  if (selectedImageId.value == null) return
  const item = uploadedImages.value.find(i => i.id === selectedImageId.value)
  const originalSrc = item?.originalSrc
  if (!originalSrc) return
  const { rotate, flipH, flipV } = currentCropState.value

  // 无变换时不需要重建
  if (rotate === 0 && !flipH && !flipV) return

  const cacheKey = `${originalSrc.slice(-32)}_${rotate}_${flipH}_${flipV}`

  if (transformCache.has(cacheKey)) {
    // 缓存命中：备份并同步切换，零等待
    if (cropPreviewBackup === null) cropPreviewBackup = imageSrc.value
    const cached = transformCache.get(cacheKey)!
    if (imageSrc.value !== cached) {
      imageSrc.value = cached
      setSourceImage(cached)
    }
  } else {
    // 缓存未命中：后台计算，完成后静默替换
    applyTransforms(originalSrc, rotate, flipH, flipV).then(rebuiltSrc => {
      if (activePanelTab.value === 'crop') {
        if (cropPreviewBackup === null) cropPreviewBackup = imageSrc.value
        if (imageSrc.value !== rebuiltSrc) {
          imageSrc.value = rebuiltSrc
          setSourceImage(rebuiltSrc)
        }
      }
    })
  }
}

const handleCropRatioChange = async () => {
  if (selectedImageId.value == null) return

  // 备份当前 imageSrc，取消时恢复（只备份一次）
  if (cropPreviewBackup === null) {
    cropPreviewBackup = imageSrc.value
  }

  const item = uploadedImages.value.find(i => i.id === selectedImageId.value)
  const originalSrc = item?.originalSrc ?? await loadOriginalSrc(selectedImageId.value)
  if (!originalSrc) return

  const { rotate, flipH, flipV } = currentCropState.value
  // applyTransforms 有缓存，prewarmTransformCache 已提前填充，通常同步返回
  const rebuiltSrc = await applyTransforms(originalSrc, rotate, flipH, flipV)

  // 只在图片真正变化时才更新，避免重复触发处理链
  if (imageSrc.value !== rebuiltSrc) {
    imageSrc.value = rebuiltSrc
    setSourceImage(rebuiltSrc)
  }

  await nextTick()
  const previewRef = (imageDisplayRef.value as any)?.imagePreviewRef
  previewRef?.onceDrawComplete(() => {
    previewRef.resetTransform()
  })
}

// 旋转（只更新内存预览，不写 IndexedDB）
const handleCropRotate = (deg: number) => {
  if (!imageSrc.value) return
  // 进入裁切模式备份（只备份一次）
  if (cropPreviewBackup === null) cropPreviewBackup = imageSrc.value
  const img = new Image()
  img.onload = () => {
    const rad = (deg * Math.PI) / 180
    const sw = Math.abs(deg) === 90 ? img.naturalHeight : img.naturalWidth
    const sh = Math.abs(deg) === 90 ? img.naturalWidth  : img.naturalHeight
    const c = document.createElement('canvas')
    c.width = sw; c.height = sh
    const ctx = c.getContext('2d')!
    ctx.translate(sw / 2, sh / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    currentCropState.value.rotate = ((currentCropState.value.rotate + deg) % 360 + 360) % 360
    imageSrc.value = c.toDataURL('image/png')
    setSourceImage(imageSrc.value)
    transformPending.value = true
  }
  img.src = imageSrc.value
}

// 翻转（只更新内存预览，不写 IndexedDB）
const handleCropFlip = (dir: 'h' | 'v') => {
  if (!imageSrc.value) return
  if (cropPreviewBackup === null) cropPreviewBackup = imageSrc.value
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const ctx = c.getContext('2d')!
    if (dir === 'h') { ctx.translate(c.width, 0); ctx.scale(-1, 1); currentCropState.value.flipH = !currentCropState.value.flipH }
    else             { ctx.translate(0, c.height); ctx.scale(1, -1); currentCropState.value.flipV = !currentCropState.value.flipV }
    ctx.drawImage(img, 0, 0)
    imageSrc.value = c.toDataURL('image/png')
    setSourceImage(imageSrc.value)
    transformPending.value = true
  }
  img.src = imageSrc.value
}

// 确认旋转/翻转：一次性写入 IndexedDB，清除旧裁切坐标（旋转后坐标失效）
const handleTransformConfirm = () => {
  if (!imageSrc.value) return
  transformPending.value = false
  cropPreviewBackup = null
  // 旋转/翻转改变了图片内容，旧的裁切坐标已失效，清除
  currentCropState.value.rect = null
  applyEditedSrc(imageSrc.value)
}

// 取消旋转/翻转：恢复到进入裁切前的图，回滚 currentCropState
const handleTransformCancel = async () => {
  transformPending.value = false
  if (selectedImageId.value != null) {
    const cropData = await loadCropData(selectedImageId.value)
    currentCropState.value = cropData?.cropState ?? { ...DEFAULT_CROP_STATE }
  }
  restoreCropPreview()
}

// 裁切提交
const handleCropCommit = (rect: { x: number; y: number; w: number; h: number }) => {
  if (!imageSrc.value || rect.w <= 0 || rect.h <= 0) return
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = rect.w; c.height = rect.h
    c.getContext('2d')!.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
    currentCropState.value.rect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
    cropPreviewBackup = null  // 提交成功，清除备份
    applyEditedSrc(c.toDataURL('image/png'))
    cropToolActive.value = false
  }
  img.src = imageSrc.value
}

/**
 * 应用编辑后的图片：
 * - 更新内存中的 imageSrc（用于预览和调色链）
 * - 将 editedSrc + cropState 写入 IndexedDB（不覆盖原图）
 * - 蒙版在有裁切时清除（坐标失效）
 */
const applyEditedSrc = async (dataUrl: string) => {
  const hadMask = maskLayers.length > 0

  imageSrc.value = dataUrl
  setSourceImage(dataUrl)

  // 有蒙版时裁切会导致坐标失效，必须清除
  if (hadMask) {
    resetMask()
    setMaskLayers([])
  }

  if (selectedImageId.value != null) {
    const item = uploadedImages.value.find(i => i.id === selectedImageId.value)
    if (item) {
      // 只更新内存中的展示 src，不改 originalFile（原图保留）
      item.src = dataUrl
    }
    // 持久化：只写 editedSrc + cropState，原图 blob/src 不动
    try {
      await saveCropData(selectedImageId.value, dataUrl, currentCropState.value)
    } catch (e) {
      console.error('裁切数据持久化失败:', e)
    }
  }
}

// 复原原图：从 IndexedDB 读取原始 src，清除裁切数据
const handleCropRestore = async () => {
  if (selectedImageId.value == null) return

  // 优先从内存缓存读取原始图
  const item = uploadedImages.value.find(i => i.id === selectedImageId.value)
  const originalSrc = item?.originalSrc ?? await loadOriginalSrc(selectedImageId.value)
  if (!originalSrc) return

  imageSrc.value = originalSrc
  setSourceImage(originalSrc)

  // 更新内存图库展示 src
  if (item) item.src = originalSrc

  // 清除 IndexedDB 中的裁切数据（删除字段，不写空字符串）
  try {
    await imageDB.clearCropData(selectedImageId.value)
  } catch (e) {
    console.error('清除裁切数据失败:', e)
  }

  // 重置裁切状态
  currentCropState.value = { ...DEFAULT_CROP_STATE }
  cropPreviewBackup = null
  transformPending.value = false
  cropToolActive.value = false

  // 蒙版坐标基于裁切后图片，复原后失效，清除
  resetMask()
  setMaskLayers([])
}
const handlePanelResizeStart = () => {
  isResizing.value = true;
};

// 处理面板拖拽结束
const handlePanelResizeEnd = () => {
  isResizing.value = false;
  saveLayoutSettings();
};

// 更新面板宽度
const updatePanelWidth = (width: number) => {
  leftPanelWidth.value = width;
};

// 处理图片全览区拖拽开始
const handleGalleryResizeStart = () => {
  isGalleryResizing.value = true;
};

// 处理图片全览区拖拽结束
const handleGalleryResizeEnd = () => {
  isGalleryResizing.value = false;
  saveLayoutSettings();
};

// 更新图片全览区高度
const updateGalleryHeight = (height: number) => {
  galleryHeight.value = height;
};

// 处理图片选择
const handleSelectImage = async (image: ImageItem) => {
  selectImage(image)
  cropPreviewBackup = null  // 切图时清除裁切预览备份
  currentCropState.value = { ...DEFAULT_CROP_STATE }
  const cropData = await loadCropData(image.id)
  if (cropData?.cropState) {
    currentCropState.value = cropData.cropState
  }
  await applyStoredAdjustments(image.id)
  // 后台预热变换缓存
  if (image.originalSrc) {
    const { rotate, flipH, flipV } = currentCropState.value
    applyTransforms(image.originalSrc, rotate, flipH, flipV)
  }
}

// 暴露方法供测试使用
const selectImageForTest = (image: ImageItem) => {
  handleSelectImage(image)
}

// 处理保存图片（format: 'png' | 'jpeg'）
const handleSaveImage = async (format: 'png' | 'jpeg' = 'png') => {
  if (!imageSrc.value) {
    alert('请先上传图片！')
    return
  }

  // 完整处理链（基础调色 + HSL）已在 exportProcessed 内部完成，直接下载
  const dataUrl = await exportProcessed(format, format === 'jpeg' ? 0.95 : 1)

  const link = document.createElement('a')
  link.download = `edited-${Date.now()}.${format}`
  link.href = dataUrl
  link.click()
}

// 暴露属性和方法供测试使用
defineExpose({
  // 状态
  leftPanelWidth,
  rightPanelWidth,
  isResizing,
  galleryHeight,
  isGalleryResizing,
  imageSrc,
  uploadedImages,
  selectedImageId,
  adjustments,
  imageFilter,
  imageDisplayRef,
  
  // 方法
  selectImage: selectImageForTest,
  resetLayout,
  resetAdjustments,
  handleImageUpload,
  handleSaveImage,
  saveImage: handleSaveImage, // 别名供测试使用
  updatePanelWidth,
  updateGalleryHeight,
  handlePanelResizeStart,
  handlePanelResizeEnd,
  handleGalleryResizeStart,
  handleGalleryResizeEnd,
  
  // 布局相关方法（从 useLayoutState 暴露）
  startResize,
  startGalleryResize,
  stopResize: handlePanelResizeEnd, // 映射到结束方法
  stopGalleryResize: handleGalleryResizeEnd, // 映射到结束方法
  
  // 直接暴露 composable 方法供测试
  setAdjustments
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', sans-serif;
}

.editor-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>