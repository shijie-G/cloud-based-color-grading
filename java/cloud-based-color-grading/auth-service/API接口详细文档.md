# Auth Service API 接口文档

## 基础信息

- **服务名称**: auth-service
- **端口**: 8081
- **网关访问**: http://localhost:8080
- **统一响应格式**: 
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

## 1. 认证接口 (AuthController)

### 1.1 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": 1,
    "username": "admin",
    "nickname": "管理员",
    "roles": ["ROLE_ADMIN"],
    "permissions": ["user:create", "user:read", "user:update", "user:delete"],
    "menus": [
      {
        "id": 1,
        "name": "系统管理",
        "path": "/system",
        "icon": "setting",
        "children": [...]
      }
    ]
  }
}
```

**错误响应**:
- `401`: 用户名或密码错误
- `403`: 账户被锁定或禁用
- `500`: 服务器内部错误

---

### 1.2 用户登出

**接口地址**: `POST /auth/logout`

**请求头**:
```
X-User-Id: 1
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 1.3 刷新令牌

**接口地址**: `POST /auth/refresh`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**错误响应**:
- `401`: 令牌格式错误或令牌无效

---

## 2. 用户管理接口 (UserController)

### 2.1 创建用户

**接口地址**: `POST /users`

**请求参数**:
```json
{
  "username": "zhangsan",
  "password": "123456",
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 2,
    "username": "zhangsan",
    "nickname": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "enabled": true,
    "createTime": "2026-01-13T10:00:00"
  }
}
```

**错误响应**:
- `400`: 用户名或密码为空
- `409`: 用户名已存在
- `500`: 创建失败

---

### 2.2 查询用户列表（分页）

**接口地址**: `GET /users`

**请求参数**:
- `current`: 当前页码（默认1）
- `size`: 每页大小（默认10）
- `username`: 用户名筛选（可选）

**示例**: `GET /users?current=1&size=10&username=admin`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "enabled": true,
        "createTime": "2026-01-01T00:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

---

### 2.3 更新用户信息

**接口地址**: `PUT /users/{id}`

**请求参数**:
```json
{
  "nickname": "新昵称",
  "email": "newemail@example.com",
  "phone": "13900139000",
  "password": "newpassword"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 2,
    "username": "zhangsan",
    "nickname": "新昵称",
    "email": "newemail@example.com",
    "phone": "13900139000",
    "enabled": true,
    "updateTime": "2026-01-13T11:00:00"
  }
}
```

**错误响应**:
- `404`: 用户不存在
- `409`: 用户名已存在（如果修改用户名）
- `500`: 更新失败

**注意**: 修改密码后，该用户的所有令牌将失效

---

### 2.4 禁用用户

**接口地址**: `DELETE /users/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

**错误响应**:
- `404`: 用户不存在
- `500`: 禁用失败

**注意**: 禁用用户后，该用户的所有令牌和权限缓存将被清除

---

### 2.5 重置用户密码

**接口地址**: `POST /users/{id}/reset-password`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": "a1b2c3d4"
}
```

**说明**: 返回的临时密码应通过邮件或短信发送给用户

**错误响应**:
- `404`: 用户不存在
- `500`: 重置失败

**注意**: 重置密码后，该用户的所有令牌将失效

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（令牌无效或过期） |
| 403 | 禁止访问（账户被禁用） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

---

## 认证说明

除了登录接口外，其他所有接口都需要在请求头中携带JWT令牌：

```
Authorization: Bearer {token}
```

网关会自动验证令牌，并在请求头中添加用户信息：
- `X-User-Id`: 用户ID
- `X-Username`: 用户名
- `X-Roles`: 用户角色（逗号分隔）
