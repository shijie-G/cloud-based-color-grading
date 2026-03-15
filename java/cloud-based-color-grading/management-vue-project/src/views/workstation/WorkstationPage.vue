<template>
  <div class="editor-container">
    <!-- 左侧图片显示区 -->
    <div class="image-display" :style="{ width: leftPanelWidth + '%' }">
      <!-- 上方图片预览区 -->
      <div class="image-preview-area" :style="{ height: `${100 - galleryHeight}vh` }">
        <div class="image-wrapper">
          <img
            ref="previewImage"
            :src="imageSrc"
            alt="预览图片"
            :style="{ display: imageSrc ? 'block' : 'none', filter: imageFilter }"
          />
          <div class="upload-tips" v-if="!imageSrc">点击右侧上传按钮选择图片开始修图</div>
        </div>
      </div>
      
      <!-- 图片全览区的上边框拖拽线 -->
      <div 
        class="gallery-resizer"
        @mousedown="startGalleryResize"
        :class="{ 'resizing': isGalleryResizing }"
      >
        <div class="gallery-resizer-handle">
          <div class="gallery-resizer-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
      
      <!-- 下方图片全览区 -->
      <div class="image-gallery" :style="{ height: galleryHeight + 'vh' }">
        <div class="gallery-header">
          <h3>图片全览</h3>
          <div class="gallery-controls">
            <span class="image-count">{{ uploadedImages.length }} 张图片</span>
            <button class="reset-layout-btn" @click="resetLayout" title="重置布局">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="gallery-content">
          <div class="image-grid">
            <div 
              v-for="(image, index) in uploadedImages" 
              :key="image.id"
              class="gallery-item"
              :class="{ active: selectedImageId === image.id }"
              @click="selectImage(image)"
            >
              <img :src="image.src" :alt="image.name" />
              <div class="image-overlay">
                <span class="image-name">{{ image.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可拖拽的分割线 -->
    <div 
      class="resizer"
      @mousedown="startResize"
      :class="{ 'resizing': isResizing }"
    >
      <div class="resizer-handle">
        <div class="resizer-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>

    <!-- 右侧调色区 -->
    <div class="adjust-panel" :style="{ width: rightPanelWidth + '%' }">
      <h2 class="panel-title">图片调整</h2>

      <!-- 上传区域 -->
      <div class="upload-section">
        <button id="upload-btn" @click="triggerFileInput">上传图片</button>
        <input
          type="file"
          id="image-input"
          accept="image/*"
          @change="handleImageUpload"
          style="display: none"
        />
        <p style="font-size: 12px; color: #999;">支持JPG、PNG、WEBP等格式</p>
      </div>

      <!-- 调色参数区 -->
      <div class="adjust-items">
        <!-- 亮度 -->
        <div class="adjust-item">
          <label class="adjust-label">亮度</label>
          <input
            type="range"
            class="adjust-slider"
            min="0"
            max="200"
            v-model="adjustments.brightness"
            @input="updateImageFilter"
          />
          <span class="adjust-value">{{ adjustments.brightness }}%</span>
        </div>

        <!-- 对比度 -->
        <div class="adjust-item">
          <label class="adjust-label">对比度</label>
          <input
            type="range"
            class="adjust-slider"
            min="0"
            max="200"
            v-model="adjustments.contrast"
            @input="updateImageFilter"
          />
          <span class="adjust-value">{{ adjustments.contrast }}%</span>
        </div>

        <!-- 饱和度 -->
        <div class="adjust-item">
          <label class="adjust-label">饱和度</label>
          <input
            type="range"
            class="adjust-slider"
            min="0"
            max="200"
            v-model="adjustments.saturation"
            @input="updateImageFilter"
          />
          <span class="adjust-value">{{ adjustments.saturation }}%</span>
        </div>

        <!-- 色温 -->
        <div class="adjust-item">
          <label class="adjust-label">色温</label>
          <input
            type="range"
            class="adjust-slider"
            min="0"
            max="200"
            v-model="adjustments.temperature"
            @input="updateImageFilter"
          />
          <span class="adjust-value">{{ adjustments.temperature }}%</span>
        </div>

        <!-- 曝光度 -->
        <div class="adjust-item">
          <label class="adjust-label">曝光度</label>
          <input
            type="range"
            class="adjust-slider"
            min="0"
            max="200"
            v-model="adjustments.exposure"
            @input="updateImageFilter"
          />
          <span class="adjust-value">{{ adjustments.exposure }}%</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button id="reset-btn" @click="resetAdjustments">重置参数</button>
        <button id="save-btn" @click="saveImage">保存图片</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

// 图片源
const imageSrc = ref('');
// 图片DOM引用
const previewImage = ref(null);
// 已上传的图片列表
const uploadedImages = ref([]);
// 当前选中的图片ID
const selectedImageId = ref(null);

// 面板宽度控制
const leftPanelWidth = ref(80); // 左侧面板宽度百分比
const rightPanelWidth = computed(() => 100 - leftPanelWidth.value); // 右侧面板宽度
const isResizing = ref(false); // 是否正在拖拽左右分割线

// 图片全览区高度控制
const galleryHeight = ref(15); // 图片全览区高度（视口高度的百分比）
const isGalleryResizing = ref(false); // 是否正在拖拽图片全览区
const maxGalleryHeight = computed(() => 50); // 最大高度为50vh

// localStorage 键名
const LAYOUT_STORAGE_KEY = 'workstation-layout-settings';

// 从 localStorage 恢复布局设置
const restoreLayoutSettings = () => {
  try {
    const savedSettings = localStorage.getItem(LAYOUT_STORAGE_KEY);
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // 恢复左侧面板宽度（验证范围）
      if (settings.leftPanelWidth && settings.leftPanelWidth >= 70 && settings.leftPanelWidth <= 85) {
        leftPanelWidth.value = settings.leftPanelWidth;
      } else {
        leftPanelWidth.value = 80;
      }
      
      // 恢复图片全览区高度（验证范围）
      if (settings.galleryHeight && settings.galleryHeight >= 15 && settings.galleryHeight <= 50) {
        galleryHeight.value = settings.galleryHeight;
      } else {
        galleryHeight.value = 20;
      }
    } else {
      leftPanelWidth.value = 80;
      galleryHeight.value = 20;
    }
  } catch (error) {
    console.error('恢复布局设置失败:', error);
    // 如果恢复失败，使用默认值
    leftPanelWidth.value = 80;
    galleryHeight.value = 20;
  }
};

// 保存布局设置到 localStorage
const saveLayoutSettings = () => {
  try {
    const settings = {
      leftPanelWidth: leftPanelWidth.value,
      galleryHeight: galleryHeight.value,
      timestamp: Date.now()
    };
    
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存布局设置失败:', error);
  }
};

// 调色参数（响应式）
const adjustments = reactive({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 100,
  exposure: 100
});

// 计算图片滤镜样式（响应式）
const imageFilter = computed(() => {
  const brightness = adjustments.brightness / 100;
  const contrast = adjustments.contrast / 100;
  const saturation = adjustments.saturation / 100;
  const temperature = adjustments.temperature / 100;
  const exposure = adjustments.exposure / 100;

  return `
    brightness(${brightness}) 
    contrast(${contrast}) 
    saturate(${saturation}) 
    sepia(${1 - temperature * 0.5})
    exposure(${exposure})
  `.replace(/\s+/g, ' ').trim();
});

// 开始拖拽分割线
const startResize = (e) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
};

