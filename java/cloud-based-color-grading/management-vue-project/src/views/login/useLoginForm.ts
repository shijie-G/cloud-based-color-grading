import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useUserStore } from '../../stores/userStore';
import { isValidLoginAccount, loginFormRules } from '../../utils/validators';
import type { LoginFormData } from '../../types/auth';
import { toStationLocation } from '../../router/stationLocation';

/**
 * useLoginForm 返回类型
 */
export interface UseLoginFormReturn {
  formData: Ref<LoginFormData>;
  formRef: Ref<FormInstance | undefined>;
  rules: FormRules;
  loading: Ref<boolean>;
  isFormValid: ComputedRef<boolean>;
  handleLogin: () => Promise<void>;
}

/**
 * 登录表单组合式函数
 * 管理登录表单状态、验证和提交逻辑
 * 
 * 需求: 2.5, 3.1, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 7.3
 */
export function useLoginForm(): UseLoginFormReturn {
  const route = useRoute();
  const userStore = useUserStore();

  // 表单数据
  const formData = ref<LoginFormData>({
    username: '',
    password: ''
  });

  // 表单引用
  const formRef = ref<FormInstance>();

  // 加载状态
  const loading = ref(false);

  /**
   * 计算属性：检查表单是否有效
   * 当表单没有验证错误时返回 true
   * 需求: 2.5
   */
  const isFormValid = computed(() => {
    // 检查表单字段是否为空
    if (!formData.value.username || !formData.value.password) {
      return false;
    }

    // 检查账号格式（用户名、手机号或邮箱）
    if (!isValidLoginAccount(formData.value.username)) {
      return false;
    }

    return true;
  });

  /**
   * 处理登录
   * 验证表单、调用 userStore.login、处理错误、导航
   * 需求: 3.1, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 7.3
   */
  async function handleLogin(): Promise<void> {
    try {
      console.log('开始登录流程...');
      // 设置加载状态
      loading.value = true;

      // 验证表单
      if (!formRef.value) {
        console.error('表单引用不存在');
        return;
      }
      console.log('开始表单验证...');
      await formRef.value.validate();
      console.log('表单验证通过');

      // 调用 userStore.login
      console.log('调用 userStore.login...');
      const loginResult = await userStore.login({
        username: formData.value.username,
        password: formData.value.password
      });
      console.log('登录 API 返回结果:', loginResult);
      console.log('登录成功，用户信息已保存');
      console.log('当前登录状态:', userStore.isLoggedIn);
      console.log('当前 token:', userStore.token);
      console.log('当前 token 类型:', typeof userStore.token);
      console.log('localStorage 中的 token:', localStorage.getItem('user_token'));

      // 显示成功提示
      ElMessage.success('登录成功');

      // 获取重定向路径
      const redirect = route.query.redirect as string;
      const targetPath = toStationLocation(redirect || '/workstation');
      console.log('准备跳转到:', targetPath);
      console.log('当前路由:', route.path);
      
      // 直接使用 window.location 进行跳转，避免路由守卫的复杂性
      console.log('使用 window.location 跳转到:', targetPath);
      window.location.href = targetPath;

    } catch (error: any) {
      console.error('登录失败:', error);
      
      // 处理错误并显示提示
      if (error.response) {
        // HTTP 错误响应
        const status = error.response.status;
        console.error('HTTP 错误状态:', status);
        switch (status) {
          case 401:
            ElMessage.error('手机号/邮箱或密码错误');
            break;
          case 403:
            ElMessage.error('账户已被锁定或禁用，请联系管理员');
            break;
          case 500:
            ElMessage.error('登录失败，请稍后重试');
            break;
          default:
            ElMessage.error(error.response.data?.message || '登录失败，请稍后重试');
        }
      } else if (error.request) {
        // 网络错误
        console.error('网络错误:', error.request);
        ElMessage.error('网络连接失败，请检查网络设置');
      } else if (error.message) {
        // 其他错误（包括业务逻辑错误）
        console.error('业务错误:', error.message);
        ElMessage.error(error.message);
      } else {
        // 表单验证错误或其他未知错误
        console.error('未知错误:', error);
        ElMessage.error('登录失败，请稍后重试');
      }
    } finally {
      // 恢复按钮状态
      loading.value = false;
    }
  }

  return {
    formData,
    formRef,
    rules: loginFormRules,
    loading,
    isFormValid,
    handleLogin
  };
}
