# Implementation Plan: 菜单角色管理前端系统

## Overview

本实现计划基于现有的 `management-vue-project` 项目，开发一个工业级菜单角色管理前端系统。系统采用 Vue3 + TypeScript + Element Plus 技术栈，包含科技感和简约大气的 UI 设计，提供角色管理、菜单管理、权限管理及其关联功能。

## Prerequisites

- 现有项目：`management-vue-project`
- 确保已安装必要依赖：Vue3, TypeScript, Element Plus, Pinia, Vue Router, Axios
- 后端服务已启动：Gateway (8080), Auth Service (8081), Authz Service (8082)

## Tasks

- [x] 1. 检查和补充项目依赖
  - 检查 package.json 中是否包含所需依赖
  - 如缺少则安装：Element Plus、Pinia、Vue Router、Axios、lodash-es
  - 检查开发依赖：Vitest、Cypress/Playwright、fast-check、@vue/test-utils
  - 确认 TypeScript 配置正确
  - 验证项目可以正常运行
  - _Requirements: 11.1, 11.2_

- [x] 2. 类型定义和工具函数
  - [x] 2.1 在项目中添加类型定义文件
    - 在 `management-vue-project/src/types/` 中定义 Role, Menu, Permission 接口
    - 定义 API 响应格式接口 (ApiResponse, PageResponse)
    - 定义表单数据接口 (RoleFormData, MenuFormData, PermissionFormData)
    - 定义通用类型 (TableColumn, PageParams)
    - _Requirements: 数据模型定义_

  - [x] 2.2 在项目中实现 HTTP 请求封装
    - 在 `management-vue-project/src/utils/` 中创建 Axios 实例并配置基础 URL 和超时
    - 实现请求拦截器（添加 Token）
    - 实现响应拦截器（处理错误、Token 刷新）
    - 处理 401/403 错误并跳转登录页
    - _Requirements: 11.2, 11.3_

  - [x] 2.3 在项目中实现认证工具函数
    - 在 `management-vue-project/src/utils/` 中实现 Token 存储函数 (setToken, getToken, removeToken)
    - 实现安全存储函数（可选加密）
    - _Requirements: 11.2_

  - [x] 2.4 在项目中实现表单验证工具
    - 在 `management-vue-project/src/utils/` 中实现角色标识验证函数 (validateRoleKey)
    - 实现菜单路径验证函数 (validateMenuPath)
    - 实现输入清理函数 (sanitizeInput)
    - _Requirements: 2.6, 安全考虑_

- [x] 3. API 服务层实现
  - [x] 3.1 在项目中实现角色 API 服务
    - 在 `management-vue-project/src/api/` 中创建 role.ts
    - 实现 getRoles() - 获取所有角色
    - 实现 getRoleById(id) - 获取角色详情
    - 实现 createRole(data) - 创建角色
    - 实现 updateRole(id, data) - 更新角色
    - 实现 deleteRole(id) - 删除角色
    - 实现 assignPermissionsToRole(roleId, permissionIds) - 分配权限
    - 实现 assignRolesToUser(userId, roleIds) - 分配角色给用户
    - 实现 removeRoleFromUser(userId, roleId) - 移除用户角色
    - _Requirements: 1.2, 2.3, 3.2, 4.2, 9.5, 14.5_

  - [x] 3.2 在项目中实现菜单 API 服务
    - 在 `management-vue-project/src/api/` 中创建 menu.ts
    - 实现 getMenus() - 获取所有菜单
    - 实现 getMenuById(id) - 获取菜单详情
    - 实现 getUserMenuTree(userId) - 获取用户菜单树
    - 实现 createMenu(data) - 创建菜单
    - 实现 updateMenu(id, data) - 更新菜单
    - 实现 deleteMenu(id) - 删除菜单
    - 实现 associateMenuPermission(menuId, permissionId) - 关联菜单权限
    - 实现 disassociateMenuPermission(menuId, permissionId) - 取消关联
    - _Requirements: 5.2, 6.4, 7.2, 8.3, 13.4, 13.5_

  - [x] 3.3 在项目中实现权限 API 服务
    - 在 `management-vue-project/src/api/` 中创建 permission.ts
    - 实现 getPermissions() - 获取所有权限
    - 实现 getPermissionById(id) - 获取权限详情
    - 实现 getUserPermissions(userId) - 获取用户权限
    - 实现 createPermission(data) - 创建权限
    - 实现 updatePermission(id, data) - 更新权限
    - 实现 deletePermission(id) - 删除权限
    - _Requirements: 15.2, 15.5, 15.6, 15.7_


