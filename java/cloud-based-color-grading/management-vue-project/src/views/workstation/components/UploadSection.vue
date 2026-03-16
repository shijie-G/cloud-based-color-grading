<template>
  <div class="upload-section">
    <button id="upload-btn" @click="triggerFileInput">上传图片</button>
    <input
      type="file"
      id="image-input"
      :accept="acceptedFormats"
      @change="handleImageUpload"
      style="display: none"
    />
    <p style="font-size: 12px; color: #999;">支持JPG、PNG、WEBP等格式</p>
  </div>
</template>

<script setup lang="ts">
// UploadSection 组件 - 上传区域

// Props 接口
interface UploadSectionProps {
  acceptedFormats?: string
  maxFileSize?: number
}

// 事件定义
interface UploadSectionEvents {
  'action:uploadImage': [file: File]
}

// 使用 defineProps 和 defineEmits 定义接口
const props = withDefaults(defineProps<UploadSectionProps>(), {
  acceptedFormats: 'image/*',
  maxFileSize: 10 * 1024 * 1024 // 10MB default
})
const emit = defineEmits<UploadSectionEvents>()

// 触发文件选择框
const triggerFileInput = () => {
  document.getElementById('image-input')?.click()
}

// 处理图片上传
const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // 检查文件大小
    if (file.size > props.maxFileSize) {
      alert(`文件大小不能超过 ${Math.round(props.maxFileSize / 1024 / 1024)}MB`)
      return
    }
    
    // 发射上传事件
    emit('action:uploadImage', file)
    
    // 清空input值，允许重复选择同一文件
    target.value = ''
  }
}
</script>

<style scoped>
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
</style>