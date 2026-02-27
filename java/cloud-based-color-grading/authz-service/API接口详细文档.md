# Authz Service API 接口文档

## 基础信息

- **服务名称**: authz-service
- **端口**: 8082
- **网关访问**: http://localhost:8080/api
- **统一响应格式**: 
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

## 1. 角色管理接口 (RoleController)

### 1.1 创建角色

**接口地址**: `POST /api/roles`

**请求参数**:
```json
{
  "name": "ROLE_MANAGER",
  "description": "部门经理",
  "enabled": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 3,
    "name": "ROLE_MANAGER",
    "description": "部门经理",
    "enabled": true,
    "createTime": "2026-01-13T10:00:00"
  }
}
```

---

### 1.2 更新角色

**接口地址**: `PUT /api/roles/{id}`

**请求参数**:
```json
{
  "name": "ROLE_MANAGER",
  "description": "部门经理（更新）",
  "enabled": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 3,
    "name": "ROLE_MANAGER",
    "description": "部门经理（更新）",
    "enabled": true,
    "updateTime": "2026-01-13T11:00:00"
  }
}
```

---

### 1.3 删除角色

**接口地址**: `DELETE /api/roles/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 1.4 查询角色详情

**接口地址**: `GET /api/roles/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "ROLE_ADMIN",
    "description": "系统管理员",
    "enabled": true,
    "createTime": "2026-01-01T00:00:00"
  }
}
```

---

### 1.5 查询所有角色

**接口地址**: `GET /api/roles`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "ROLE_ADMIN",
      "description": "系统管理员",
      "enabled": true
    },
    {
      "id": 2,
      "name": "ROLE_USER",
      "description": "普通用户",
      "enabled": true
    }
  ]
}
```

---

### 1.6 为角色分配权限

**接口地址**: `POST /api/roles/{roleId}/permissions`

**请求参数**:
```json
[1, 2, 3, 4, 5]
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

### 1.7 为用户分配角色

**接口地址**: `POST /api/roles/users/{userId}`

**请求参数**:
```json
[1, 2]
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

### 1.8 移除用户的角色

**接口地址**: `DELETE /api/roles/users/{userId}/roles/{roleId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

## 2. 权限管理接口 (PermissionController)

### 2.1 检查用户权限（供网关调用）

**接口地址**: `GET /api/permissions/check`

**请求参数**:
- `userId`: 用户ID
- `resourcePath`: 资源路径
- `method`: HTTP方法

**示例**: `GET /api/permissions/check?userId=1&resourcePath=/users&method=GET`

**响应示例**:
```json
true
```

**说明**: 此接口返回布尔值，不使用统一响应格式

---

### 2.2 创建权限

**接口地址**: `POST /api/permissions`

**请求参数**:
```json
{
  "name": "user:create",
  "description": "创建用户",
  "resourcePath": "/users",
  "method": "POST",
  "enabled": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 6,
    "name": "user:create",
    "description": "创建用户",
    "resourcePath": "/users",
    "method": "POST",
    "enabled": true,
    "createTime": "2026-01-13T10:00:00"
  }
}
```

---

### 2.3 更新权限

**接口地址**: `PUT /api/permissions/{id}`

**请求参数**:
```json
{
  "name": "user:create",
  "description": "创建用户（更新）",
  "resourcePath": "/users",
  "method": "POST",
  "enabled": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 6,
    "name": "user:create",
    "description": "创建用户（更新）",
    "resourcePath": "/users",
    "method": "POST",
    "enabled": true,
    "updateTime": "2026-01-13T11:00:00"
  }
}
```

---

### 2.4 删除权限

**接口地址**: `DELETE /api/permissions/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 2.5 查询权限详情

**接口地址**: `GET /api/permissions/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "user:read",
    "description": "查询用户",
    "resourcePath": "/users",
    "method": "GET",
    "enabled": true,
    "createTime": "2026-01-01T00:00:00"
  }
}
```

---

### 2.6 查询所有权限

**接口地址**: `GET /api/permissions`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "user:read",
      "description": "查询用户",
      "resourcePath": "/users",
      "method": "GET",
      "enabled": true
    },
    {
      "id": 2,
      "name": "user:create",
      "description": "创建用户",
      "resourcePath": "/users",
      "method": "POST",
      "enabled": true
    }
  ]
}
```

---

### 2.7 获取用户所有权限

**接口地址**: `GET /api/permissions/user/{userId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "user:read",
      "description": "查询用户",
      "resourcePath": "/users",
      "method": "GET",
      "enabled": true
    }
  ]
}
```

---

## 3. 菜单管理接口 (MenuController)

### 3.1 创建菜单

**接口地址**: `POST /api/menus`

**请求参数**:
```json
{
  "name": "用户管理",
  "path": "/system/users",
  "icon": "user",
  "parentId": 1,
  "orderNum": 1,
  "enabled": true
}
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

### 3.2 更新菜单

**接口地址**: `PUT /api/menus/{id}`

**请求参数**:
```json
{
  "name": "用户管理（更新）",
  "path": "/system/users",
  "icon": "user",
  "parentId": 1,
  "orderNum": 1,
  "enabled": true
}
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

### 3.3 删除菜单

**接口地址**: `DELETE /api/menus/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 3.4 查询菜单详情

**接口地址**: `GET /api/menus/{id}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 2,
    "name": "用户管理",
    "path": "/system/users",
    "icon": "user",
    "parentId": 1,
    "orderNum": 1,
    "enabled": true,
    "createTime": "2026-01-01T00:00:00"
  }
}
```

---

### 3.5 查询所有菜单

**接口地址**: `GET /api/menus`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "path": "/system",
      "icon": "setting",
      "parentId": null,
      "orderNum": 1,
      "enabled": true
    },
    {
      "id": 2,
      "name": "用户管理",
      "path": "/system/users",
      "icon": "user",
      "parentId": 1,
      "orderNum": 1,
      "enabled": true
    }
  ]
}
```

---

### 3.6 获取用户菜单树

**接口地址**: `GET /api/menus/user/{userId}/tree`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "path": "/system",
      "icon": "setting",
      "children": [
        {
          "id": 2,
          "name": "用户管理",
          "path": "/system/users",
          "icon": "user",
          "children": []
        }
      ]
    }
  ]
}
```

---

### 3.7 关联菜单和权限

**接口地址**: `POST /api/menus/{menuId}/permissions/{permissionId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 3.8 取消菜单和权限的关联

**接口地址**: `DELETE /api/menus/{menuId}/permissions/{permissionId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（令牌无效或过期） |
| 403 | 禁止访问（无权限） |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 认证说明

所有接口都需要在请求头中携带JWT令牌：

```
Authorization: Bearer {token}
```

网关会自动验证令牌和权限。