// 处理拖拽
const handleResize = (e) => {
  if (!isResizing.value) return;
  
  const containerRect = document.querySelector('.editor-container').getBoundingClientRect();
  const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
  
  // 限制最小和最大宽度
  if (newLeftWidth >= 70 && newLeftWidth <= 85) {
    leftPanelWidth.value = newLeftWidth;
  }
};

// 停止拖拽
const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 保存布局设置
  saveLayoutSettings();
};

// 开始拖拽图片全览区
const startGalleryResize = (e) => {
  isGalleryResizing.value = true;
  document.addEventListener('mousemove', handleGalleryResize);
  document.addEventListener('mouseup', stopGalleryResize);
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
};

// 处理图片全览区拖拽
const handleGalleryResize = (e) => {
  if (!isGalleryResizing.value) return;
  
  const leftPanel = document.querySelector('.image-display');
  const leftPanelRect = leftPanel.getBoundingClientRect();
  
  // 计算新的高度（从底部向上计算，转换为vh）
  const newHeightPx = leftPanelRect.bottom - e.clientY;
  const newHeightVh = (newHeightPx / window.innerHeight) * 100;
  
  // 限制最小高度15vh，最大高度为50vh
  const minHeight = 15;
  const maxHeight = maxGalleryHeight.value;
  
  if (newHeightVh >= minHeight && newHeightVh <= maxHeight) {
    galleryHeight.value = newHeightVh;
  }
};

