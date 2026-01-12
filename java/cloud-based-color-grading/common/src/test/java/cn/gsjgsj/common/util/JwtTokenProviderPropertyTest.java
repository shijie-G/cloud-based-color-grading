package cn.gsjgsj.common.util;

import net.jqwik.api.*;

import java.lang.reflect.Field;
import java.util.List;

/**
 * JwtTokenProvider属性测试
 * Feature: user-authentication-authorization, Property 1: 令牌生成和验证往返一致性
 * 验证需求：1.5, 2.1
 */
class JwtTokenProviderPropertyTest {

    /**
     * 创建并初始化JwtTokenProvider实例
     */
    private JwtTokenProvider createJwtTokenProvider() throws Exception {
        JwtTokenProvider provider = new JwtTokenProvider();
        
        // 使用反射设置私有字段
        setField(provider, "secretKey", "your-256-bit-secret-key-for-jwt-token-generation-and-validation");
        setField(provider, "validityInMilliseconds", 7200000L); // 2小时
        
        return provider;
    }

    /**
     * 属性 1：令牌生成和验证往返一致性
     * 对于任何有效的用户ID、用户名和角色列表，生成JWT令牌后再解析，应该得到相同的用户ID、用户名和角色列表
     * 验证需求：1.5, 2.1
     */
    @Property(tries = 100)
    void tokenGenerationAndValidationRoundTrip(
            @ForAll("validUserId") Long userId,
            @ForAll("validUsername") String username,
            @ForAll("validRoles") List<String> roles) throws Exception {
        
        // 为每次测试创建新的provider实例
        JwtTokenProvider jwtTokenProvider = createJwtTokenProvider();
        
        // 生成令牌
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 验证令牌有效
        boolean isValid = jwtTokenProvider.validateToken(token);
        assert isValid : "Generated token should be valid";
        
        // 解析令牌并验证往返一致性
        Long extractedUserId = jwtTokenProvider.getUserIdFromToken(token);
        String extractedUsername = jwtTokenProvider.getUsernameFromToken(token);
        List<String> extractedRoles = jwtTokenProvider.getRolesFromToken(token);
        
        // 验证用户ID一致
        assert userId.equals(extractedUserId) : 
            String.format("UserId mismatch: expected %d, got %d", userId, extractedUserId);
        
        // 验证用户名一致
        assert username.equals(extractedUsername) : 
            String.format("Username mismatch: expected %s, got %s", username, extractedUsername);
        
        // 验证角色列表一致
        assert roles.equals(extractedRoles) : 
            String.format("Roles mismatch: expected %s, got %s", roles, extractedRoles);
    }

    /**
     * 生成有效的用户ID（正整数）
     */
    @Provide
    Arbitrary<Long> validUserId() {
        return Arbitraries.longs().between(1L, Long.MAX_VALUE);
    }

    /**
     * 生成有效的用户名（非空字符串，长度1-50）
     */
    @Provide
    Arbitrary<String> validUsername() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(1)
                .ofMaxLength(50);
    }

    /**
     * 生成有效的角色列表（1-5个角色）
     */
    @Provide
    Arbitrary<List<String>> validRoles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(4)
                .ofMaxLength(20)
                .map(s -> "ROLE_" + s.toUpperCase())
                .list()
                .ofMinSize(1)
                .ofMaxSize(5);
    }

    /**
     * 使用反射设置私有字段
     */
    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
