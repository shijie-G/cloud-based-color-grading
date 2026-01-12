# AuthController 测试说明

## 测试类：AuthControllerTest

### 测试覆盖范围

这个测试类为 `AuthController` 提供了全面的单元测试，覆盖了以下场景：

#### 1. 登录接口测试 (POST /auth/login)

**成功场景：**
- ✅ `loginSuccess()` - 登录成功，返回令牌和用户信息

**失败场景：**
- ✅ `loginFailureInvalidCredentials()` - 用户名或密码错误（返回 401）
- ✅ `loginFailureAccountLocked()` - 账户被锁定（返回 403）
- ✅ `loginFailureAccountDisabled()` - 账户已禁用（返回 403）
- ✅ `loginFailureEmptyUsername()` - 用户名为空（参数验证失败，返回 400）
- ✅ `loginFailureEmptyPassword()` - 密码为空（参数验证失败，返回 400）

#### 2. 登出接口测试 (POST /auth/logout)

**成功场景：**
- ✅ `logoutSuccess()` - 登出成功

**失败场景：**
- ✅ `logoutFailureServiceException()` - 服务异常（返回 500）

#### 3. 刷新令牌接口测试 (POST /auth/refresh)

**成功场景：**
- ✅ `refreshTokenSuccess()` - 刷新令牌成功，返回新令牌

**失败场景：**
- ✅ `refreshTokenFailureInvalidFormat()` - 令牌格式错误（缺少 Bearer 前缀，返回 401）
- ✅ `refreshTokenFailureMissingHeader()` - 缺少 Authorization 头（返回 401）
- ✅ `refreshTokenFailureInvalidToken()` - 令牌无效（返回 401）
- ✅ `refreshTokenFailureExpiredToken()` - 令牌已失效（返回 401）

### 测试技术栈

- **测试框架**: JUnit 5
- **Mock 框架**: Mockito (通过 Spring Boot Test)
- **Web 测试**: MockMvc (Spring MVC Test)
- **断言库**: Hamcrest + AssertJ

### 测试特点

1. **使用 @WebMvcTest 注解**：只加载 Web 层，不加载完整的 Spring 上下文，测试速度快
2. **Mock 服务层**：使用 @MockBean 模拟 AuthService，隔离测试
3. **完整的场景覆盖**：包括成功和各种失败场景
4. **参数验证测试**：验证 @Valid 注解的参数验证功能
5. **错误处理测试**：验证各种异常的正确处理和响应码

### 运行测试

#### 使用 Maven 运行单个测试类：
```bash
mvn test -Dtest=AuthControllerTest
```

#### 使用 Maven 运行所有测试：
```bash
mvn test
```

#### 在 IDE 中运行：
- IntelliJ IDEA: 右键点击测试类 → Run 'AuthControllerTest'
- Eclipse: 右键点击测试类 → Run As → JUnit Test

### 验证需求

这些测试验证了以下需求：
- **需求 1.1**: 用户提交有效的用户名和密码，验证凭证并生成 JWT Token
- **需求 1.2**: 用户提交无效的用户名或密码，返回认证失败错误
- **需求 2.4**: JWT Token 即将过期且用户活跃时，自动刷新令牌
- **需求 2.5**: 用户主动登出，从 Redis Cache 中删除 JWT Token

### 测试数据

测试使用模拟数据，不依赖真实的数据库或 Redis：
- 用户名: testuser, lockeduser, disableduser
- 密码: password123, wrongpassword
- 令牌: mock-jwt-token, old-token, new-token, invalid-token, expired-token
- 用户ID: 1L

### 注意事项

1. 这是单元测试，不是集成测试，因此不需要启动 Redis 或 MySQL
2. 所有的依赖都被 Mock，测试速度非常快
3. 测试关注的是 Controller 层的逻辑：参数验证、异常处理、响应格式
4. 服务层的业务逻辑由其他测试类（如 LoginFailureCountPropertyTest）覆盖