// 停止拖拽图片全览区
const stopGalleryResize = () => {
  isGalleryResizing.value = false;
  document.removeEventListener('mousemove', handleGalleryResize);
  document.removeEventListener('mouseup', stopGalleryResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 保存布局设置
  saveLayoutSettings();
};

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('mousemove', handleGalleryResize);
  document.removeEventListener('mouseup', stopGalleryResize);
});

// 组件挂载时恢复布局设置
onMounted(() => {
  restoreLayoutSettings();
});

// 重置布局到默认设置
const resetLayout = () => {
  leftPanelWidth.value = 80;
  galleryHeight.value = 20;
  
  // 清除localStorage中的旧数据并保存新的默认值
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
  saveLayoutSettings();
};

// 触发文件选择框
const triggerFileInput = () => {
  document.getElementById('image-input').click();
};

// 处理图片上传
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = {
        id: Date.now(),
        name: file.name,
        src: event.target.result,
        originalFile: file
      };
      
      // 添加到已上传图片列表
      uploadedImages.value.push(imageData);
      
      // 设置为当前预览图片
      selectImage(imageData);
    };
    reader.readAsDataURL(file);
  }
};

// 选择图片进行编辑
const selectImage = (image) => {
  imageSrc.value = image.src;
  selectedImageId.value = image.id;
  // 重置参数
  resetAdjustments();
};

// 更新滤镜（Vue中由computed自动处理，此方法仅为统一入口）
const updateImageFilter = () => {};

// 重置所有调色参数
const resetAdjustments = () => {
  adjustments.brightness = 100;
  adjustments.contrast = 100;
  adjustments.saturation = 100;
  adjustments.temperature = 100;
  adjustments.exposure = 100;
};

