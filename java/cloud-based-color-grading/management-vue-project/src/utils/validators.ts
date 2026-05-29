import type { FormRules } from 'element-plus';

// 手机号正则：1开头的11位数字
const PHONE_REGEX = /^1\d{10}$/;

// 邮箱正则
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 用户名正则：支持后端 sys_user.username 中的普通账号
const USERNAME_REGEX = /^[a-zA-Z0-9_@.-]{3,50}$/;

export function isValidLoginAccount(value: string): boolean {
  return PHONE_REGEX.test(value) || EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value);
}

/**
 * 验证账号（用户名、手机号或邮箱）
 * @param _rule 验证规则
 * @param value 输入值
 * @param callback 回调函数
 */
export function validateUsername(_rule: any, value: string, callback: any): void {
  if (!value) {
    callback(new Error('请输入账号'));
  } else if (!isValidLoginAccount(value)) {
    callback(new Error('请输入有效的用户名、手机号或邮箱地址'));
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