- [x] 4. 状态管理实现 (Pinia Stores)
  - [x] 4.1 在项目中实现用户状态管理
    - 在 `management-vue-project/src/stores/` 中创建 user.ts
    - 定义用户状态 (token, userId, username, roles, permissions)
    - 实现 login action - 登录并保存用户信息
    - 实现 logout action - 登出并清除用户信息
    - 实现 setToken action - 更新 Token
    - 实现 hasRole getter - 检查角色
    - 实现 hasPermission getter - 检查权限
    - _Requirements: 11.2, 12.2_

  - [x] 4.2 在项目中实现权限状态管理
    - 在 `management-vue-project/src/stores/` 中创建 permission.ts
    - 定义菜单树状态 (menuTree, flatMenus)
    - 实现 setMenuTree action - 设置菜单树
    - 实现 flattenMenuTree 辅助函数 - 扁平化菜单树
    - 实现 clearMenuTree action - 清除菜单树
    - _Requirements: 5.4_

  - [x] 4.3 在项目中实现应用状态管理
    - 在 `management-vue-project/src/stores/` 中创建 app.ts
    - 定义应用状态 (sidebarCollapsed, loading)
    - 实现 toggleSidebar action - 切换侧边栏
    - 实现 setLoading action - 设置加载状态
    - _Requirements: 10.3_

- [x] 5. 组合式函数实现 (Composables)
  - [x] 5.1 在项目中实现 useTable 组合函数
    - 在 `management-vue-project/src/composables/` 中创建 useTable.ts
    - 定义表格状态 (data, loading, total, currentPage, pageSize)
    - 实现 loadData 方法 - 加载数据
    - 实现 handlePageChange 方法 - 处理页码变化
    - 实现 handleSizeChange 方法 - 处理每页大小变化
    - 实现 refresh 方法 - 刷新数据
    - _Requirements: 1.2, 11.1_

  - [x] 5.2 在项目中实现 useDialog 组合函数
    - 在 `management-vue-project/src/composables/` 中创建 useDialog.ts
    - 定义对话框状态 (visible, loading)
    - 实现 open 方法 - 打开对话框
    - 实现 close 方法 - 关闭对话框
    - 实现 setLoading 方法 - 设置加载状态
    - _Requirements: 2.1, 10.3_

  - [x] 5.3 在项目中实现 usePermission 组合函数
    - 在 `management-vue-project/src/composables/` 中创建 usePermission.ts
    - 实现 hasPermission 方法 - 检查单个权限
    - 实现 hasAnyPermission 方法 - 检查任意权限
    - 实现 hasAllPermissions 方法 - 检查所有权限
    - _Requirements: 12.2_

- [x] 6. 公共组件实现
  - [x] 6.1 在项目中实现 PageHeader 组件
    - 在 `management-vue-project/src/components/common/` 中创建 PageHeader.vue
    - 显示页面标题
    - 显示操作按钮区域
    - 支持自定义插槽
    - _Requirements: 10.1_

  - [x] 6.2 在项目中实现 SearchBar 组件
    - 在 `management-vue-project/src/components/common/` 中创建 SearchBar.vue
    - 显示搜索表单
    - 支持多个搜索字段
    - 实现搜索和重置功能
    - _Requirements: 1.1_

  - [x] 6.3 在项目中实现 EmptyState 组件
    - 在 `management-vue-project/src/components/common/` 中创建 EmptyState.vue
    - 显示空状态图标和文字
    - 支持自定义提示信息
    - 提供操作按钮插槽
    - _Requirements: 1.3_

