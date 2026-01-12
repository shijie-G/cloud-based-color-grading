# 单元测试注意事项

## MyBatis 自动配置问题

### 问题描述

在运行 `AuthControllerTest` 单元测试时，可能会遇到以下错误：

```
org.springframework.beans.factory.BeanCreationException: 
Error creating bean with name 'userMapper' defined in file [.../UserMapper.class]: 
Property 'sqlSessionFactory' or 'sqlSessionTemplate' are required
```

### 原因分析

1. **@WebMvcTest 的行为**:
   - `@WebMvcTest` 是一个切片测试注解，只加载 Web 层组件
   - 它会扫描 `@Controller`、`@RestController` 等注解
   - 但它也会触发某些自动配置

2. **MyBatis-Plus 自动配置**:
   - Spring Boot 检测到 MyBatis-Plus 依赖后，会自动配置 MyBatis-Plus
   - 自动配置会扫描 `@Mapper` 注解的接口
   - 尝试创建 Mapper bean，但需要 `sqlSessionFactory`

3. **冲突**:
   - `@WebMvcTest` 不会配置数据源和 `sqlSessionFactory`
   - 但 MyBatis-Plus 自动配置仍然尝试创建 Mapper bean
   - 导致 bean 创建失败

### 解决方案

在测试类上添加 `@EnableAutoConfiguration` 注解，排除 MyBatis-Plus 和数据源自动配置：

```java
@WebMvcTest(AuthController.class)
@EnableAutoConfiguration(exclude = {
    MybatisPlusAutoConfiguration.class,
    DataSourceAutoConfiguration.class
})
@DisplayName("AuthController 单元测试")
class AuthControllerTest {
    // ...
}
```

**注意**: 项目使用的是 MyBatis-Plus，不是原生 MyBatis，所以要排除 `MybatisPlusAutoConfiguration` 而不是 `MybatisAutoConfiguration`。

### 为什么这样做是正确的

1. **单元测试的目的**:
   - 单元测试只测试 Controller 层
   - 不需要真实的数据库连接
   - 不需要 MyBatis Mapper

2. **依赖隔离**:
   - 使用 `@MockBean` 模拟 `AuthService`
   - `AuthService` 内部使用的 Mapper 也被隔离
   - 测试完全独立于数据访问层

3. **测试速度**:
   - 不加载数据库相关配置，测试启动更快
   - 不需要连接数据库，测试执行更快

### 其他可能的解决方案

#### 方案 1: 使用 @SpringBootTest（不推荐）
```java
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {
    // ...
}
```
**缺点**: 
- 加载完整的 Spring 上下文，测试变慢
- 需要配置数据源，增加测试复杂度
- 不是真正的单元测试

#### 方案 2: 配置测试数据源（不推荐）
```java
@WebMvcTest(AuthController.class)
@AutoConfigureTestDatabase
class AuthControllerTest {
    // ...
}
```
**缺点**:
- 仍然需要数据库配置
- 增加测试依赖
- 违反单元测试原则

#### 方案 3: 排除 MyBatis-Plus 自动配置（推荐，当前方案）
```java
@WebMvcTest(AuthController.class)
@EnableAutoConfiguration(exclude = {
    MybatisPlusAutoConfiguration.class,
    DataSourceAutoConfiguration.class
})
class AuthControllerTest {
    // ...
}
```
**优点**:
- 保持单元测试的纯粹性
- 不需要数据库配置
- 测试速度快
- 依赖隔离清晰

## @WebMvcTest 最佳实践

### 1. 只测试 Web 层

```java
@WebMvcTest(AuthController.class)  // 只加载 AuthController
class AuthControllerTest {
    @MockBean
    private AuthService authService;  // Mock 服务层
}
```

### 2. 排除不需要的自动配置

```java
@EnableAutoConfiguration(exclude = {
    MybatisPlusAutoConfiguration.class,  // 排除 MyBatis-Plus
    DataSourceAutoConfiguration.class,   // 排除数据源
    RedisAutoConfiguration.class         // 排除 Redis（如果需要）
})
```

### 3. 使用 MockMvc 测试 HTTP 请求

```java
@Autowired
private MockMvc mockMvc;

@Test
void testLogin() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"test\",\"password\":\"pass\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value(200));
}
```

### 4. Mock 所有外部依赖

```java
@MockBean
private AuthService authService;

@BeforeEach
void setUp() {
    when(authService.login(anyString(), anyString()))
        .thenReturn(mockLoginResponse);
}
```

## 单元测试 vs 集成测试

### 单元测试 (AuthControllerTest)
- **目的**: 测试 Controller 层逻辑
- **范围**: 只测试一个类
- **依赖**: 使用 Mock 对象
- **速度**: 非常快（< 1 秒）
- **配置**: 最小化配置
- **适用场景**: 开发过程中的快速反馈

### 集成测试 (AuthControllerIntegrationTest)
- **目的**: 测试完整的系统交互
- **范围**: 测试多个层次
- **依赖**: 使用真实的外部服务
- **速度**: 较慢（需要启动 Spring 上下文）
- **配置**: 完整配置
- **适用场景**: 发布前的完整验证

## 常见错误和解决方案

### 错误 1: Bean 创建失败
```
Error creating bean with name 'xxx'
```
**解决方案**: 检查是否需要排除某些自动配置

### 错误 2: 找不到 Bean
```
No qualifying bean of type 'xxx' available
```
**解决方案**: 添加 `@MockBean` 注解

### 错误 3: 参数验证失败
```
MethodArgumentNotValidException
```
**解决方案**: 检查请求参数是否符合 `@Valid` 验证规则

### 错误 4: JSON 解析失败
```
HttpMessageNotReadableException
```
**解决方案**: 检查 JSON 格式是否正确

## 测试覆盖率

### 目标
- 行覆盖率: > 80%
- 分支覆盖率: > 70%
- 方法覆盖率: 100%

### 如何提高覆盖率
1. 测试所有公共方法
2. 测试所有分支（if/else）
3. 测试异常情况
4. 测试边界条件

### 覆盖率工具
- JaCoCo: Maven 插件
- IntelliJ IDEA: 内置覆盖率工具
- SonarQube: 代码质量平台

## 参考资料

- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [@WebMvcTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html)
- [MockMvc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/MockMvc.html)
- [Mockito](https://site.mockito.org/)

