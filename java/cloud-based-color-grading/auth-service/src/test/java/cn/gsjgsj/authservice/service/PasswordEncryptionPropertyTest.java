package cn.gsjgsj.authservice.service;

import net.jqwik.api.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 密码加密属性测试
 * Feature: user-authentication-authorization, Property 2: 密码加密不可逆性
 * 验证需求：7.1
 */
class PasswordEncryptionPropertyTest {
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * 属性 2：密码加密不可逆性
     * 对于任何明文密码，使用BCrypt加密后的结果不应该等于原始密码，且同一密码多次加密结果应该不同
     */
    @Property(tries = 100)
    @Label("密码加密不可逆性 - 加密后的密码不等于原始密码")
    void encryptedPasswordShouldNotEqualPlainPassword(@ForAll("passwords") String plainPassword) {
        // 加密密码
        String encryptedPassword = passwordEncoder.encode(plainPassword);
        
        // 验证：加密后的密码不应该等于原始密码
        assertThat(encryptedPassword).isNotEqualTo(plainPassword);
    }
    
    @Property(tries = 100)
    @Label("密码加密不可逆性 - 同一密码多次加密结果不同")
    void samePasswordShouldProduceDifferentHashes(@ForAll("passwords") String plainPassword) {
        // 对同一密码进行两次加密
        String encryptedPassword1 = passwordEncoder.encode(plainPassword);
        String encryptedPassword2 = passwordEncoder.encode(plainPassword);
        
        // 验证：两次加密结果应该不同（BCrypt每次使用不同的盐）
        assertThat(encryptedPassword1).isNotEqualTo(encryptedPassword2);
    }
    
    @Property(tries = 100)
    @Label("密码加密不可逆性 - 加密后仍能正确验证")
    void encryptedPasswordShouldStillMatchOriginal(@ForAll("passwords") String plainPassword) {
        // 加密密码
        String encryptedPassword = passwordEncoder.encode(plainPassword);
        
        // 验证：虽然加密后的密码不等于原始密码，但应该能够通过matches方法验证
        assertThat(passwordEncoder.matches(plainPassword, encryptedPassword)).isTrue();
    }
    
    @Property(tries = 100)
    @Label("密码加密不可逆性 - 错误的密码无法通过验证")
    void wrongPasswordShouldNotMatch(@ForAll("passwords") String plainPassword,
                                     @ForAll("passwords") String wrongPassword) {
        Assume.that(!plainPassword.equals(wrongPassword));
        
        // 加密正确的密码
        String encryptedPassword = passwordEncoder.encode(plainPassword);
        
        // 验证：错误的密码不应该通过验证
        assertThat(passwordEncoder.matches(wrongPassword, encryptedPassword)).isFalse();
    }
    
    /**
     * 生成各种密码字符串
     */
    @Provide
    Arbitrary<String> passwords() {
        return Arbitraries.strings()
                .withCharRange('!', '~') // 可打印ASCII字符
                .ofMinLength(1)
                .ofMaxLength(100);
    }
}