- [x] 7. 业务组件实现
  - [x] 7.1 在项目中实现 RoleForm 组件
    - 在 `management-vue-project/src/components/role/` 中创建 RoleForm.vue
    - 创建表单布局（角色名称、角色标识、描述、状态）
    - 实现表单验证规则
    - 实现新增和编辑模式切换
    - 实现表单提交和取消逻辑
    - 显示加载状态
    - _Requirements: 2.1, 2.3, 2.6, 3.1_

  - [x] 7.2 编写 RoleForm 组件单元测试
    - 在 `management-vue-project/src/components/role/__tests__/` 中创建测试文件
    - 测试表单字段渲染
    - 测试表单验证
    - 测试表单提交事件
    - _Requirements: 2.6_

  - [x] 7.3 在项目中实现 MenuForm 组件
    - 在 `management-vue-project/src/components/menu/` 中创建 MenuForm.vue
    - 创建表单布局（菜单名称、路由路径、组件路径、图标、排序等）
    - 实现图标选择器
    - 实现父菜单选择（防止循环引用）
    - 实现表单验证规则
    - 实现新增和编辑模式切换
    - 实现表单提交和取消逻辑
    - _Requirements: 6.1, 6.3, 6.6, 7.1, 7.4_

  - [x] 7.4 编写 MenuForm 组件单元测试
    - 在 `management-vue-project/src/components/menu/__tests__/` 中创建测试文件
    - 测试表单字段渲染
    - 测试循环引用防止逻辑
    - 测试表单验证
    - _Requirements: 7.4_

  - [x] 7.5 在项目中实现 PermissionSelector 组件
    - 在 `management-vue-project/src/components/permission/` 中创建 PermissionSelector.vue
    - 显示权限列表（支持多选）
    - 实现搜索功能
    - 实现按类型筛选
    - 显示已选权限
    - 实现确认和取消逻辑
    - _Requirements: 9.1, 9.3, 9.7, 9.8_

  - [x] 7.6 编写 PermissionSelector 组件单元测试
    - 在 `management-vue-project/src/components/permission/__tests__/` 中创建测试文件
    - 测试权限列表渲染
    - 测试搜索功能
    - 测试筛选功能
    - _Requirements: 9.7, 9.8_

- [x] 8. 页面组件实现 - 角色管理
  - [x] 8.1 在项目中实现角色管理页面布局
    - 在 `management-vue-project/src/views/role/` 中创建 RoleManagement.vue
    - 创建页面容器和头部
    - 添加搜索栏
    - 添加数据表格
    - 添加分页组件
    - 应用科技感样式（毛玻璃、发光效果、渐变）
    - _Requirements: 1.1, 10.1_

  - [x] 8.2 实现角色列表加载
    - 调用 getRoles API 加载数据
    - 显示加载状态
    - 处理空数据状态
    - 处理错误状态
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 8.3 实现角色新增功能
    - 点击新增按钮打开 RoleForm 对话框
    - 提交表单调用 createRole API
    - 显示成功提示并刷新列表
    - 处理错误（如角色标识已存在）
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 8.4 实现角色编辑功能
    - 点击编辑按钮打开 RoleForm 对话框并填充数据
    - 提交表单调用 updateRole API
    - 显示成功提示并刷新列表
    - 处理错误
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.5 实现角色删除功能
    - 点击删除按钮显示确认对话框
    - 确认后调用 deleteRole API
    - 显示成功提示并刷新列表
    - 处理错误
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.6 实现角色权限分配功能
    - 点击分配权限按钮打开 PermissionSelector 对话框
    - 加载该角色已有权限并勾选
    - 提交时调用 assignPermissionsToRole API
    - 显示成功提示
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 8.7 编写角色管理页面集成测试
    - 在 `management-vue-project/tests/integration/` 中创建测试文件
    - 测试完整的增删改查流程
    - 测试权限分配流程
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 9.1_

