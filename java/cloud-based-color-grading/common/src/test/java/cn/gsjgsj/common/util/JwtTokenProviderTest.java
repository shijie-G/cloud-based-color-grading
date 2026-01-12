package cn.gsjgsj.common.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JwtTokenProvider单元测试
 * 验证需求：2.2, 2.3
 */
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() throws Exception {
        jwtTokenProvider = new JwtTokenProvider();
        
        // 使用反射设置私有字段
        setField(jwtTokenProvider, "secretKey", "your-256-bit-secret-key-for-jwt-token-generation-and-validation");
        setField(jwtTokenProvider, "validityInMilliseconds", 7200000L); // 2小时
    }

    /**
     * 测试令牌生成的正确性
     * 验证需求：1.5
     */
    @Test
    void testGenerateToken_Success() {
        // Given
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER", "ROLE_ADMIN");

        // When
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        System.out.println(token);

        // Then
        assertNotNull(token, "Token should not be null");
        assertFalse(token.isEmpty(), "Token should not be empty");
        assertTrue(token.split("\\.").length == 3, "JWT should have 3 parts separated by dots");
    }

    /**
     * 测试从令牌中提取用户信息
     * 验证需求：1.5, 2.1
     */
    @Test
    void testExtractUserInfoFromToken_Success() {
        // Given
        Long userId = 123L;
        String username = "john_doe";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);

        // When
        Long extractedUserId = jwtTokenProvider.getUserIdFromToken(token);
        String extractedUsername = jwtTokenProvider.getUsernameFromToken(token);
        List<String> extractedRoles = jwtTokenProvider.getRolesFromToken(token);

        // Then
        assertEquals(userId, extractedUserId, "Extracted userId should match");
        assertEquals(username, extractedUsername, "Extracted username should match");
        assertEquals(roles, extractedRoles, "Extracted roles should match");
    }

    /**
     * 测试有效令牌的验证
     * 验证需求：2.1
     */
    @Test
    void testValidateToken_ValidToken_ReturnsTrue() {
        // Given
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertTrue(isValid, "Valid token should pass validation");
    }

    /**
     * 测试过期令牌的验证失败
     * 验证需求：2.2
     */
    @Test
    void testValidateToken_ExpiredToken_ReturnsFalse() throws Exception {
        // Given - 创建一个已过期的令牌（有效期设置为1毫秒）
        setField(jwtTokenProvider, "validityInMilliseconds", 1L);
        
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 等待令牌过期
        Thread.sleep(10);

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertFalse(isValid, "Expired token should fail validation");
    }

    /**
     * 测试篡改令牌的验证失败
     * 验证需求：2.3
     */
    @Test
    void testValidateToken_TamperedToken_ReturnsFalse() {
        // Given
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 篡改令牌（修改最后一个字符）
        String tamperedToken = token.substring(0, token.length() - 1) + "X";

        // When
        boolean isValid = jwtTokenProvider.validateToken(tamperedToken);

        // Then
        assertFalse(isValid, "Tampered token should fail validation");
    }

    /**
     * 测试无效格式令牌的验证失败
     * 验证需求：2.3
     */
    @Test
    void testValidateToken_InvalidFormat_ReturnsFalse() {
        // Given
        String invalidToken = "invalid.token.format";

        // When
        boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        // Then
        assertFalse(isValid, "Invalid format token should fail validation");
    }

    /**
     * 测试获取令牌剩余有效期
     * 验证需求：2.4
     */
    @Test
    void testGetRemainingValidity_ValidToken_ReturnsPositiveValue() {
        // Given
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);

        // When
        long remainingValidity = jwtTokenProvider.getRemainingValidity(token);

        // Then
        assertTrue(remainingValidity > 0, "Remaining validity should be positive");
        assertTrue(remainingValidity <= 7200000L, "Remaining validity should not exceed 2 hours");
    }

    /**
     * 测试过期令牌的剩余有效期为0
     * 验证需求：2.2
     */
    @Test
    void testGetRemainingValidity_ExpiredToken_ReturnsZero() throws Exception {
        // Given - 创建一个已过期的令牌
        setField(jwtTokenProvider, "validityInMilliseconds", 1L);
        
        Long userId = 1L;
        String username = "testuser";
        List<String> roles = Arrays.asList("ROLE_USER");
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 等待令牌过期
        Thread.sleep(10);

        // When
        long remainingValidity = jwtTokenProvider.getRemainingValidity(token);

        // Then
        assertEquals(0L, remainingValidity, "Expired token should have 0 remaining validity");
    }

    /**
     * 测试无效令牌的剩余有效期为0
     * 验证需求：2.3
     */
    @Test
    void testGetRemainingValidity_InvalidToken_ReturnsZero() {
        // Given
        String invalidToken = "invalid.token";

        // When
        long remainingValidity = jwtTokenProvider.getRemainingValidity(invalidToken);

        // Then
        assertEquals(0L, remainingValidity, "Invalid token should have 0 remaining validity");
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
