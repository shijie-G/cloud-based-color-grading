<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">管理系统</h1>
      <el-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = ref({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await userStore.login(formData.value)
    
    ElMessage.success('登录成功')
    
    // 跳转到重定向页面或首页
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.login-title {
  margin: 0 0 32px;
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}
</style>
