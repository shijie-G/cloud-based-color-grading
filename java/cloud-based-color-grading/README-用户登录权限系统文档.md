# 用户登录及权限系统 - 文档导航

## 📚 完整文档列表

### 核心文档

1. **[目录索引](./用户登录及权限系统完整解析-目录.md)** - 文档总览
2. **[架构概览](./用户登录及权限系统-1-架构概览.md)** - 系统整体架构
3. **[数据库设计](./用户登录及权限系统-2-数据库设计.md)** - RBAC模型和表结构
4. **[登录流程](./用户登录及权限系统-3-登录流程.md)** - 完整登录流程详解
5. **[Token验证](./用户登录及权限系统-4-Token验证.md)** - Gateway验证机制
6. **[完整流程总结](./用户登录及权限系统-完整流程总结.md)** ⭐ **推荐先看**

---

## 🚀 快速开始

### 1. 理解整体架构

```
前端 → Gateway (8080) → Auth Service (8081) / Authz Service (8082)
                ↓                    ↓
              Redis              MySQL
```

### 2. 登录流程（3步）

```
1. POST /auth/login {username, password}
   ↓
2. 验证密码 → 生成JWT Token → 存入Redis
   ↓
3. 返回 {token, userId, username, roles, permissions, menus}
```

### 3. 请求验证（5步）

```
1. 携带Token发送请求
   ↓
2. Gateway验证Token签名
   ↓
3. Redis验证Token存在
   ↓
4. 添加用户信息到请求头
   ↓
5. 转发到后端服务
```

---

## 📖 核心概念

### RBAC模型

```
用户 (User) ←→ 角色 (Role) ←→ 权限 (Permission) ←→ 菜单 (Menu)
```

### JWT Token结构

```
Header.Payload.Signature

Payload包含:
- userId: 用户ID
- username: 用户名
- roles: 角色列表
- iat: 签发时间
- exp: 过期时间
```

### Redis缓存

| Key | Value | TTL |
|-----|-------|-----|
| `token:{userId}` | JWT Token | 2小时 |
| `permissions:{userId}` | 权限列表 | 2小时 |
| `login:fail:{username}` | 失败次数 | 15分钟 |
| `account:locked:{username}` | 锁定标记 | 15分钟 |

---

## 🔐 安全机制

### 密码安全
- ✅ BCrypt加密（cost=10）
- ✅ 随机盐值
- ✅ 只存储哈希值

### Token安全
- ✅ HS512签名
- ✅ 2小时有效期
- ✅ 自动刷新（剩余<30分钟）
- ✅ Redis双重验证

### 账户保护
- ✅ 登录失败限制（5次）
- ✅ 自动锁定（15分钟）
- ✅ 账户状态检查

---

## 🛠️ 技术栈

- **Spring Boot**: 3.2.10
- **Spring Cloud Gateway**: 2023.0.3
- **JWT**: jjwt 0.12.5
- **BCrypt**: Spring Security Crypto
- **MyBatis-Plus**: 3.5.6
- **MySQL**: 8.0+
- **Redis**: 6.0+

---

## 📝 API接口

### 认证接口

```bash
# 登录
POST http://localhost:8080/auth/login
Content-Type: application/json
{
  "username": "admin",
  "password": "admin123"
}

# 登出
POST http://localhost:8080/auth/logout
Authorization: Bearer {token}

# 刷新Token
POST http://localhost:8080/auth/refresh
Authorization: Bearer {token}
```

### 用户管理接口

```bash
# 查询用户列表
GET http://localhost:8080/users
Authorization: Bearer {token}

# 创建用户
POST http://localhost:8080/users
Authorization: Bearer {token}
Content-Type: application/json
{
  "username": "newuser",
  "password": "password123",
  "nickname": "新用户"
}
```

---

## 🔍 常见问题

### Q: 登录后如何访问受保护的接口？

```javascript
// 1. 登录获取Token
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({username: 'admin', password: 'admin123'})
});
const {token} = await loginResponse.json();

// 2. 保存Token
localStorage.setItem('token', token);

// 3. 携带Token访问接口
const response = await fetch('/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Q: Token过期了怎么办？

A: 
- Token有效期2小时
- 剩余时间<30分钟时自动刷新
- 新Token在响应头 `Authorization` 中返回
- 前端需要更新保存的Token

### Q: 如何实现权限控制？

A:
1. 用户登录后获取权限列表
2. 前端根据权限显示/隐藏按钮
3. 后端在接口中检查权限
4. 无权限返回403

---

## 📊 数据库表

### 核心7张表

1. `sys_user` - 用户表
2. `sys_role` - 角色表
3. `sys_permission` - 权限表
4. `sys_menu` - 菜单表
5. `sys_user_role` - 用户角色关联表
6. `sys_role_permission` - 角色权限关联表
7. `sys_menu_permission` - 菜单权限关联表

### 初始数据

```sql
-- 超级管理员用户
username: admin
password: admin123
角色: ROLE_SUPER_ADMIN
权限: 所有权限
```

---

## 🎯 下一步

1. ✅ 阅读 [完整流程总结](./用户登录及权限系统-完整流程总结.md)
2. ✅ 理解 [登录流程](./用户登录及权限系统-3-登录流程.md)
3. ✅ 学习 [Token验证](./用户登录及权限系统-4-Token验证.md)
4. ✅ 查看 [数据库设计](./用户登录及权限系统-2-数据库设计.md)

---

**文档版本：** v1.0  
**创建时间：** 2026-01-13  
**维护者：** DevOps Team
