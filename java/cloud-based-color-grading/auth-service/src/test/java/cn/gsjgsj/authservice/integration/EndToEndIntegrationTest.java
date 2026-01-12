package cn.gsjgsj.authservice.integration;

import cn.gsjgsj.authservice.AuthServiceApplication;
import cn.gsjgsj.common.dto.LoginRequest;
import cn.gsjgsj.common.dto.LoginResponse;
import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 端到端集成测试
 * 测试完整的登录流程、令牌验证和权限检查流程、用户管理流程
 * 使用TestContainers启动Redis和MySQL
 * 
 * 验证需求：所有需求
 */
@SpringBootTest(
    classes = AuthServiceApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class EndToEndIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    // MySQL容器
    @Container
    static MySQLContainer<?> mysqlContainer = new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
            .withDatabaseName("cloud_color_grading")
            .withUsername("test")
            .withPassword("test")
            .withInitScript("schema.sql");

    // Redis容器
    @Container
    static GenericContainer<?> redisContainer = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // 配置MySQL连接
        registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
        registry.add("spring.datasource.username", mysqlContainer::getUsername);
        registry.add("spring.datasource.password", mysqlContainer::getPassword);

        // 配置Redis连接
        registry.add("spring.data.redis.host", redisContainer::getHost);
        registry.add("spring.data.redis.port", () -> redisContainer.getMappedPort(6379));
        registry.add("spring.data.redis.password", () -> "");

        // 禁用Nacos服务发现（集成测试不需要）
        registry.add("spring.cloud.nacos.discovery.enabled", () -> "false");
    }

    private String baseUrl() {
        return "http://localhost:" + port;
    }

    @BeforeEach
    void setUp() {
        // 清理数据库
        jdbcTemplate.execute("DELETE FROM sys_user_role");
        jdbcTemplate.execute("DELETE FROM sys_role_permission");
        jdbcTemplate.execute("DELETE FROM sys_menu_permission");
        jdbcTemplate.execute("DELETE FROM sys_user");
        jdbcTemplate.execute("DELETE FROM sys_role");
        jdbcTemplate.execute("DELETE FROM sys_permission");
        jdbcTemplate.execute("DELETE FROM sys_menu");

        // 清理Redis
        redisTemplate.getConnectionFactory().getConnection().flushAll();
    }

    /**
     * 测试1：完整的用户注册和登录流程
     * 验证需求：1.1, 1.2, 1.3, 1.5
     */
    @Test
    @Order(1)
    @DisplayName("测试完整的用户注册和登录流程")
    void testCompleteLoginFlow() {
        // 步骤1：创建用户
        User newUser = new User();
        newUser.setUsername("testuser");
        newUser.setPassword("password123");
        newUser.setNickname("Test User");
        newUser.setEmail("test@example.com");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<User> createRequest = new HttpEntity<>(newUser, headers);

        ResponseEntity<Result<User>> createResponse = restTemplate.exchange(
                baseUrl() + "/users",
                HttpMethod.POST,
                createRequest,
                new ParameterizedTypeReference<Result<User>>() {}
        );

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(createResponse.getBody()).isNotNull();
        assertThat(createResponse.getBody().getCode()).isEqualTo(200);
        assertThat(createResponse.getBody().getData()).isNotNull();
        assertThat(createResponse.getBody().getData().getUsername()).isEqualTo("testuser");

        // 步骤2：用户登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

        ResponseEntity<Result<LoginResponse>> loginResponse = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().getCode()).isEqualTo(200);
        
        LoginResponse loginData = loginResponse.getBody().getData();
        assertThat(loginData).isNotNull();
        assertThat(loginData.getToken()).isNotBlank();
        assertThat(loginData.getUserId()).isNotNull();
        assertThat(loginData.getUsername()).isEqualTo("testuser");

        // 步骤3：验证令牌存储在Redis中
        Long userId = loginData.getUserId();
        String redisKey = "token:" + userId;
        String tokenInRedis = redisTemplate.opsForValue().get(redisKey);
        assertThat(tokenInRedis).isNotNull();
        assertThat(tokenInRedis).isEqualTo(loginData.getToken());
    }

    /**
     * 测试2：登录失败和账户锁定流程
     * 验证需求：1.2, 1.4
     */
    @Test
    @Order(2)
    @DisplayName("测试登录失败和账户锁定流程")
    void testLoginFailureAndAccountLock() {
        // 创建测试用户
        createTestUser("locktest", "password123");

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("locktest");
        loginRequest.setPassword("wrongpassword");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

        // 尝试5次错误登录
        for (int i = 0; i < 5; i++) {
            ResponseEntity<Result<LoginResponse>> response = restTemplate.exchange(
                    baseUrl() + "/auth/login",
                    HttpMethod.POST,
                    loginEntity,
                    new ParameterizedTypeReference<Result<LoginResponse>>() {}
            );

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getCode()).isEqualTo(401);
        }

        // 第6次尝试应该返回账户锁定错误
        ResponseEntity<Result<LoginResponse>> lockedResponse = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(lockedResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(lockedResponse.getBody()).isNotNull();
        assertThat(lockedResponse.getBody().getCode()).isEqualTo(403);
        assertThat(lockedResponse.getBody().getMessage()).contains("账户已被锁定");

        // 验证Redis中存在锁定标记
        String lockKey = "account:locked:locktest";
        String lockValue = redisTemplate.opsForValue().get(lockKey);
        assertThat(lockValue).isNotNull();
    }

    /**
     * 测试3：令牌刷新流程
     * 验证需求：2.4, 2.5
     */
    @Test
    @Order(3)
    @DisplayName("测试令牌刷新流程")
    void testTokenRefreshFlow() {
        // 创建用户并登录
        String token = loginAndGetToken("refreshtest", "password123");

        // 刷新令牌
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<Void> refreshRequest = new HttpEntity<>(headers);

        ResponseEntity<Result<String>> refreshResponse = restTemplate.exchange(
                baseUrl() + "/auth/refresh",
                HttpMethod.POST,
                refreshRequest,
                new ParameterizedTypeReference<Result<String>>() {}
        );

        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshResponse.getBody()).isNotNull();
        assertThat(refreshResponse.getBody().getCode()).isEqualTo(200);
        
        String newToken = refreshResponse.getBody().getData();
        assertThat(newToken).isNotBlank();
        assertThat(newToken).isNotEqualTo(token);
    }

    /**
     * 测试4：用户登出流程
     * 验证需求：2.5
     */
    @Test
    @Order(4)
    @DisplayName("测试用户登出流程")
    void testLogoutFlow() {
        // 创建用户并登录
        LoginResponse loginData = loginAndGetFullResponse("logouttest", "password123");
        String token = loginData.getToken();
        Long userId = loginData.getUserId();

        // 验证令牌在Redis中存在
        String redisKey = "token:" + userId;
        assertThat(redisTemplate.opsForValue().get(redisKey)).isNotNull();

        // 登出
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        HttpEntity<Void> logoutRequest = new HttpEntity<>(headers);

        ResponseEntity<Result<Void>> logoutResponse = restTemplate.exchange(
                baseUrl() + "/auth/logout",
                HttpMethod.POST,
                logoutRequest,
                new ParameterizedTypeReference<Result<Void>>() {}
        );

        assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(logoutResponse.getBody()).isNotNull();
        assertThat(logoutResponse.getBody().getCode()).isEqualTo(200);

        // 验证令牌已从Redis中删除
        assertThat(redisTemplate.opsForValue().get(redisKey)).isNull();
    }

    /**
     * 测试5：用户管理流程 - 查询用户列表
     * 验证需求：8.2
     */
    @Test
    @Order(5)
    @DisplayName("测试用户管理流程 - 查询用户列表")
    void testUserManagementQueryFlow() {
        // 创建多个测试用户
        createTestUser("user1", "password123");
        createTestUser("user2", "password123");
        createTestUser("user3", "password123");

        // 查询用户列表
        ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl() + "/users?current=1&size=10",
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).contains("user1");
        assertThat(response.getBody()).contains("user2");
        assertThat(response.getBody()).contains("user3");
    }

    /**
     * 测试6：用户管理流程 - 更新用户信息
     * 验证需求：8.3
     */
    @Test
    @Order(6)
    @DisplayName("测试用户管理流程 - 更新用户信息")
    void testUserManagementUpdateFlow() {
        // 创建测试用户
        Long userId = createTestUser("updatetest", "password123");

        // 更新用户信息
        User updateUser = new User();
        updateUser.setNickname("Updated Nickname");
        updateUser.setEmail("updated@example.com");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<User> updateRequest = new HttpEntity<>(updateUser, headers);

        ResponseEntity<Result<User>> updateResponse = restTemplate.exchange(
                baseUrl() + "/users/" + userId,
                HttpMethod.PUT,
                updateRequest,
                new ParameterizedTypeReference<Result<User>>() {}
        );

        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody()).isNotNull();
        assertThat(updateResponse.getBody().getCode()).isEqualTo(200);
        assertThat(updateResponse.getBody().getData().getNickname()).isEqualTo("Updated Nickname");
        assertThat(updateResponse.getBody().getData().getEmail()).isEqualTo("updated@example.com");
    }

    /**
     * 测试7：用户管理流程 - 禁用用户
     * 验证需求：8.3
     */
    @Test
    @Order(7)
    @DisplayName("测试用户管理流程 - 禁用用户")
    void testUserManagementDisableFlow() {
        // 创建用户并登录
        LoginResponse loginData = loginAndGetFullResponse("disabletest", "password123");
        Long userId = loginData.getUserId();

        // 验证令牌在Redis中存在
        String redisKey = "token:" + userId;
        assertThat(redisTemplate.opsForValue().get(redisKey)).isNotNull();

        // 禁用用户
        ResponseEntity<Result<Void>> disableResponse = restTemplate.exchange(
                baseUrl() + "/users/" + userId,
                HttpMethod.DELETE,
                null,
                new ParameterizedTypeReference<Result<Void>>() {}
        );

        assertThat(disableResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(disableResponse.getBody()).isNotNull();
        assertThat(disableResponse.getBody().getCode()).isEqualTo(200);

        // 验证令牌已从Redis中删除
        assertThat(redisTemplate.opsForValue().get(redisKey)).isNull();

        // 验证用户状态已更新为禁用
        Integer status = jdbcTemplate.queryForObject(
                "SELECT status FROM sys_user WHERE id = ?",
                Integer.class,
                userId
        );
        assertThat(status).isEqualTo(1);
    }

    /**
     * 测试8：用户管理流程 - 重置密码
     * 验证需求：8.4
     */
    @Test
    @Order(8)
    @DisplayName("测试用户管理流程 - 重置密码")
    void testUserManagementResetPasswordFlow() {
        // 创建用户并登录
        LoginResponse loginData = loginAndGetFullResponse("resettest", "password123");
        Long userId = loginData.getUserId();
        String oldToken = loginData.getToken();

        // 验证旧令牌在Redis中存在
        String redisKey = "token:" + userId;
        assertThat(redisTemplate.opsForValue().get(redisKey)).isEqualTo(oldToken);

        // 重置密码
        ResponseEntity<Result<String>> resetResponse = restTemplate.exchange(
                baseUrl() + "/users/" + userId + "/reset-password",
                HttpMethod.POST,
                null,
                new ParameterizedTypeReference<Result<String>>() {}
        );

        assertThat(resetResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resetResponse.getBody()).isNotNull();
        assertThat(resetResponse.getBody().getCode()).isEqualTo(200);
        
        String tempPassword = resetResponse.getBody().getData();
        assertThat(tempPassword).isNotBlank();
        assertThat(tempPassword).hasSize(8);

        // 验证旧令牌已从Redis中删除
        assertThat(redisTemplate.opsForValue().get(redisKey)).isNull();

        // 使用新密码登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("resettest");
        loginRequest.setPassword(tempPassword);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

        ResponseEntity<Result<LoginResponse>> loginResponse = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().getCode()).isEqualTo(200);
        assertThat(loginResponse.getBody().getData().getToken()).isNotBlank();
    }

    /**
     * 测试9：用户名唯一性验证
     * 验证需求：8.1
     */
    @Test
    @Order(9)
    @DisplayName("测试用户名唯一性验证")
    void testUsernameUniqueness() {
        // 创建第一个用户
        createTestUser("uniquetest", "password123");

        // 尝试创建同名用户
        User duplicateUser = new User();
        duplicateUser.setUsername("uniquetest");
        duplicateUser.setPassword("password456");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<User> createRequest = new HttpEntity<>(duplicateUser, headers);

        ResponseEntity<Result<User>> response = restTemplate.exchange(
                baseUrl() + "/users",
                HttpMethod.POST,
                createRequest,
                new ParameterizedTypeReference<Result<User>>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).contains("用户名已存在");
    }

    /**
     * 测试10：无效凭证登录
     * 验证需求：1.2
     */
    @Test
    @Order(10)
    @DisplayName("测试无效凭证登录")
    void testInvalidCredentialsLogin() {
        // 创建测试用户
        createTestUser("validuser", "password123");

        // 使用错误密码登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("validuser");
        loginRequest.setPassword("wrongpassword");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

        ResponseEntity<Result<LoginResponse>> response = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(401);
        assertThat(response.getBody().getMessage()).contains("用户名或密码错误");

        // 使用不存在的用户名登录
        loginRequest.setUsername("nonexistentuser");
        loginRequest.setPassword("password123");
        loginEntity = new HttpEntity<>(loginRequest, headers);

        response = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(401);
    }

    // ==================== 辅助方法 ====================

    /**
     * 创建测试用户
     */
    private Long createTestUser(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setNickname(username);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<User> request = new HttpEntity<>(user, headers);

        ResponseEntity<Result<User>> response = restTemplate.exchange(
                baseUrl() + "/users",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<Result<User>>() {}
        );

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isNotNull();
        return response.getBody().getData().getId();
    }

    /**
     * 登录并获取令牌
     */
    private String loginAndGetToken(String username, String password) {
        return loginAndGetFullResponse(username, password).getToken();
    }

    /**
     * 登录并获取完整响应
     */
    private LoginResponse loginAndGetFullResponse(String username, String password) {
        // 先创建用户
        createTestUser(username, password);

        // 登录
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<LoginRequest> loginEntity = new HttpEntity<>(loginRequest, headers);

        ResponseEntity<Result<LoginResponse>> response = restTemplate.exchange(
                baseUrl() + "/auth/login",
                HttpMethod.POST,
                loginEntity,
                new ParameterizedTypeReference<Result<LoginResponse>>() {}
        );

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isNotNull();
        return response.getBody().getData();
    }
}
