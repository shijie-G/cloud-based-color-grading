import { describe, it, expect } from 'vitest';
import { validateUsername, validatePassword } from '../utils/validators';

describe('Validators', () => {
  describe('validateUsername', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = ['13800138000', '18912345678', '15555555555'];
      
      validPhones.forEach(phone => {
        let error: Error | undefined;
        validateUsername(null, phone, (err?: Error) => { error = err; });
        expect(error).toBeUndefined();
      });
    });

    it('should accept valid email addresses', () => {
      const validEmails = ['user@example.com', 'test.user@domain.co.uk', 'admin+tag@site.org'];
      
      validEmails.forEach(email => {
        let error: Error | undefined;
        validateUsername(null, email, (err?: Error) => { error = err; });
        expect(error).toBeUndefined();
      });
    });

    it('should reject empty username', () => {
      let error: Error | undefined;
      validateUsername(null, '', (err?: Error) => { error = err; });
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('请输入手机号或邮箱');
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['12345', '2380013800', '138001380001', 'abcdefghijk'];
      
      invalidPhones.forEach(phone => {
        let error: Error | undefined;
        validateUsername(null, phone, (err?: Error) => { error = err; });
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('请输入有效的手机号或邮箱地址');
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = ['notanemail', '@example.com', 'user@', 'user@domain'];
      
      invalidEmails.forEach(email => {
        let error: Error | undefined;
        validateUsername(null, email, (err?: Error) => { error = err; });
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('请输入有效的手机号或邮箱地址');
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords with 6 or more characters', () => {
      const validPasswords = ['123456', 'password', 'verylongpassword123'];
      
      validPasswords.forEach(password => {
        let error: Error | undefined;
        validatePassword(null, password, (err?: Error) => { error = err; });
        expect(error).toBeUndefined();
      });
    });

    it('should reject empty password', () => {
      let error: Error | undefined;
      validatePassword(null, '', (err?: Error) => { error = err; });
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('请输入密码');
    });

    it('should reject passwords shorter than 6 characters', () => {
      const shortPasswords = ['1', '12', '123', '1234', '12345'];
      
      shortPasswords.forEach(password => {
        let error: Error | undefined;
        validatePassword(null, password, (err?: Error) => { error = err; });
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('密码至少 6 个字符');
      });
    });

    it('should accept password with exactly 6 characters (boundary)', () => {
      let error: Error | undefined;
      validatePassword(null, '123456', (err?: Error) => { error = err; });
      expect(error).toBeUndefined();
    });
  });
});