- [x] 9. 页面组件实现 - 菜单管理
  - [x] 9.1 在项目中实现菜单管理页面布局
    - 在 `management-vue-project/src/views/menu/` 中创建 MenuManagement.vue
    - 创建页面容器和头部
    - 添加树形表格
    - 应用科技感样式
    - _Requirements: 5.1, 10.1_

  - [x] 9.2 实现菜单树加载
    - 调用 getMenus API 加载数据
    - 构建树形结构
    - 显示展开/折叠图标
    - 显示加载状态
    - 处理空数据状态
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [x] 9.3 实现菜单新增功能
    - 点击新增顶级菜单按钮打开 MenuForm 对话框（parentId=0）
    - 点击新增子菜单按钮打开 MenuForm 对话框（parentId=当前菜单ID）
    - 提交表单调用 createMenu API
    - 显示成功提示并刷新菜单树
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

  - [x] 9.4 实现菜单编辑功能
    - 点击编辑按钮打开 MenuForm 对话框并填充数据
    - 提交表单调用 updateMenu API
    - 显示成功提示并刷新菜单树
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 9.5 实现菜单删除功能
    - 检查是否有子菜单，有则显示错误提示
    - 无子菜单时显示确认对话框
    - 确认后调用 deleteMenu API
    - 显示成功提示并刷新菜单树
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.6 实现菜单权限关联功能
    - 点击关联权限按钮打开权限选择对话框
    - 加载该菜单已关联权限
    - 提交时调用 associateMenuPermission 或 disassociateMenuPermission API
    - 显示成功提示
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 9.7 编写菜单管理页面集成测试
    - 在 `management-vue-project/tests/integration/` 中创建测试文件
    - 测试完整的增删改查流程
    - 测试树形结构渲染
    - 测试权限关联流程
    - _Requirements: 5.1, 6.1, 7.1, 8.1, 13.1_


- [x] 10. 页面组件实现 - 权限管理
  - [x] 10.1 在项目中实现权限管理页面布局
    - 在 `management-vue-project/src/views/permission/` 中创建 PermissionManagement.vue
    - 创建页面容器和头部
    - 添加搜索栏（支持按类型筛选）
    - 添加数据表格
    - 添加分页组件
    - 应用科技感样式
    - _Requirements: 15.1, 10.1_

  - [x] 10.2 实现权限列表加载
    - 调用 getPermissions API 加载数据
    - 显示加载状态
    - 处理空数据状态
    - _Requirements: 15.2_

  - [x] 10.3 实现权限新增功能
    - 点击新增按钮打开权限表单对话框
    - 提交表单调用 createPermission API
    - 显示成功提示并刷新列表
    - _Requirements: 15.3, 15.4, 15.5_

  - [x] 10.4 实现权限编辑功能
    - 点击编辑按钮打开权限表单对话框并填充数据
    - 提交表单调用 updatePermission API
    - 显示成功提示并刷新列表
    - _Requirements: 15.6_

  - [x] 10.5 实现权限删除功能
    - 点击删除按钮显示确认对话框
    - 确认后调用 deletePermission API
    - 显示成功提示并刷新列表
    - _Requirements: 15.7_

  - [x] 10.6 实现权限筛选和搜索
    - 实现按资源类型筛选（menu/button/api）
    - 实现按权限名称或标识搜索
    - _Requirements: 15.8, 15.9_

  - [x] 10.7 编写权限管理页面集成测试
    - 在 `management-vue-project/tests/integration/` 中创建测试文件
    - 测试完整的增删改查流程
    - 测试筛选和搜索功能
    - _Requirements: 15.1, 15.3, 15.6, 15.7_

