# Requirements Document

## Introduction

本文档定义了一个工业级的菜单角色管理前端系统的需求。该系统基于 Vue3 + TypeScript + Element Plus 技术栈，用于管理后端 RBAC 权限系统中的角色、菜单及其关联关系。系统需要提供直观的用户界面，支持角色的增删改查、菜单的树形管理，以及角色与菜单的灵活关联。

## Glossary

- **System**: 菜单角色管理前端系统
- **Role**: 角色，代表一组权限的集合
- **Menu**: 菜单，代表系统中的导航菜单项
- **Menu_Tree**: 菜单树，菜单的层级树形结构
- **Role_Menu_Association**: 角色菜单关联，表示角色可以访问哪些菜单
- **Backend_API**: 后端 API 服务，提供数据接口
- **User**: 系统管理员用户
- **Table_Component**: 表格组件，用于展示列表数据
- **Dialog_Component**: 对话框组件，用于表单编辑
- **Tree_Component**: 树形组件，用于展示和选择菜单树

## Requirements

### Requirement 1: 角色列表管理

**User Story:** 作为系统管理员，我想要查看和管理所有角色，以便了解系统中的角色配置。

#### Acceptance Criteria

1. WHEN 用户访问角色管理页面 THEN THE System SHALL 显示包含所有角色的表格，包含角色名称、角色标识、描述、状态和操作列
2. WHEN 表格加载时 THEN THE System SHALL 调用 Backend_API 的 GET /api/roles 接口获取角色列表
3. WHEN 角色数据为空 THEN THE System SHALL 显示"暂无数据"的空状态提示
4. WHEN 角色数据加载失败 THEN THE System SHALL 显示错误提示信息并提供重试按钮
5. THE System SHALL 在表格中为每个角色提供"编辑"、"删除"和"分配菜单"操作按钮

### Requirement 2: 创建角色

**User Story:** 作为系统管理员，我想要创建新角色，以便为不同用户群体定义访问权限。

#### Acceptance Criteria

1. WHEN 用户点击"新增角色"按钮 THEN THE System SHALL 打开角色创建对话框
2. THE Dialog_Component SHALL 包含角色名称、角色标识、描述和状态字段
3. WHEN 用户提交表单且所有必填字段已填写 THEN THE System SHALL 调用 Backend_API 的 POST /api/roles 接口创建角色
4. WHEN 角色创建成功 THEN THE System SHALL 显示成功提示、关闭对话框并刷新角色列表
5. WHEN 角色标识已存在 THEN THE System SHALL 显示"角色标识已存在"的错误提示
6. WHEN 用户未填写必填字段 THEN THE System SHALL 在对应字段下显示验证错误信息
7. WHEN 用户点击取消按钮 THEN THE System SHALL 关闭对话框并清空表单数据

### Requirement 3: 编辑角色

**User Story:** 作为系统管理员，我想要编辑现有角色信息，以便更新角色配置。

#### Acceptance Criteria

1. WHEN 用户点击角色的"编辑"按钮 THEN THE System SHALL 打开角色编辑对话框并填充当前角色数据
2. WHEN 用户修改表单并提交 THEN THE System SHALL 调用 Backend_API 的 PUT /api/roles/{id} 接口更新角色
3. WHEN 角色更新成功 THEN THE System SHALL 显示成功提示、关闭对话框并刷新角色列表
4. WHEN 更新的角色标识与其他角色冲突 THEN THE System SHALL 显示"角色标识已存在"的错误提示
5. THE System SHALL 保持表单验证规则与创建角色一致

### Requirement 4: 删除角色

**User Story:** 作为系统管理员，我想要删除不再需要的角色，以便保持系统整洁。

#### Acceptance Criteria

1. WHEN 用户点击角色的"删除"按钮 THEN THE System SHALL 显示确认对话框，提示"确定要删除该角色吗？删除后将解除所有用户与该角色的关联"
2. WHEN 用户确认删除 THEN THE System SHALL 调用 Backend_API 的 DELETE /api/roles/{id} 接口删除角色
3. WHEN 角色删除成功 THEN THE System SHALL 显示成功提示并刷新角色列表
4. WHEN 角色删除失败 THEN THE System SHALL 显示错误提示信息
5. WHEN 用户取消删除 THEN THE System SHALL 关闭确认对话框且不执行删除操作

### Requirement 5: 菜单树形管理

**User Story:** 作为系统管理员，我想要以树形结构查看和管理菜单，以便直观地理解菜单层级关系。

#### Acceptance Criteria

1. WHEN 用户访问菜单管理页面 THEN THE System SHALL 显示菜单树形表格，展示所有菜单的层级结构
2. WHEN 页面加载时 THEN THE System SHALL 调用 Backend_API 的 GET /api/menus 接口获取菜单列表
3. THE Tree_Component SHALL 显示菜单名称、路由路径、图标、排序号、状态和操作列
4. WHEN 菜单有子菜单 THEN THE System SHALL 显示展开/折叠图标，允许用户展开或折叠子菜单
5. THE System SHALL 在每个菜单项提供"新增子菜单"、"编辑"和"删除"操作按钮
6. WHEN 菜单数据为空 THEN THE System SHALL 显示"暂无菜单数据"的空状态提示

