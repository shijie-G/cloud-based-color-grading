import type { FormRules } from 'element-plus';

// 手机号正则：1开头的11位数字
const PHONE_REGEX = /^1\d{10}$/;

// 邮箱正则
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * 验证账号（手机号或邮箱）
 * @param _rule 验证规则
 * @param value 输入值
 * @param callback 回调函数
 */
export function validateUsername(_rule: any, value: string, callback: any): void {
  if (!value) {
    callback(new Error('请输入手机号或邮箱'));
  } else if (!PHONE_REGEX.test(value) && !EMAIL_REGEX.test(value)) {
    callback(new Error('请输入有效的手机号或邮箱地址'));
  } else {
    callback();
  }
}

/**
 * 验证密码
 * @param _rule 验证规则
 * @param value 输入值
 * @param callback 回调函数
 */
export function validatePassword(_rule: any, value: string, callback: any): void {
  if (!value) {
    callback(new Error('请输入密码'));
  } else {
    callback();
  }
}

/**
 * 登录表单验证规则
 */
export const loginFormRules: FormRules = {
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ]
};
