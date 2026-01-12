package cn.gsjgsj.authservice.controller;

import cn.gsjgsj.authservice.service.AuthService;
import cn.gsjgsj.common.dto.LoginRequest;
import cn.gsjgsj.common.dto.LoginResponse;
import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.dto.Result;
import com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 单元测试
 * 测试登录、登出和刷新令牌接口
 */
@WebMvcTest(AuthController.class)
@EnableAutoConfiguration(exclude = {
    MybatisPlusAutoConfiguration.class,
    DataSourceAutoConfiguration.class
})
@DisplayName("AuthController 单元测试")
class AuthControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private AuthService authService;
    
    private LoginResponse mockLoginResponse;
    
    @BeforeEach
    void setUp() {
        // 准备模拟的登录响应
        mockLoginResponse = new LoginResponse();
        mockLoginResponse.setToken("mock-jwt-token");
        mockLoginResponse.setUserId(1L);
        mockLoginResponse.setUsername("testuser");
        mockLoginResponse.setNickname("Test User");
        mockLoginResponse.setRoles(List.of("ROLE_USER"));
        mockLoginResponse.setPermissions(new ArrayList<>());
        mockLoginResponse.setMenus(new ArrayList<>());
    }
    
    @Test
    @DisplayName("登录成功 - 返回令牌和用户信息")
    void loginSuccess() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
        
        // 模拟服务层行为
        when(authService.login("testuser", "password123"))
                .thenReturn(mockLoginResponse);
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.data.userId").value(1))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.nickname").value("Test User"))
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_USER"));
        
        // 验证服务方法被调用
        verify(authService, times(1)).login("testuser", "password123");
    }
    
    @Test
    @DisplayName("登录失败 - 用户名或密码错误")
    void loginFailureInvalidCredentials() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpassword");
        
        // 模拟服务层抛出异常
        when(authService.login("testuser", "wrongpassword"))
                .thenThrow(new IllegalArgumentException("用户名或密码错误"));
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户名或密码错误"));
        
        verify(authService, times(1)).login("testuser", "wrongpassword");
    }
    
    @Test
    @DisplayName("登录失败 - 账户被锁定")
    void loginFailureAccountLocked() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("lockeduser");
        loginRequest.setPassword("password123");
        
        // 模拟服务层抛出异常
        when(authService.login("lockeduser", "password123"))
                .thenThrow(new IllegalStateException("账户已被锁定，请在 900 秒后重试"));
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("账户已被锁定，请在 900 秒后重试"));
        
        verify(authService, times(1)).login("lockeduser", "password123");
    }
    
    @Test
    @DisplayName("登录失败 - 账户已禁用")
    void loginFailureAccountDisabled() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("disableduser");
        loginRequest.setPassword("password123");
        
        // 模拟服务层抛出异常
        when(authService.login("disableduser", "password123"))
                .thenThrow(new IllegalStateException("账户已被禁用"));
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("账户已被禁用"));
        
        verify(authService, times(1)).login("disableduser", "password123");
    }
    
    @Test
    @DisplayName("登录失败 - 用户名为空")
    void loginFailureEmptyUsername() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("");
        loginRequest.setPassword("password123");
        
        // 执行请求并验证（参数验证失败，不会调用服务层）
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
        
        // 验证服务方法未被调用
        verify(authService, never()).login(anyString(), anyString());
    }
    
    @Test
    @DisplayName("登录失败 - 密码为空")
    void loginFailureEmptyPassword() throws Exception {
        // 准备测试数据
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("");
        
        // 执行请求并验证（参数验证失败，不会调用服务层）
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
        
        // 验证服务方法未被调用
        verify(authService, never()).login(anyString(), anyString());
    }
    
    @Test
    @DisplayName("登出成功")
    void logoutSuccess() throws Exception {
        // 模拟服务层行为（void方法，不需要返回值）
        doNothing().when(authService).logout(1L);
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/logout")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"));
        
        // 验证服务方法被调用
        verify(authService, times(1)).logout(1L);
    }
    
    @Test
    @DisplayName("登出失败 - 服务异常")
    void logoutFailureServiceException() throws Exception {
        // 模拟服务层抛出异常
        doThrow(new RuntimeException("Redis连接失败"))
                .when(authService).logout(1L);
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/logout")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("登出失败：Redis连接失败"));
        
        verify(authService, times(1)).logout(1L);
    }
    
    @Test
    @DisplayName("刷新令牌成功")
    void refreshTokenSuccess() throws Exception {
        // 模拟服务层行为
        when(authService.refreshToken("old-token"))
                .thenReturn("new-token");
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer old-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"))
                .andExpect(jsonPath("$.data").value("new-token"));
        
        // 验证服务方法被调用
        verify(authService, times(1)).refreshToken("old-token");
    }
    
    @Test
    @DisplayName("刷新令牌失败 - 令牌格式错误（缺少Bearer前缀）")
    void refreshTokenFailureInvalidFormat() throws Exception {
        // 执行请求并验证
        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "old-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("令牌格式错误"));
        
        // 验证服务方法未被调用
        verify(authService, never()).refreshToken(anyString());
    }
    
    @Test
    @DisplayName("刷新令牌失败 - 缺少Authorization头")
    void refreshTokenFailureMissingHeader() throws Exception {
        // 执行请求并验证
        mockMvc.perform(post("/auth/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("令牌格式错误"));
        
        // 验证服务方法未被调用
        verify(authService, never()).refreshToken(anyString());
    }
    
    @Test
    @DisplayName("刷新令牌失败 - 令牌无效")
    void refreshTokenFailureInvalidToken() throws Exception {
        // 模拟服务层抛出异常
        when(authService.refreshToken("invalid-token"))
                .thenThrow(new IllegalArgumentException("令牌无效"));
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("令牌无效"));
        
        verify(authService, times(1)).refreshToken("invalid-token");
    }
    
    @Test
    @DisplayName("刷新令牌失败 - 令牌已失效")
    void refreshTokenFailureExpiredToken() throws Exception {
        // 模拟服务层抛出异常
        when(authService.refreshToken("expired-token"))
                .thenThrow(new IllegalArgumentException("令牌已失效"));
        
        // 执行请求并验证
        mockMvc.perform(post("/auth/refresh")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("令牌已失效"));
        
        verify(authService, times(1)).refreshToken("expired-token");
    }
}