### Requirement 6: 创建菜单

**User Story:** 作为系统管理员，我想要创建新菜单项，以便扩展系统导航结构。

#### Acceptance Criteria

1. WHEN 用户点击"新增顶级菜单"按钮 THEN THE System SHALL 打开菜单创建对话框，父菜单ID设置为0
2. WHEN 用户点击某个菜单的"新增子菜单"按钮 THEN THE System SHALL 打开菜单创建对话框，父菜单ID设置为当前菜单ID
3. THE Dialog_Component SHALL 包含菜单名称、路由路径、组件路径、图标、排序号、是否可见和状态字段
4. WHEN 用户提交表单且所有必填字段已填写 THEN THE System SHALL 调用 Backend_API 的 POST /api/menus 接口创建菜单
5. WHEN 菜单创建成功 THEN THE System SHALL 显示成功提示、关闭对话框并刷新菜单树
6. WHEN 用户未填写必填字段 THEN THE System SHALL 在对应字段下显示验证错误信息
7. THE System SHALL 提供图标选择器，允许用户从预定义图标库中选择图标

### Requirement 7: 编辑菜单

**User Story:** 作为系统管理员，我想要编辑现有菜单信息，以便更新菜单配置。

#### Acceptance Criteria

1. WHEN 用户点击菜单的"编辑"按钮 THEN THE System SHALL 打开菜单编辑对话框并填充当前菜单数据
2. WHEN 用户修改表单并提交 THEN THE System SHALL 调用 Backend_API 的 PUT /api/menus/{id} 接口更新菜单
3. WHEN 菜单更新成功 THEN THE System SHALL 显示成功提示、关闭对话框并刷新菜单树
4. THE System SHALL 允许用户修改父菜单，但不允许将菜单设置为自己的子菜单
5. THE System SHALL 保持表单验证规则与创建菜单一致

### Requirement 8: 删除菜单

**User Story:** 作为系统管理员，我想要删除不再需要的菜单，以便简化导航结构。

#### Acceptance Criteria

1. WHEN 用户点击菜单的"删除"按钮且该菜单有子菜单 THEN THE System SHALL 显示错误提示"该菜单包含子菜单，请先删除子菜单"
2. WHEN 用户点击菜单的"删除"按钮且该菜单无子菜单 THEN THE System SHALL 显示确认对话框，提示"确定要删除该菜单吗？"
3. WHEN 用户确认删除 THEN THE System SHALL 调用 Backend_API 的 DELETE /api/menus/{id} 接口删除菜单
4. WHEN 菜单删除成功 THEN THE System SHALL 显示成功提示并刷新菜单树
5. WHEN 菜单删除失败 THEN THE System SHALL 显示错误提示信息

### Requirement 9: 角色权限关联

**User Story:** 作为系统管理员，我想要为角色分配权限，以便控制不同角色的访问权限。

#### Acceptance Criteria

1. WHEN 用户点击角色的"分配权限"按钮 THEN THE System SHALL 打开权限分配对话框
2. THE Dialog_Component SHALL 显示所有可用权限列表，使用复选框列表或穿梭框组件
3. WHEN 对话框打开时 THEN THE System SHALL 调用 Backend_API 的 GET /api/permissions 接口获取所有权限，并调用接口获取该角色已关联的权限列表
4. WHEN 用户勾选或取消勾选权限 THEN THE System SHALL 更新选中状态
5. WHEN 用户点击保存按钮 THEN THE System SHALL 调用 Backend_API 的 POST /api/roles/{roleId}/permissions 接口更新角色的权限关联
6. WHEN 权限分配成功 THEN THE System SHALL 显示成功提示并关闭对话框
7. THE System SHALL 支持按权限类型（menu/button/api）筛选权限
8. THE System SHALL 支持搜索功能，允许用户通过权限名称快速定位权限

### Requirement 10: 响应式布局和用户体验

**User Story:** 作为系统管理员，我想要在不同设备上都能流畅使用系统，以便随时随地管理角色和菜单。

#### Acceptance Criteria

1. THE System SHALL 在桌面端（>1200px）显示完整的表格列和操作按钮
2. WHEN 屏幕宽度小于1200px THEN THE System SHALL 自动调整表格列宽和隐藏次要列
3. THE System SHALL 在所有表单提交时显示加载状态，防止重复提交
4. WHEN 用户执行操作时 THEN THE System SHALL 提供即时的视觉反馈（按钮加载状态、进度条等）
5. THE System SHALL 使用统一的颜色主题和组件样式，保持界面一致性
6. WHEN 发生错误时 THEN THE System SHALL 显示清晰的错误信息，帮助用户理解问题

### Requirement 11: 数据持久化和状态管理

