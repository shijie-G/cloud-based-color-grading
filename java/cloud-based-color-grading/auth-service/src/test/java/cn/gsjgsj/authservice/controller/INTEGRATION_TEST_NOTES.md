# 集成测试注意事项

## 刷新令牌测试的时间问题

### 问题描述

在 `refreshTokenFlow()` 测试中，我们遇到了一个有趣的问题：新令牌和旧令牌可能完全相同。

### 原因分析

JWT 令牌包含以下信息：
```json
{
  "sub": "username",
  "userId": 123,
  "username": "testuser",
  "roles": [],
  "iat": 1768213179,  // 签发时间（秒级时间戳）
  "exp": 1768220379   // 过期时间（秒级时间戳）
}
```

关键点：
1. **时间戳精度为秒**: JWT 标准使用秒级时间戳（Unix timestamp）
2. **相同输入 = 相同输出**: 如果所有输入参数相同（用户ID、用户名、角色、时间戳），生成的令牌就完全相同
3. **快速执行**: 测试代码执行速度很快，登录和刷新可能在同一秒内完成

### 示例

```java
// 时间: 2026-01-12 18:19:39.473
String oldToken = jwtTokenProvider.generateToken(5L, "integrationtest", []);
// 令牌: eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJpbnRlZ3JhdGlvbnRlc3QiLCJ1c2VySWQiOjUsInVzZXJuYW1lIjoiaW50ZWdyYXRpb250ZXN0Iiwicm9sZXMiOltdLCJpYXQiOjE3NjgyMTMxNzksImV4cCI6MTc2ODIyMDM3OX0...

// 时间: 2026-01-12 18:19:39.761（仍然是同一秒）
String newToken = jwtTokenProvider.generateToken(5L, "integrationtest", []);
// 令牌: eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJpbnRlZ3JhdGlvbnRlc3QiLCJ1c2VySWQiOjUsInVzZXJuYW1lIjoiaW50ZWdyYXRpb250ZXN0Iiwicm9sZXMiOltdLCJpYXQiOjE3NjgyMTMxNzksImV4cCI6MTc2ODIyMDM3OX0...
// 完全相同！因为 iat 和 exp 都是秒级，473ms 和 761ms 都被截断为同一秒
```

### 解决方案

在登录和刷新之间添加延迟，确保时间戳不同：

```java
// 1. 登录
String oldToken = login();

// 2. 等待至少 1 秒
Thread.sleep(1100); // 1100ms 确保跨越秒边界

// 3. 刷新令牌
String newToken = refresh(oldToken);

// 4. 验证
assert !newToken.equals(oldToken); // 现在一定不同
```

### 为什么是 1100ms？

- **1000ms**: 理论上 1 秒就够了
- **+100ms**: 额外的缓冲时间，考虑到：
  - 系统时钟精度
  - 线程调度延迟
  - 测试执行的不确定性

### 生产环境的影响

这个问题**只影响测试**，不影响生产环境：

1. **真实场景**: 用户不会在同一秒内刷新令牌
2. **令牌刷新策略**: 通常在令牌剩余时间 < 30 分钟时才刷新
3. **即使相同也没问题**: 如果真的在同一秒刷新，生成相同的令牌也是可以接受的

### 其他可能的解决方案

#### 方案 1: 使用毫秒级时间戳（不推荐）
```java
// 修改 JWT 生成逻辑，使用毫秒
claims.put("iat", System.currentTimeMillis());
```
**缺点**: 违反 JWT 标准（RFC 7519 规定使用秒级时间戳）

#### 方案 2: 添加随机 nonce（不推荐）
```java
// 在令牌中添加随机数
claims.put("nonce", UUID.randomUUID().toString());
```
**缺点**: 增加令牌大小，没有实际业务价值

#### 方案 3: 修改测试验证逻辑（当前方案）
```java
// 添加延迟，确保时间戳不同
Thread.sleep(1100);
```
**优点**: 
- 不修改生产代码
- 符合 JWT 标准
- 测试更真实（模拟真实的时间间隔）

### 测试最佳实践

1. **理解被测系统**: 了解 JWT 的时间戳精度
2. **考虑时间因素**: 涉及时间的测试要考虑精度问题
3. **添加适当延迟**: 在需要时间差异的测试中添加延迟
4. **清晰的注释**: 解释为什么需要延迟

### 相关测试

其他可能受时间精度影响的测试：
- 令牌过期测试
- 会话超时测试
- 时间戳验证测试

### 参考资料

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [JWT Claims - NumericDate](https://tools.ietf.org/html/rfc7519#section-2)
- Unix Timestamp 定义

## 其他集成测试注意事项

### Redis 连接

集成测试需要真实的 Redis 连接：
- 主机: 139.199.17.216
- 端口: 16739
- 密码: 123456

如果 Redis 不可用，测试会捕获异常并跳过。

### 数据库连接

集成测试需要真实的 MySQL 连接：
- 数据库: cloud_color_grading
- 测试会在 setUp 中创建测试用户
- 测试会在 setUp 中清理 Redis 数据

### 测试隔离

每个测试都应该：
1. 在 setUp 中准备数据
2. 执行测试逻辑
3. 在测试结束时清理数据

### 并发问题

集成测试不是线程安全的：
- 不要并行运行集成测试
- 使用 `@Execution(ExecutionMode.SAME_THREAD)` 如果需要

