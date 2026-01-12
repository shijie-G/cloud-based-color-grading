package cn.gsjgsj.authservice.service;

import cn.gsjgsj.common.util.JwtTokenProvider;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 令牌过期时间属性测试
 * Feature: user-authentication-authorization, Property 6: 令牌过期时间单调性
 * 验证需求：2.2
 */
@SpringBootTest(properties = {
    "spring.data.redis.host=139.199.17.216",
    "spring.data.redis.port=16739",
    "spring.data.redis.password=123456",
    "spring.data.redis.database=0"
})
@JqwikSpringSupport
class TokenExpirationPropertyTest {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    /**
     * 属性 6：令牌过期时间单调性
     * 对于任何JWT令牌，其剩余有效期应该随时间单调递减，直到过期
     */
    @Property(tries = 100)
    @Label("令牌过期时间单调性 - 剩余有效期随时间递减")
    void tokenRemainingValidityShouldDecreaseOverTime(@ForAll("userIds") Long userId,
                                                      @ForAll("usernames") String username) throws InterruptedException {
        // 生成令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 获取初始剩余有效期
        long initialValidity = jwtTokenProvider.getRemainingValidity(token);
        
        // 验证：初始剩余有效期应该大于0
        assertThat(initialValidity).isGreaterThan(0);
        
        // 等待一小段时间（100毫秒）
        Thread.sleep(100);
        
        // 再次获取剩余有效期
        long laterValidity = jwtTokenProvider.getRemainingValidity(token);
        
        // 验证：后续的剩余有效期应该小于初始剩余有效期
        assertThat(laterValidity).isLessThan(initialValidity);
        
        // 验证：剩余有效期仍然大于0（因为只等待了100毫秒）
        assertThat(laterValidity).isGreaterThan(0);
    }
    
    @Property(tries = 100)
    @Label("令牌过期时间单调性 - 新生成的令牌有效期接近配置值")
    void newTokenShouldHaveValidityCloseToConfigured(@ForAll("userIds") Long userId,
                                                     @ForAll("usernames") String username) {
        // 生成令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 获取剩余有效期
        long remainingValidity = jwtTokenProvider.getRemainingValidity(token);
        
        // 验证：剩余有效期应该接近2小时（7200000毫秒）
        // 允许1秒的误差（1000毫秒）
        long expectedValidity = 7200000; // 2小时
        long tolerance = 1000; // 1秒
        
        assertThat(remainingValidity)
                .isGreaterThan(expectedValidity - tolerance)
                .isLessThanOrEqualTo(expectedValidity);
    }
    
    @Property(tries = 100)
    @Label("令牌过期时间单调性 - 多次检查剩余有效期递减")
    void multipleChecksShouldShowDecreasingValidity(@ForAll("userIds") Long userId,
                                                    @ForAll("usernames") String username) throws InterruptedException {
        // 生成令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        long previousValidity = jwtTokenProvider.getRemainingValidity(token);
        
        // 进行3次检查，每次间隔50毫秒
        for (int i = 0; i < 3; i++) {
            Thread.sleep(50);
            
            long currentValidity = jwtTokenProvider.getRemainingValidity(token);
            
            // 验证：当前剩余有效期应该小于前一次
            assertThat(currentValidity).isLessThan(previousValidity);
            
            previousValidity = currentValidity;
        }
    }
    
    @Property(tries = 100)
    @Label("令牌过期时间单调性 - 有效令牌验证通过")
    void validTokenShouldPassValidation(@ForAll("userIds") Long userId,
                                       @ForAll("usernames") String username) {
        // 生成令牌
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 验证：新生成的令牌应该是有效的
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        
        // 验证：剩余有效期应该大于0
        assertThat(jwtTokenProvider.getRemainingValidity(token)).isGreaterThan(0);
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
