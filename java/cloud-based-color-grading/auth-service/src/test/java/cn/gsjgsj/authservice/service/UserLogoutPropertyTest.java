package cn.gsjgsj.authservice.service;

import cn.gsjgsj.authservice.service.impl.AuthServiceImpl;
import cn.gsjgsj.common.service.RedisService;
import cn.gsjgsj.common.util.JwtTokenProvider;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 用户登出属性测试
 * Feature: user-authentication-authorization, Property 9: 用户登出令牌失效
 * 验证需求：2.5
 */
@SpringBootTest(properties = {
    "spring.data.redis.host=139.199.17.216",
    "spring.data.redis.port=16739",
    "spring.data.redis.password=123456",
    "spring.data.redis.database=0"
})
@JqwikSpringSupport
class UserLogoutPropertyTest {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private RedisService redisService;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @BeforeEach
    void setUp() {
        // 清理Redis中的测试数据
        redisTemplate.getConnectionFactory().getConnection().flushDb();
    }
    
    /**
     * 属性 9：用户登出令牌失效
     * 对于任何用户，登出后其JWT令牌应该从Redis中删除，后续使用该令牌的请求应该被拒绝
     */
    @Property(tries = 100)
    @Label("用户登出令牌失效 - 登出后令牌从Redis删除")
    void logoutShouldRemoveTokenFromRedis(@ForAll("userIds") Long userId,
                                          @ForAll("usernames") String username) {
        // 生成并存储令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        redisService.saveToken(userId, token);
        
        // 验证：令牌已存储在Redis中
        assertThat(redisService.hasToken(userId)).isTrue();
        assertThat(redisService.getToken(userId)).isEqualTo(token);
        
        // 执行登出
        authService.logout(userId);
        
        // 验证：令牌已从Redis中删除
        assertThat(redisService.hasToken(userId)).isFalse();
        assertThat(redisService.getToken(userId)).isNull();
    }
    
    @Property(tries = 100)
    @Label("用户登出令牌失效 - 登出后令牌验证失败")
    void logoutShouldInvalidateToken(@ForAll("userIds") Long userId,
                                     @ForAll("usernames") String username) {
        // 生成并存储令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        redisService.saveToken(userId, token);
        
        // 验证：登出前令牌有效
        assertThat(authService.validateToken(token)).isTrue();
        
        // 执行登出
        authService.logout(userId);
        
        // 验证：登出后令牌验证失败
        assertThat(authService.validateToken(token)).isFalse();
    }
    
    @Property(tries = 100)
    @Label("用户登出令牌失效 - 登出后权限缓存清除")
    void logoutShouldClearPermissionCache(@ForAll("userIds") Long userId,
                                          @ForAll("usernames") String username) {
        // 生成并存储令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        redisService.saveToken(userId, token);
        
        // 存储权限缓存（使用空列表模拟）
        redisService.savePermissions(userId, new ArrayList<>());
        
        // 验证：权限缓存已存储
        assertThat(redisService.getPermissions(userId)).isNotNull();
        
        // 执行登出
        authService.logout(userId);
        
        // 验证：权限缓存已清除
        assertThat(redisService.getPermissions(userId)).isNull();
    }
    
    @Property(tries = 100)
    @Label("用户登出令牌失效 - 多次登出不会出错")
    void multipleLogoutsShouldNotCauseError(@ForAll("userIds") Long userId,
                                            @ForAll("usernames") String username) {
        // 生成并存储令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        redisService.saveToken(userId, token);
        
        // 第一次登出
        authService.logout(userId);
        
        // 验证：令牌已删除
        assertThat(redisService.hasToken(userId)).isFalse();
        
        // 第二次登出（应该不会抛出异常）
        authService.logout(userId);
        
        // 验证：仍然没有令牌
        assertThat(redisService.hasToken(userId)).isFalse();
    }
    
    @Property(tries = 100)
    @Label("用户登出令牌失效 - 不同用户登出互不影响")
    void logoutShouldNotAffectOtherUsers(@ForAll("userIds") Long userId1,
                                         @ForAll("userIds") Long userId2,
                                         @ForAll("usernames") String username1,
                                         @ForAll("usernames") String username2) {
        Assume.that(!userId1.equals(userId2));
        
        // 为两个用户生成并存储令牌
        List<String> roles = new ArrayList<>();
        String token1 = jwtTokenProvider.generateToken(userId1, username1, roles);
        String token2 = jwtTokenProvider.generateToken(userId2, username2, roles);
        redisService.saveToken(userId1, token1);
        redisService.saveToken(userId2, token2);
        
        // 验证：两个用户的令牌都已存储
        assertThat(redisService.hasToken(userId1)).isTrue();
        assertThat(redisService.hasToken(userId2)).isTrue();
        
        // 用户1登出
        authService.logout(userId1);
        
        // 验证：用户1的令牌已删除，但用户2的令牌仍然存在
        assertThat(redisService.hasToken(userId1)).isFalse();
        assertThat(redisService.hasToken(userId2)).isTrue();
        assertThat(redisService.getToken(userId2)).isEqualTo(token2);
        
        // 清理用户2的令牌
        authService.logout(userId2);
    }
    
    /**
     * 生成用户ID
     */
    @Provide
    Arbitrary<Long> userIds() {
        return Arbitraries.longs().between(1L, 1000000L);
    }
    
    /**
     * 生成用户名
     */
    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(3)
                .ofMaxLength(20);
    }
}
