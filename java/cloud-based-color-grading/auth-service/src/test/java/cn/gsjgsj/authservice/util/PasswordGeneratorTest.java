package cn.gsjgsj.authservice.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码生成器测试类
 * 用于生成 BCrypt 加密的密码哈希值
 */
public class PasswordGeneratorTest {
    
    @Test
    public void generateAdminPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "admin123";
        String hashedPassword = encoder.encode(password);
        
        System.out.println("=".repeat(80));
        System.out.println("密码生成结果：");
        System.out.println("=".repeat(80));
        System.out.println("原始密码: " + password);
        System.out.println("BCrypt哈希: " + hashedPassword);
        System.out.println("哈希长度: " + hashedPassword.length() + " 字符");
        System.out.println("=".repeat(80));
        System.out.println("\n更新 data.sql 中的密码：");
        System.out.println("UPDATE sys_user SET password = '" + hashedPassword + "' WHERE username = 'admin';");
        System.out.println("=".repeat(80));
        
        // 验证密码是否正确
        boolean matches = encoder.matches(password, hashedPassword);
        System.out.println("\n密码验证: " + (matches ? "✅ 成功" : "❌ 失败"));
    }
    
    @Test
    public void verifyProvidedHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // 您提供的哈希值
        String providedHash = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
        String password = "admin123";
        
        System.out.println("=".repeat(80));
        System.out.println("验证提供的密码哈希：");
        System.out.println("=".repeat(80));
        System.out.println("密码哈希: " + providedHash);
        System.out.println("哈希长度: " + providedHash.length() + " 字符");
        System.out.println("原始密码: " + password);
        
        try {
            boolean matches = encoder.matches(password, providedHash);
            System.out.println("验证结果: " + (matches ? "✅ 匹配" : "❌ 不匹配"));
            
            if (!matches) {
                System.out.println("\n⚠️ 警告：提供的哈希值与密码不匹配！");
                System.out.println("请使用 generateAdminPassword() 方法生成新的哈希值。");
            }
        } catch (Exception e) {
            System.out.println("❌ 验证失败: " + e.getMessage());
            System.out.println("原因: 密码哈希格式错误");
        }
        
        System.out.println("=".repeat(80));
    }
    
    @Test
    public void generateMultiplePasswords() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String[] passwords = {"admin123", "user123", "test123"};
        
        System.out.println("=".repeat(80));
        System.out.println("批量生成密码哈希：");
        System.out.println("=".repeat(80));
        
        for (String password : passwords) {
            String hashedPassword = encoder.encode(password);
            System.out.println("\n原始密码: " + password);
            System.out.println("BCrypt哈希: " + hashedPassword);
            System.out.println("哈希长度: " + hashedPassword.length() + " 字符");
            
            // 验证
            boolean matches = encoder.matches(password, hashedPassword);
            System.out.println("验证: " + (matches ? "✅" : "❌"));
        }
        
        System.out.println("=".repeat(80));
    }
    
    @Test
    public void verifyExistingPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // data.sql 中的错误密码哈希
        String wrongHash = "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH";
        String password = "admin123";
        
        System.out.println("=".repeat(80));
        System.out.println("验证 data.sql 中的旧密码哈希：");
        System.out.println("=".repeat(80));
        System.out.println("密码哈希: " + wrongHash);
        System.out.println("哈希长度: " + wrongHash.length() + " 字符");
        System.out.println("原始密码: " + password);
        
        try {
            boolean matches = encoder.matches(password, wrongHash);
            System.out.println("验证结果: " + (matches ? "✅ 匹配" : "❌ 不匹配"));
        } catch (Exception e) {
            System.out.println("❌ 验证失败: " + e.getMessage());
            System.out.println("原因: 密码哈希格式错误");
        }
        
        System.out.println("=".repeat(80));
    }
    
    @Test
    public void debugPasswordMatching() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "admin123";
        
        System.out.println("=".repeat(80));
        System.out.println("调试密码匹配过程：");
        System.out.println("=".repeat(80));
        
        // 生成3个不同的哈希值（每次都不同）
        for (int i = 1; i <= 3; i++) {
            String hash = encoder.encode(password);
            boolean matches = encoder.matches(password, hash);
            
            System.out.println("\n第 " + i + " 次生成：");
            System.out.println("哈希值: " + hash);
            System.out.println("验证: " + (matches ? "✅ 成功" : "❌ 失败"));
        }
        
        System.out.println("\n" + "=".repeat(80));
        System.out.println("注意：BCrypt 每次生成的哈希值都不同（因为盐值随机），但都能验证成功！");
        System.out.println("=".repeat(80));
    }
}
