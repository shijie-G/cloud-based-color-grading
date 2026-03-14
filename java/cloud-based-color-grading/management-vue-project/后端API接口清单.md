# 后端API接口清单

## 基础配置
- **Base URL**: `http://localhost:8080`
- **网关端口**: 8080
- **认证服务端口**: 8081
- **授权服务端口**: 8082

## 1. 角色管理接口 (Role Management)

### 1.1 获取所有角色
- **URL**: `/api/roles`
- **Method**: `GET`
- **描述**: 获取系统中所有角色列表

### 1.2 获取角色详情
- **URL**: `/api/roles/{id}`
- **Method**: `GET`
- **描述**: 根据角色ID获取角色详细信息

### 1.3 创建角色
- **URL**: `/api/roles`
- **Method**: `POST`
- **描述**: 创建新角色
- **请求体**: RoleFormData

### 1.4 更新角色
- **URL**: `/api/roles/{id}`
- **Method**: `PUT`
- **描述**: 更新指定角色信息
- **请求体**: RoleFormData

### 1.5 删除角色
- **URL**: `/api/roles/{id}`
- **Method**: `DELETE`
- **描述**: 删除指定角色

### 1.6 获取角色的权限列表
- **URL**: `/api/roles/{roleId}/permissions`
- **Method**: `GET`
- **描述**: 获取指定角色关联的所有权限ID列表

### 1.7 为角色分配权限
- **URL**: `/api/roles/{roleId}/permissions`
- **Method**: `POST`
- **描述**: 为指定角色分配权限
- **请求体**: `number[]` (权限ID数组)

### 1.8 为用户分配角色
- **URL**: `/api/roles/users/{userId}`
- **Method**: `POST`
- **描述**: 为指定用户分配角色
- **请求体**: `number[]` (角色ID数组)

### 1.9 移除用户的角色
- **URL**: `/api/roles/users/{userId}/roles/{roleId}`
- **Method**: `DELETE`
- **描述**: 移除用户的指定角色

---

## 2. 菜单管理接口 (Menu Management)

### 2.1 获取所有菜单
- **URL**: `/api/menus`
- **Method**: `GET`
- **描述**: 获取系统中所有菜单列表

### 2.2 获取菜单详情
- **URL**: `/api/menus/{id}`
- **Method**: `GET`
- **描述**: 根据菜单ID获取菜单详细信息

### 2.3 获取用户菜单树
- **URL**: `/api/menus/user/{userId}/tree`
- **Method**: `GET`
- **描述**: 获取指定用户的菜单树结构

### 2.4 创建菜单
- **URL**: `/api/menus`
- **Method**: `POST`
- **描述**: 创建新菜单
- **请求体**: MenuFormData

### 2.5 更新菜单
- **URL**: `/api/menus/{id}`
- **Method**: `PUT`
- **描述**: 更新指定菜单信息
- **请求体**: MenuFormData

### 2.6 删除菜单
- **URL**: `/api/menus/{id}`
- **Method**: `DELETE`
- **描述**: 删除指定菜单

### 2.7 获取菜单关联的权限列表
- **URL**: `/api/menus/{menuId}/permissions`
- **Method**: `GET`
- **描述**: 获取指定菜单关联的所有权限ID列表

### 2.8 关联菜单和权限
- **URL**: `/api/menus/{menuId}/permissions/{permissionId}`
- **Method**: `POST`
- **描述**: 将权限关联到菜单

### 2.9 取消菜单和权限的关联
- **URL**: `/api/menus/{menuId}/permissions/{permissionId}`
- **Method**: `DELETE`
- **描述**: 取消菜单和权限的关联关系

---

## 3. 权限管理接口 (Permission Management)

### 3.1 获取所有权限
- **URL**: `/api/permissions`
- **Method**: `GET`
- **描述**: 获取系统中所有权限列表

### 3.2 获取权限详情
- **URL**: `/api/permissions/{id}`
- **Method**: `GET`
- **描述**: 根据权限ID获取权限详细信息

### 3.3 获取用户所有权限
- **URL**: `/api/permissions/user/{userId}`
- **Method**: `GET`
- **描述**: 获取指定用户的所有权限列表

### 3.4 创建权限
- **URL**: `/api/permissions`
- **Method**: `POST`
- **描述**: 创建新权限
- **请求体**: PermissionFormData

### 3.5 更新权限
- **URL**: `/api/permissions/{id}`
- **Method**: `PUT`
- **描述**: 更新指定权限信息
- **请求体**: PermissionFormData

### 3.6 删除权限
- **URL**: `/api/permissions/{id}`
- **Method**: `DELETE`
- **描述**: 删除指定权限

---

## 接口统计

- **角色管理**: 9个接口
- **菜单管理**: 9个接口
- **权限管理**: 6个接口
- **总计**: 24个接口

---

## 认证说明

所有接口都需要在请求头中携带JWT Token：
```
Authorization: Bearer {token}
```

Token通过登录接口获取后，会自动添加到所有请求的请求头中。
