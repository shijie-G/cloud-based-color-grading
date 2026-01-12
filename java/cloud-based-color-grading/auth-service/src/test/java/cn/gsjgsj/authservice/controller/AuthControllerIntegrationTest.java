package cn.gsjgsj.authservice.controller;

import cn.gsjgsj.authservice.mapper.UserMapper;
import cn.gsjgsj.authservice.service.AuthService;
import cn.gsjgsj.common.dto.LoginRequest;
import cn.gsjgsj.common.entity.User;
import cn.gsjgsj.common.service.RedisService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 集成测试
 * 测试完整的登录、登出和刷新令牌流程
 * 
 * 注意：这个测试需要真实的 Redis 和 MySQL 连接
 * 如果没有可用的测试环境，可以跳过这个测试类
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.data.redis.host=139.199.17.216",
    "spring.data.redis.port=16739",
    "spring.data.redis.password=123456",
    "spring.data.redis.database=0"
})
@DisplayName("AuthController 集成测试")
class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private RedisService redisService;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        // 清理 Redis 测试数据
        try {
            redisTemplate.getConnectionFactory().getConnection().flushDb();
        } catch (Exception e) {
            // 如果 Redis 不可用，跳过测试
            System.out.println("Redis 不可用，跳过集成测试");
        }
        
        // 创建测试用户（如果数据库可用）
        try {
            // 先删除可能存在的测试用户
            // 使用 MyBatis-Plus 的 QueryWrapper
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<User> queryWrapper = 
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            queryWrapper.eq("username", "integrationtest");
            userMapper.delete(queryWrapper);
            
            testUser = new User();
            testUser.setUsername("integrationtest");
            testUser.setPassword(passwordEncoder.encode("testpass123"));
            testUser.setNickname("Integration Test User");
            testUser.setEmail("test@example.com");
            testUser.setPhone("13800138000");
            testUser.setStatus(0);
            testUser.setCreateTime(LocalDateTime.now());
            
            userMapper.insert(testUser);
        } catch (Exception e) {
            // 如果数据库不可用，跳过测试
            System.out.println("数据库不可用，跳过集成测试: " + e.getMessage());
        }
    }
    
    @Test
    @DisplayName("完整登录流程 - 登录、验证令牌、登出")
    void completeLoginLogoutFlow() throws Exception {
        // 1. 登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationtest");
        loginRequest.setPassword("testpass123");
        
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.username").value("integrationtest"))
                .andReturn();
        
        // 提取令牌和用户ID
        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody)
                .get("data").get("token").asText();
        Long userId = objectMapper.readTree(responseBody)
                .get("data").get("userId").asLong();
        
        // 2. 验证令牌已存储在 Redis 中
        String storedToken = redisService.getToken(userId);
        assert storedToken != null;
        assert storedToken.equals(token);
        
        // 3. 登出
        mockMvc.perform(post("/auth/logout")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        
        // 4. 验证令牌已从 Redis 中删除
        String tokenAfterLogout = redisService.getToken(userId);
        assert tokenAfterLogout == null;
    }
    
    @Test
    @DisplayName("刷新令牌流程 - 登录后刷新令牌")
    void refreshTokenFlow() throws Exception {
        // 1. 登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationtest");
        loginRequest.setPassword("testpass123");
        
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        
        // 提取令牌
        String responseBody = loginResult.getResponse().getContentAsString();
        String oldToken = objectMapper.readTree(responseBody)
                .get("data").get("token").asText();
        Long userId = objectMapper.readTree(responseBody)
                .get("data").get("userId").asLong();
        
        // 等待至少 1 秒，确保新令牌的时间戳不同
        Thread.sleep(1100);
        
        // 2. 刷新令牌
        MvcResult refreshResult = mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").exists())
                .andReturn();
        
        // 提取新令牌
        String refreshResponseBody = refreshResult.getResponse().getContentAsString();
        String newToken = objectMapper.readTree(refreshResponseBody)
                .get("data").asText();
        
        // 3. 验证新令牌与旧令牌不同（由于时间戳不同，令牌应该不同）
        assert !newToken.equals(oldToken) : "新令牌应该与旧令牌不同";
        
        // 4. 验证新令牌已存储在 Redis 中
        String storedToken = redisService.getToken(userId);
        assert storedToken != null : "Redis 中应该存储新令牌";
        assert storedToken.equals(newToken) : "Redis 中的令牌应该是新令牌";
        
        // 5. 验证旧令牌不再有效（因为 Redis 中已经是新令牌）
        boolean oldTokenValid = authService.validateToken(oldToken);
        assert !oldTokenValid : "旧令牌应该已失效";
        
        // 6. 验证新令牌有效
        boolean newTokenValid = authService.validateToken(newToken);
        assert newTokenValid : "新令牌应该有效";
        
        // 清理：登出
        authService.logout(userId);
    }
    
    @Test
    @DisplayName("登录失败计数 - 连续失败5次后账户锁定")
    void loginFailureCountAndLock() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationtest");
        loginRequest.setPassword("wrongpassword");
        
        // 连续失败5次
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(401));
        }
        
        // 第6次尝试应该返回账户锁定错误
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value(containsString("账户已被锁定")));
        
        // 清理：解锁账户
        redisService.unlockAccount("integrationtest");
        redisService.clearLoginFailCount("integrationtest");
    }
}
