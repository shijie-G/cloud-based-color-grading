import { ref, type Ref } from 'vue'

/**
 * 对话框返回值接口
 */
export interface UseDialogReturn {
  visible: Ref<boolean>
  loading: Ref<boolean>
  open: () => void
  close: () => void
  setLoading: (value: boolean) => void
}

/**
 * 对话框组合函数
 * 封装对话框通用逻辑，包括显示/隐藏、加载状态等
 * 
 * @returns 对话框状态和方法
 * 
 * @example
 * ```ts
 * const { visible, loading, open, close, setLoading } = useDialog()
 * 
 * // 打开对话框
 * open()
 * 
 * // 提交表单时设置加载状态
 * setLoading(true)
 * await submitForm()
 * setLoading(false)
 * close()
 * ```
 */
export function useDialog(): UseDialogReturn {
  // 对话框状态
  const visible = ref<boolean>(false)
  const loading = ref<boolean>(false)

  /**
   * 打开对话框
   */
  const open = (): void => {
    visible.value = true
    loading.value = false
  }

  /**
   * 关闭对话框
   */
  const close = (): void => {
    visible.value = false
    loading.value = false
  }

  /**
   * 设置加载状态
   * @param value - 加载状态值
   */
  const setLoading = (value: boolean): void => {
    loading.value = value
  }

  return {
    visible,
    loading,
    open,
    close,
    setLoading
  }
}