**User Story:** 作为系统管理员，我想要系统能够正确处理数据状态，以便确保数据的一致性和可靠性。

#### Acceptance Criteria

1. WHEN 用户刷新页面 THEN THE System SHALL 重新从 Backend_API 加载最新数据
2. THE System SHALL 在本地存储用户的 JWT Token，用于 API 认证
3. WHEN Token 过期 THEN THE System SHALL 自动跳转到登录页面
4. THE System SHALL 使用 Pinia 或 Vuex 管理全局状态（如用户信息、权限列表）
5. WHEN API 请求失败且状态码为 401 THEN THE System SHALL 清除本地 Token 并跳转到登录页面

### Requirement 12: 权限控制

**User Story:** 作为系统管理员，我想要系统根据我的权限显示或隐藏功能，以便确保安全性。

#### Acceptance Criteria

1. THE System SHALL 在用户登录后获取用户的权限列表
2. WHEN 用户没有"角色管理"权限 THEN THE System SHALL 隐藏角色管理菜单和页面
3. WHEN 用户没有"菜单管理"权限 THEN THE System SHALL 隐藏菜单管理菜单和页面
4. WHEN 用户没有"创建角色"权限 THEN THE System SHALL 隐藏"新增角色"按钮
5. WHEN 用户没有"编辑角色"权限 THEN THE System SHALL 隐藏角色列表中的"编辑"按钮
6. WHEN 用户没有"删除角色"权限 THEN THE System SHALL 隐藏角色列表中的"删除"按钮
7. THE System SHALL 对菜单管理应用相同的权限控制逻辑


### Requirement 13: 菜单权限关联

**User Story:** 作为系统管理员，我想要为菜单关联权限，以便实现菜单级别的权限控制。

#### Acceptance Criteria

1. WHEN 用户点击菜单的"关联权限"按钮 THEN THE System SHALL 打开权限关联对话框
2. THE Dialog_Component SHALL 显示所有可用权限列表
3. WHEN 对话框打开时 THEN THE System SHALL 调用 Backend_API 获取该菜单已关联的权限列表
4. WHEN 用户选择权限并点击保存 THEN THE System SHALL 调用 Backend_API 的 POST /api/menus/{menuId}/permissions/{permissionId} 接口关联菜单和权限
5. WHEN 用户取消关联权限 THEN THE System SHALL 调用 Backend_API 的 DELETE /api/menus/{menuId}/permissions/{permissionId} 接口取消关联
6. WHEN 操作成功 THEN THE System SHALL 显示成功提示并刷新关联列表

### Requirement 14: 用户角色分配

**User Story:** 作为系统管理员，我想要为用户分配角色，以便控制用户的访问权限。

#### Acceptance Criteria

1. WHEN 用户访问用户管理页面并点击"分配角色"按钮 THEN THE System SHALL 打开角色分配对话框
2. THE Dialog_Component SHALL 显示所有可用角色列表，使用复选框列表
3. WHEN 对话框打开时 THEN THE System SHALL 调用 Backend_API 获取该用户已分配的角色列表
4. WHEN 用户勾选或取消勾选角色 THEN THE System SHALL 更新选中状态
5. WHEN 用户点击保存按钮 THEN THE System SHALL 调用 Backend_API 的 POST /api/roles/users/{userId} 接口更新用户的角色分配
6. WHEN 角色分配成功 THEN THE System SHALL 显示成功提示并关闭对话框
7. WHEN 用户点击某个角色的"移除"按钮 THEN THE System SHALL 调用 Backend_API 的 DELETE /api/roles/users/{userId}/roles/{roleId} 接口移除用户的角色

### Requirement 15: 权限管理

**User Story:** 作为系统管理员，我想要管理系统权限，以便定义细粒度的访问控制。

#### Acceptance Criteria

1. WHEN 用户访问权限管理页面 THEN THE System SHALL 显示包含所有权限的表格，包含权限名称、权限标识、资源类型、资源路径、HTTP方法和操作列
2. WHEN 表格加载时 THEN THE System SHALL 调用 Backend_API 的 GET /api/permissions 接口获取权限列表
3. WHEN 用户点击"新增权限"按钮 THEN THE System SHALL 打开权限创建对话框
4. THE Dialog_Component SHALL 包含权限名称、权限标识、资源类型（menu/button/api）、资源路径、HTTP方法和描述字段
5. WHEN 用户提交表单且所有必填字段已填写 THEN THE System SHALL 调用 Backend_API 的 POST /api/permissions 接口创建权限
6. WHEN 用户点击"编辑"按钮 THEN THE System SHALL 打开权限编辑对话框并填充当前权限数据
7. WHEN 用户点击"删除"按钮 THEN THE System SHALL 显示确认对话框，确认后调用 Backend_API 的 DELETE /api/permissions/{id} 接口删除权限
8. THE System SHALL 支持按资源类型筛选权限
9. THE System SHALL 支持按权限名称或权限标识搜索权限