- [x] 11. 路由配置和权限控制
  - [x] 11.1 在项目中配置路由
    - 在 `management-vue-project/src/router/` 中添加或更新路由配置
    - 定义主布局路由
    - 定义角色管理路由（需要权限）
    - 定义菜单管理路由（需要权限）
    - 定义权限管理路由（需要权限）
    - 定义 404 路由
    - _Requirements: 12.2, 12.3_

  - [x] 11.2 实现路由守卫
    - 检查登录状态，未登录跳转登录页
    - 检查页面权限，无权限跳转 403 页面
    - 设置页面标题
    - _Requirements: 11.3, 12.2_

  - [x] 11.3 编写路由守卫单元测试
    - 测试未登录跳转
    - 测试权限检查
    - _Requirements: 11.3, 12.2_

- [x] 12. 全局样式和主题
  - [x] 12.1 创建全局样式文件
    - 定义颜色变量（科技蓝色系）
    - 定义排版变量
    - 定义间距变量
    - 定义阴影变量
    - _Requirements: UI/UX 设计_

  - [x] 12.2 实现科技感样式组件
    - 实现毛玻璃效果样式
    - 实现发光效果样式
    - 实现渐变背景样式
    - 实现悬浮卡片样式
    - 实现数据徽章样式
    - 实现微交互动画
    - _Requirements: UI/UX 设计_

  - [x] 12.3 配置 Element Plus 主题
    - 覆盖 Element Plus 默认颜色
    - 自定义组件样式（按钮、表格、对话框等）
    - 确保与科技感设计一致
    - _Requirements: UI/UX 设计_

- [x] 13. 响应式布局实现
  - [x] 13.1 实现响应式断点
    - 定义断点变量（xs, sm, md, lg, xl）
    - 创建响应式 mixin
    - _Requirements: 10.1, 10.2_

  - [x] 13.2 适配移动端布局
    - 调整页面容器 padding
    - 隐藏次要表格列
    - 调整按钮大小和间距
    - 优化表单布局
    - _Requirements: 10.2_

  - [x] 13.3 编写响应式布局测试
    - 测试不同屏幕尺寸下的布局
    - _Requirements: 10.1, 10.2_

- [x] 14. 错误处理和用户反馈
  - [x] 14.1 实现全局错误处理
    - 配置 Vue 全局错误处理器
    - 记录错误日志
    - 显示友好的错误提示
    - _Requirements: 1.4, 错误处理_

  - [x] 14.2 实现加载状态管理
    - 在所有 API 调用时显示加载状态
    - 防止重复提交
    - _Requirements: 10.3, 10.4_

  - [x] 14.3 实现成功/错误提示
    - 统一使用 ElMessage 显示提示
    - 配置提示样式和持续时间
    - _Requirements: 2.4, 3.3, 4.3_

  - [x] 14.4 编写错误处理单元测试
    - 测试网络错误处理
    - 测试业务错误处理
    - _Requirements: 1.4, 错误处理_

- [x] 15. 性能优化
  - [x] 15.1 实现路由懒加载
    - 所有页面组件使用动态导入
    - 配置代码分割
    - _Requirements: 性能优化_

  - [x] 15.2 实现防抖和节流
    - 搜索输入使用防抖
    - 滚动事件使用节流
    - _Requirements: 性能优化_

  - [x] 15.3 优化表格渲染
    - 大数据量时考虑虚拟滚动
    - 优化表格列渲染
    - _Requirements: 性能优化_

- [x] 16. 安全加固
  - [x] 16.1 实现 XSS 防护
    - 避免使用 v-html 显示用户输入
    - 必要时使用 DOMPurify 清理 HTML
    - _Requirements: 安全考虑_

  - [x] 16.2 实现输入验证
    - 前端验证所有用户输入
    - 清理潜在危险字符
    - _Requirements: 2.6, 安全考虑_

  - [x] 16.3 实现安全存储
    - Token 存储使用加密（可选）
    - 敏感信息不存储在 localStorage
    - _Requirements: 11.2, 安全考虑_

