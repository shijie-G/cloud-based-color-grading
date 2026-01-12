package cn.gsjgsj.authservice.service;

import cn.gsjgsj.common.service.RedisService;
import net.jqwik.api.*;
import net.jqwik.spring.JqwikSpringSupport;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 登录失败计数属性测试
 * Feature: user-authentication-authorization, Property 3: 登录失败计数单调递增
 * 验证需求：1.4
 */
@SpringBootTest(properties = {
    "spring.data.redis.host=139.199.17.216",
    "spring.data.redis.port=16739",
    "spring.data.redis.password=123456",
    "spring.data.redis.database=0"
})
@JqwikSpringSupport
class LoginFailureCountPropertyTest {
    
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
     * 属性 3：登录失败计数单调递增
     * 对于任何用户名，连续记录登录失败时，失败计数应该单调递增，直到达到锁定阈值或过期
     */
    @Property(tries = 100)
    @Label("登录失败计数单调递增 - 连续失败次数递增")
    void loginFailureCountShouldMonotonicallyIncrease(@ForAll("usernames") String username,
                                                      @ForAll("failureCounts") int failureCount) {
        // 清理之前的数据
        redisService.clearLoginFailCount(username);
        
        int previousCount = 0;
        
        // 连续记录登录失败
        for (int i = 0; i < failureCount; i++) {
            int currentCount = redisService.recordLoginFailure(username);
            
            // 验证：当前计数应该大于前一次计数
            assertThat(currentCount).isGreaterThan(previousCount);
            
            // 验证：当前计数应该等于 i + 1
            assertThat(currentCount).isEqualTo(i + 1);
            
            previousCount = currentCount;
        }
        
        // 清理测试数据
        redisService.clearLoginFailCount(username);
    }
    
    @Property(tries = 100)
    @Label("登录失败计数单调递增 - 达到阈值后锁定账户")
    void accountShouldBeLockedAfterThresholdFailures(@ForAll("usernames") String username) {
        // 清理之前的数据
        redisService.clearLoginFailCount(username);
        redisService.unlockAccount(username);
        
        // 记录5次失败（达到阈值）
        for (int i = 0; i < 5; i++) {
            redisService.recordLoginFailure(username);
        }
        
        // 验证：账户应该被锁定
        assertThat(redisService.isAccountLocked(username)).isTrue();
        
        // 清理测试数据
        redisService.clearLoginFailCount(username);
        redisService.unlockAccount(username);
    }
    
    @Property(tries = 100)
    @Label("登录失败计数单调递增 - 清除后重新计数")
    void failureCountShouldResetAfterClear(@ForAll("usernames") String username,
                                           @ForAll("initialFailureCounts") int initialFailures) {
        // 清理之前的数据
        redisService.clearLoginFailCount(username);
        
        // 记录初始失败次数
        for (int i = 0; i < initialFailures; i++) {
            redisService.recordLoginFailure(username);
        }
        
        // 验证初始计数
        int countBeforeClear = redisService.getLoginFailCount(username);
        assertThat(countBeforeClear).isEqualTo(initialFailures);
        
        // 清除失败计数
        redisService.clearLoginFailCount(username);
        
        // 验证计数已清零
        int countAfterClear = redisService.getLoginFailCount(username);
        assertThat(countAfterClear).isEqualTo(0);
        
        // 再次记录失败，应该从1开始
        int newCount = redisService.recordLoginFailure(username);
        assertThat(newCount).isEqualTo(1);
        
        // 清理测试数据
        redisService.clearLoginFailCount(username);
    }
    
    @Property(tries = 100)
    @Label("登录失败计数单调递增 - 不同用户独立计数")
    void differentUsersShouldHaveIndependentCounts(@ForAll("usernames") String username1,
                                                   @ForAll("usernames") String username2,
                                                   @ForAll("initialFailureCounts") int count1,
                                                   @ForAll("initialFailureCounts") int count2) {
        Assume.that(!username1.equals(username2));
        
        // 清理之前的数据
        redisService.clearLoginFailCount(username1);
        redisService.clearLoginFailCount(username2);
        
        // 为用户1记录失败
        for (int i = 0; i < count1; i++) {
            redisService.recordLoginFailure(username1);
        }
        
        // 为用户2记录失败
        for (int i = 0; i < count2; i++) {
            redisService.recordLoginFailure(username2);
        }
        
        // 验证：两个用户的计数应该独立
        assertThat(redisService.getLoginFailCount(username1)).isEqualTo(count1);
        assertThat(redisService.getLoginFailCount(username2)).isEqualTo(count2);
        
        // 清理测试数据
        redisService.clearLoginFailCount(username1);
        redisService.clearLoginFailCount(username2);
    }
    
    /**
     * 生成各种用户名
     */
    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(3)
                .ofMaxLength(20);
    }
    
    /**
     * 生成失败次数 (1-10)
     */
    @Provide
    Arbitrary<Integer> failureCounts() {
        return Arbitraries.integers().between(1, 10);
    }
    
    /**
     * 生成初始失败次数 (1-5)
     */
    @Provide
    Arbitrary<Integer> initialFailureCounts() {
        return Arbitraries.integers().between(1, 5);
    }
}
