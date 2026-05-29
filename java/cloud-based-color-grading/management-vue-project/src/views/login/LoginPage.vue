<template>
  <div class="login-page">
    <!-- 背景装饰元素 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <h1>登录</h1>
      </div>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username" label="账号">
          <el-input
            ref="usernameInputRef"
            v-model="formData.username"
            placeholder="用户名、手机号或邮箱"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!isFormValid"
            @click="handleLogin"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { User, Lock } from '@element-plus/icons-vue';
import { useLoginForm } from './useLoginForm';

/**
 * 登录页面组件
 * 
 * 功能：
 * - 展示登录表单（账号、密码、登录按钮）
 * - 表单居中显示（垂直和水平）
 * - 支持 Enter 键提交
 * - 自动聚焦到账号输入框
 * 
 * 需求: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2
 */

// 使用登录表单组合式函数
const { formData, formRef, rules, loading, isFormValid, handleLogin } = useLoginForm();

// 账号输入框引用（用于自动聚焦）
const usernameInputRef = ref();

/**
 * 组件挂载后自动聚焦到账号输入框
 * 需求: 7.2
 */
onMounted(() => {
  usernameInputRef.value?.focus();
});
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* 背景装饰元素 */
.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(2px);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation: float 20s ease-in-out infinite;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  right: -80px;
  animation: float 15s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 10%;
  animation: float 18s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -30px) scale(1.1);
  }
}

.login-card {
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 48px 40px;
  width: 420px;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 24px 64px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.5px;
}

.login-form {
  width: 100%;
}

/* Element Plus 样式定制 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
  line-height: 1.5;
}

:deep(.el-input__wrapper) {
  padding: 12px 14px;
  border-radius: 10px;
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 0, 0, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}

:deep(.el-input__inner) {
  font-size: 15px;
  color: #1d1d1f;
  font-weight: 400;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(60, 60, 67, 0.6);
}

:deep(.el-input__prefix) {
  color: rgba(60, 60, 67, 0.6);
}

:deep(.el-input__wrapper.is-focus .el-input__prefix) {
  color: #007aff;
}

.login-button {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  background: #007aff;
  border: none;
  color: #ffffff;
  margin-top: 8px;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.login-button:hover:not(:disabled) {
  background: #0051d5;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.login-button:active:not(:disabled) {
  transform: scale(0.98);
  background: #004bb8;
}

:deep(.login-button.is-disabled) {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(60, 60, 67, 0.3);
  cursor: not-allowed;
}

:deep(.login-button.is-loading) {
  background: #007aff;
}

/* 错误提示样式 */
:deep(.el-form-item__error) {
  font-size: 13px;
  color: #ff3b30;
  padding-top: 4px;
  font-weight: 400;
}
</style>