- [x] 17. 测试和质量保证
  - [x] 17.1 编写单元测试
    - 测试工具函数
    - 测试组合式函数
    - 测试组件逻辑
    - 目标覆盖率 > 80%
    - _Requirements: 测试策略_

  - [x] 17.2 编写集成测试
    - 测试完整的用户流程
    - 测试组件间交互
    - _Requirements: 测试策略_

  - [x] 17.3 编写 E2E 测试
    - 测试角色管理完整流程
    - 测试菜单管理完整流程
    - 测试权限管理完整流程
    - _Requirements: 测试策略_

  - [x] 17.4 编写属性测试
    - **Property 4: Form validation should reject invalid inputs**
    - **Validates: Requirements 2.6**
    - 使用 fast-check 生成随机无效输入
    - 验证表单验证函数正确拒绝所有无效输入
    - 运行 100 次迭代

  - [x] 17.5 编写属性测试
    - **Property 7: Circular reference prevention**
    - **Validates: Requirements 7.4**
    - 使用 fast-check 生成随机菜单 ID 和祖先 ID 列表
    - 验证系统正确防止循环引用
    - 运行 100 次迭代

  - [x] 17.6 编写属性测试
    - **Property 11: Permission-based UI rendering**
    - **Validates: Requirements 12.2**
    - 使用 fast-check 生成随机用户权限集合
    - 验证 UI 元素根据权限正确显示/隐藏
    - 运行 100 次迭代

- [x] 18. 构建和部署配置
  - [x] 18.1 配置生产环境构建
    - 配置 Vite 构建选项
    - 启用代码压缩和混淆
    - 配置代码分割策略
    - 移除 console 和 debugger
    - _Requirements: 部署配置_

  - [x] 18.2 创建 Docker 配置
    - 编写 Dockerfile（多阶段构建）
    - 编写 nginx 配置文件
    - 配置 API 代理
    - _Requirements: 部署配置_

  - [x] 18.3 配置环境变量
    - 配置开发环境变量
    - 配置生产环境变量
    - 文档化环境变量说明
    - _Requirements: 部署配置_

- [x] 19. 文档和代码规范
  - [x] 19.1 编写组件文档
    - 为每个组件添加 JSDoc 注释
    - 说明 Props、Emits、Slots
    - 提供使用示例
    - _Requirements: 可维护性_

  - [x] 19.2 编写 API 文档
    - 文档化所有 API 函数
    - 说明参数和返回值
    - 提供调用示例
    - _Requirements: 可维护性_

  - [x] 19.3 编写 README
    - 项目介绍和功能说明
    - 技术栈说明
    - 安装和运行指南
    - 构建和部署指南
    - _Requirements: 可维护性_

- [x] 20. 最终检查和优化
  - [x] 20.1 代码审查
    - 检查代码规范一致性
    - 检查类型定义完整性
    - 检查错误处理完整性
    - 移除未使用的代码和依赖
    - _Requirements: 可维护性_

  - [x] 20.2 性能测试
    - 使用 Lighthouse 测试性能
    - 优化首屏加载时间
    - 优化资源大小
    - _Requirements: 性能优化_

  - [x] 20.3 浏览器兼容性测试
    - 测试 Chrome、Firefox、Safari、Edge
    - 修复兼容性问题
    - _Requirements: 10.1_

  - [x] 20.4 无障碍访问测试
    - 测试键盘导航
    - 测试屏幕阅读器
    - 添加必要的 ARIA 标签
    - _Requirements: 无障碍访问_

- [x] 21. 最终验收
  - 确保所有测试通过
  - 确保所有功能正常工作
  - 确保 UI 符合设计要求
  - 确保性能达标
  - 准备交付

## Notes

- 所有测试任务都是必须完成的，以确保代码质量和系统稳定性
- 每个任务都引用了具体的需求，确保可追溯性
- 属性测试使用 fast-check 框架，每个测试运行 100 次迭代
- 单元测试和集成测试使用 Vitest 框架
- E2E 测试使用 Playwright 框架
- 科技感 UI 设计贯穿整个实现过程
- 注重代码质量、性能和安全性
- 测试覆盖率目标 > 80%
