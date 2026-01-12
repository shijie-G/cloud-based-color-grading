package cn.gsjgsj.authservice.controller;

import cn.gsjgsj.authservice.mapper.UserMapper;
import cn.gsjgsj.authservice.service.UserService;
import cn.gsjgsj.common.entity.User;
import cn.gsjgsj.common.service.RedisService;
import com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserController 单元测试
 * 测试用户管理接口：创建、查询、更新、禁用和密码重置
 */
@WebMvcTest(UserController.class)
@EnableAutoConfiguration(exclude = {
    MybatisPlusAutoConfiguration.class,
    DataSourceAutoConfiguration.class
})
@DisplayName("UserController 单元测试")
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private UserService userService;
    
    @MockBean
    private RedisService redisService;
    
    @MockBean
    private UserMapper userMapper;
    
    private User mockUser;
    
    @BeforeEach
    void setUp() {
        // 准备模拟用户数据
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");
        mockUser.setPassword("$2a$10$encrypted_password");
        mockUser.setNickname("Test User");
        mockUser.setEmail("test@example.com");
        mockUser.setPhone("13800138000");
        mockUser.setStatus(0);
        mockUser.setCreateTime(LocalDateTime.now());
    }
    
    // ==================== 创建用户测试 ====================
    
    @Test
    @DisplayName("创建用户成功")
    void createUserSuccess() throws Exception {
        // 准备测试数据
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("password123");
        newUser.setNickname("New User");
        newUser.setEmail("new@example.com");
        
        // 模拟服务层行为
        when(userService.isUsernameExists("newuser")).thenReturn(false);
        when(userService.createUser(any())).thenReturn(true);
        
        // 执行请求并验证
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"))
                .andExpect(jsonPath("$.data.username").value("newuser"))
                .andExpect(jsonPath("$.data.nickname").value("New User"))
                .andExpect(jsonPath("$.data.password").doesNotExist()); // 不应返回密码
        
        // 验证服务方法被调用
        verify(userService, times(1)).isUsernameExists("newuser");
        verify(userService, times(1)).createUser(any());
    }
    
    @Test
    @DisplayName("创建用户失败 - 用户名已存在")
    void createUserFailureUsernameExists() throws Exception {
        // 准备测试数据
        User newUser = new User();
        newUser.setUsername("existinguser");
        newUser.setPassword("password123");
        
        // 模拟服务层行为
        when(userService.isUsernameExists("existinguser")).thenReturn(true);
        
        // 执行请求并验证
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
        
        // 验证服务方法被调用
        verify(userService, times(1)).isUsernameExists("existinguser");
        verify(userService, never()).createUser(any());
    }
    
    @Test
    @DisplayName("创建用户失败 - 用户名为空")
    void createUserFailureEmptyUsername() throws Exception {
        // 准备测试数据
        User newUser = new User();
        newUser.setUsername("");
        newUser.setPassword("password123");
        
        // 执行请求并验证
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名不能为空"));
        
        // 验证服务方法未被调用
        verify(userService, never()).isUsernameExists(anyString());
        verify(userService, never()).createUser(any());
    }
    
    @Test
    @DisplayName("创建用户失败 - 密码为空")
    void createUserFailureEmptyPassword() throws Exception {
        // 准备测试数据
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setPassword("");
        
        // 执行请求并验证
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("密码不能为空"));
        
        // 验证服务方法未被调用
        verify(userService, never()).isUsernameExists(anyString());
        verify(userService, never()).createUser(any());
    }
    
    // ==================== 查询用户列表测试 ====================
    
    @Test
    @DisplayName("查询用户列表成功 - 无筛选条件")
    void getUserListSuccess() throws Exception {
        // 准备测试数据
        Page<User> page = new Page<>(1, 10);
        List<User> users = new ArrayList<>();
        users.add(mockUser);
        page.setRecords(users);
        page.setTotal(1);
        
        // 模拟服务层行为
        when(userService.getUserList(any(), isNull())).thenReturn(page);
        
        // 执行请求并验证
        mockMvc.perform(get("/users")
                        .param("current", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records[0].username").value("testuser"))
                .andExpect(jsonPath("$.data.records[0].password").doesNotExist()) // 不应返回密码
                .andExpect(jsonPath("$.data.total").value(1));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserList(any(), isNull());
    }
    
    @Test
    @DisplayName("查询用户列表成功 - 按用户名筛选")
    void getUserListSuccessWithUsernameFilter() throws Exception {
        // 准备测试数据
        Page<User> page = new Page<>(1, 10);
        List<User> users = new ArrayList<>();
        users.add(mockUser);
        page.setRecords(users);
        page.setTotal(1);
        
        // 模拟服务层行为
        when(userService.getUserList(any(), eq("test"))).thenReturn(page);
        
        // 执行请求并验证
        mockMvc.perform(get("/users")
                        .param("current", "1")
                        .param("size", "10")
                        .param("username", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records[0].username").value("testuser"))
                .andExpect(jsonPath("$.data.total").value(1));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserList(any(), eq("test"));
    }
    
    // ==================== 更新用户测试 ====================
    
    @Test
    @DisplayName("更新用户成功 - 不修改密码")
    void updateUserSuccessWithoutPassword() throws Exception {
        // 准备测试数据
        User updateUser = new User();
        updateUser.setNickname("Updated Nickname");
        updateUser.setEmail("updated@example.com");
        
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setUsername("testuser");
        updatedUser.setNickname("Updated Nickname");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setStatus(0);
        
        // 模拟服务层行为
        when(userService.getUserById(1L)).thenReturn(mockUser, updatedUser);
        when(userService.updateUser(any())).thenReturn(true);
        
        // 执行请求并验证
        mockMvc.perform(put("/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.nickname").value("Updated Nickname"))
                .andExpect(jsonPath("$.data.email").value("updated@example.com"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
        
        // 验证服务方法被调用
        verify(userService, times(2)).getUserById(1L);
        verify(userService, times(1)).updateUser(any());
        verify(redisService, never()).deleteToken(anyLong());
    }
    
    @Test
    @DisplayName("更新用户成功 - 修改密码后令牌失效")
    void updateUserSuccessWithPasswordChange() throws Exception {
        // 准备测试数据
        User updateUser = new User();
        updateUser.setPassword("newpassword123");
        
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setUsername("testuser");
        updatedUser.setStatus(0);
        
        // 模拟服务层行为
        when(userService.getUserById(1L)).thenReturn(mockUser, updatedUser);
        when(userService.updateUser(any())).thenReturn(true);
        doNothing().when(redisService).deleteToken(1L);
        
        // 执行请求并验证
        mockMvc.perform(put("/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.password").doesNotExist());
        
        // 验证服务方法被调用
        verify(userService, times(2)).getUserById(1L);
        verify(userService, times(1)).updateUser(any());
        verify(redisService, times(1)).deleteToken(1L); // 修改密码后应使令牌失效
    }
    
    @Test
    @DisplayName("更新用户失败 - 用户不存在")
    void updateUserFailureUserNotFound() throws Exception {
        // 准备测试数据
        User updateUser = new User();
        updateUser.setNickname("Updated Nickname");
        
        // 模拟服务层行为
        when(userService.getUserById(999L)).thenReturn(null);
        
        // 执行请求并验证
        mockMvc.perform(put("/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("用户不存在"));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserById(999L);
        verify(userService, never()).updateUser(any());
    }
    
    // ==================== 禁用用户测试 ====================
    
    @Test
    @DisplayName("禁用用户成功 - 令牌失效")
    void disableUserSuccess() throws Exception {
        // 模拟服务层行为
        when(userService.getUserById(1L)).thenReturn(mockUser);
        when(userService.disableUser(1L)).thenReturn(true);
        doNothing().when(redisService).deleteToken(1L);
        doNothing().when(redisService).clearPermissions(1L);
        
        // 执行请求并验证
        mockMvc.perform(delete("/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserById(1L);
        verify(userService, times(1)).disableUser(1L);
        verify(redisService, times(1)).deleteToken(1L); // 禁用用户后应使令牌失效
        verify(redisService, times(1)).clearPermissions(1L); // 清除权限缓存
    }
    
    @Test
    @DisplayName("禁用用户失败 - 用户不存在")
    void disableUserFailureUserNotFound() throws Exception {
        // 模拟服务层行为
        when(userService.getUserById(999L)).thenReturn(null);
        
        // 执行请求并验证
        mockMvc.perform(delete("/users/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("用户不存在"));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserById(999L);
        verify(userService, never()).disableUser(anyLong());
        verify(redisService, never()).deleteToken(anyLong());
    }
    
    // ==================== 重置密码测试 ====================
    
    @Test
    @DisplayName("重置密码成功 - 返回临时密码并使令牌失效")
    void resetPasswordSuccess() throws Exception {
        // 模拟服务层行为
        when(userService.getUserById(1L)).thenReturn(mockUser);
        when(userService.updateUser(any())).thenReturn(true);
        doNothing().when(redisService).deleteToken(1L);
        
        // 执行请求并验证
        mockMvc.perform(post("/users/1/reset-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isString())
                .andExpect(jsonPath("$.data").value(hasLength(8))); // 临时密码应为8位
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserById(1L);
        verify(userService, times(1)).updateUser(any());
        verify(redisService, times(1)).deleteToken(1L); // 重置密码后应使令牌失效
    }
    
    @Test
    @DisplayName("重置密码失败 - 用户不存在")
    void resetPasswordFailureUserNotFound() throws Exception {
        // 模拟服务层行为
        when(userService.getUserById(999L)).thenReturn(null);
        
        // 执行请求并验证
        mockMvc.perform(post("/users/999/reset-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("用户不存在"));
        
        // 验证服务方法被调用
        verify(userService, times(1)).getUserById(999L);
        verify(userService, never()).updateUser(any());
        verify(redisService, never()).deleteToken(anyLong());
    }
}