// 保存图片
const saveImage = () => {
  if (!imageSrc.value) {
    alert('请先上传图片！');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 设置canvas尺寸与原图一致
  canvas.width = previewImage.value.naturalWidth;
  canvas.height = previewImage.value.naturalHeight;
  
  // 应用滤镜并绘制图片
  ctx.filter = imageFilter.value;
  ctx.drawImage(previewImage.value, 0, 0);
  
  // 生成下载链接
  const link = document.createElement('a');
  link.download = `edited-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
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
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* 左侧图片显示区 */
.image-display {
  height: 100%;
  background-color: #222;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.1s ease;
}

/* 上方图片预览区 */
.image-preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 2vw;
  transition: height 0.1s ease;
}

.image-wrapper {
  max-width: 100%;
  max-height: 100%;
  position: relative;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(255,255,255,0.1);
}

.upload-tips {
  color: #aaa;
  font-size: 16px;
  text-align: center;
}

/* 图片全览区的拖拽线 */
.gallery-resizer {
  height: 0.5vh;
  width: 100%;
  background-color: #444;
  cursor: row-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.gallery-resizer:hover {
  background-color: #555;
}

.gallery-resizer.resizing {
  background-color: #409eff;
}

.gallery-resizer-handle {
  height: 100%;
  width: 6vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gallery-resizer-dots {
  display: flex;
  gap: 0.3vw;
  align-items: center;
}

/* 下方图片全览区 */
.image-gallery {
  background-color: #333;
  display: flex;
  flex-direction: column;
  transition: height 0.1s ease;
  min-height: 15vh;
  max-height: 50vh;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1vh 1.5vw;
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
}

.gallery-header h3 {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.gallery-controls {
  display: flex;
  align-items: center;
  gap: 1vw;
}

.image-count {
  color: #aaa;
  font-size: 12px;
}

.reset-layout-btn {
  background: none;
  border: 1px solid #555;
  color: #aaa;
  padding: 0.4vh 0.6vw;
  border-radius: 0.3vw;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
}

.reset-layout-btn:hover {
  background-color: #444;
  border-color: #666;
  color: #fff;
}

.gallery-content {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 1vh;
}

.image-grid {
  display: flex;
  gap: 0.8vw;
  height: 100%;
  align-items: center;
}

.gallery-item {
  width: 12vw;
  height: 8vh;
  position: relative;
  cursor: pointer;
  border-radius: 0.4vw;
  overflow: hidden;
  border: 0.2vw solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.gallery-item:hover {
  border-color: #409eff;
  transform: scale(1.05);
}

.gallery-item.active {
  border-color: #67c23a;
  box-shadow: 0 0 0.8vw rgba(103, 194, 58, 0.5);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 0.8vh 0.6vw 0.4vh;
  transform: translateY(100%);
  transition: transform 0.2s ease;
}

.gallery-item:hover .image-overlay {
  transform: translateY(0);
}

.image-name {
  color: #fff;
  font-size: 11px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 可拖拽的分割线 */
.resizer {
  width: 0.5vw;
  height: 100%;
  background-color: #444;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resizer:hover {
  background-color: #555;
}

.resizer.resizing {
  background-color: #409eff;
}

.resizer-handle {
  width: 100%;
  height: 6vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.resizer-dots {
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
  align-items: center;
}

.dot {
  width: 0.3vw;
  height: 0.3vw;
  background-color: #888;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.resizer:hover .dot {
  background-color: #bbb;
}

.resizer.resizing .dot {
  background-color: #fff;
}

/* 右侧调色区 */
.adjust-panel {
  height: 100%;
  background-color: #fff;
  padding: 2vh 2vw;
  overflow-y: auto;
  box-shadow: -0.2vw 0 1vw rgba(0,0,0,0.1);
  transition: width 0.1s ease;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 2vh;
  color: #222;
  border-bottom: 0.2vh solid #eee;
  padding-bottom: 1vh;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 3vh;
}

#upload-btn {
  background-color: #409eff;
  color: #fff;
  border: none;
  padding: 1vh 2vw;
  border-radius: 0.4vw;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 1vh;
}

#upload-btn:hover {
  background-color: #66b1ff;
}

/* 调色参数项 */
.adjust-item {
  margin-bottom: 2vh;
}

.adjust-label {
  display: block;
  margin-bottom: 0.8vh;
  font-size: 14px;
  color: #555;
}

.adjust-slider {
  width: 100%;
  height: 0.6vh;
  -webkit-appearance: none;
  background: #eee;
  border-radius: 0.3vh;
  outline: none;
}

.adjust-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.8vh;
  height: 1.8vh;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
}

.adjust-value {
  font-size: 12px;
  color: #888;
  margin-top: 0.5vh;
  text-align: right;
}

/* 操作按钮 */
.action-buttons {
  margin-top: 3vh;
  display: flex;
  gap: 1vw;
}

#reset-btn {
  background-color: #e6a23c;
  color: #fff;
  border: none;
  padding: 1vh 0;
  width: 50%;
  border-radius: 0.4vw;
  cursor: pointer;
}

#reset-btn:hover {
  background-color: #ebb563;
}

#save-btn {
  background-color: #67c23a;
  color: #fff;
  border: none;
  padding: 1vh 0;
  width: 50%;
  border-radius: 0.4vw;
  cursor: pointer;
}

#save-btn:hover {
  background-color: #85ce61;
}
</style>