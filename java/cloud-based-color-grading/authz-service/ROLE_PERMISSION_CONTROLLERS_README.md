# 角色权限管理接口实现说明

## 概述

本文档说明了任务 12.1 的实现：RoleController 和 PermissionController 的 CRUD 接口以及角色权限分配接口。

## 实现的功能

### 1. RoleController（角色控制器）

**基础路径**: `/api/roles`

#### 角色 CRUD 接口

- **POST /api/roles** - 创建角色
  - 请求体：Role 对象（roleName, roleKey, description, status）
  - 返回：创建的角色对象（包含 ID 和创建时间）

- **PUT /api/roles/{id}** - 更新角色
  - 路径参数：角色 ID
  - 请求体：Role 对象
  - 返回：更新后的角色对象

- **DELETE /api/roles/{id}** - 删除角色
  - 路径参数：角色 ID
  - 返回：操作成功响应

- **GET /api/roles/{id}** - 根据 ID 查询角色
  - 路径参数：角色 ID
  - 返回：角色对象

- **GET /api/roles** - 查询所有角色
  - 返回：角色列表

#### 角色权限分配接口

- **POST /api/roles/{roleId}/permissions** - 为角色分配权限
  - 路径参数：角色 ID
  - 请求体：权限 ID 列表 `List<Long>`
  - 功能：会自动清除拥有该角色的所有用户的权限缓存
  - 返回：操作成功响应

#### 用户角色分配接口

- **POST /api/roles/users/{userId}** - 为用户分配角色
  - 路径参数：用户 ID
  - 请求体：角色 ID 列表 `List<Long>`
  - 功能：会自动清除该用户的权限缓存
  - 返回：操作成功响应

- **DELETE /api/roles/users/{userId}/roles/{roleId}** - 移除用户的角色
  - 路径参数：用户 ID 和角色 ID
  - 功能：会自动清除该用户的权限缓存
  - 返回：操作成功响应

### 2. PermissionController（权限控制器）

**基础路径**: `/api/permissions`

#### 权限 CRUD 接口

- **POST /api/permissions** - 创建权限
  - 请求体：Permission 对象（permissionName, permissionKey, resourceType, resourcePath, method, description）
  - 返回：创建的权限对象（包含 ID）

- **PUT /api/permissions/{id}** - 更新权限
  - 路径参数：权限 ID
  - 请求体：Permission 对象
  - 返回：更新后的权限对象

- **DELETE /api/permissions/{id}** - 删除权限
  - 路径参数：权限 ID
  - 返回：操作成功响应

- **GET /api/permissions/{id}** - 根据 ID 查询权限
  - 路径参数：权限 ID
  - 返回：权限对象

- **GET /api/permissions** - 查询所有权限
  - 返回：权限列表

#### 权限查询接口

- **GET /api/permissions/check** - 检查用户是否有权限访问资源（供网关调用）
  - 查询参数：userId, resourcePath, method
  - 返回：Boolean（是否有权限）

- **GET /api/permissions/user/{userId}** - 获取用户所有权限
  - 路径参数：用户 ID
  - 返回：权限列表（优先从 Redis 缓存读取）

## 服务层扩展

### PermissionService 接口扩展

添加了以下 CRUD 方法：
- `createPermission(Permission permission)` - 创建权限
- `updatePermission(Permission permission)` - 更新权限
- `deletePermission(Long permissionId)` - 删除权限
- `getPermissionById(Long permissionId)` - 根据 ID 查询权限
- `getAllPermissions()` - 查询所有权限

### PermissionServiceImpl 实现

实现了上述接口方法，使用 MyBatis-Plus 的 BaseMapper 进行数据库操作。

## 单元测试

### RoleControllerTest

测试覆盖：
- ✅ 创建角色
- ✅ 更新角色
- ✅ 删除角色
- ✅ 根据 ID 查询角色
- ✅ 查询所有角色
- ✅ 为角色分配权限
- ✅ 为用户分配角色
- ✅ 移除用户的角色

### PermissionControllerTest

测试覆盖：
- ✅ 检查用户权限
- ✅ 创建权限
- ✅ 更新权限
- ✅ 删除权限
- ✅ 根据 ID 查询权限
- ✅ 查询所有权限
- ✅ 获取用户所有权限

## 需求追溯

本实现满足以下需求：

- **需求 3.1**: 创建用户时允许分配一个或多个角色 ✅
- **需求 3.2**: 用户访问受保护资源时验证是否具有所需角色 ✅
- **需求 4.1**: 定义权限时包含资源标识符和操作类型 ✅
- **需求 4.2**: 角色创建或修改时允许关联多个权限 ✅

## 技术栈

- Spring Boot 3.2.10
- Spring Web MVC
- MyBatis-Plus 3.5.6
- JUnit 5
- Mockito

## 响应格式

所有接口使用统一的响应格式 `Result<T>`：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

## 注意事项

1. **权限缓存管理**：
   - 为角色分配权限时，会自动清除所有拥有该角色的用户的权限缓存
   - 为用户分配/移除角色时，会自动清除该用户的权限缓存
   - 这确保了权限变更能够立即生效

2. **数据验证**：
   - 控制器层接收请求参数
   - 服务层负责业务逻辑和数据验证
   - 使用 MyBatis-Plus 进行数据持久化

3. **测试策略**：
   - 使用 Mockito 模拟服务层
   - 测试控制器的请求处理和响应格式
   - 验证服务层方法的调用次数和参数

## 下一步

建议继续实现：
- 任务 13：菜单管理接口
- 任务 14：配置和安全增强
- 任务 15-17：集成测试和最终验证
