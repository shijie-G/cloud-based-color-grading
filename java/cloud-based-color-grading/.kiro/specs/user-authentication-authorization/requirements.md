# 需求文档

## 简介

用户认证授权系统为云端调色平台提供完整的用户身份验证、权限管理和菜单访问控制功能。系统支持用户登录、JWT令牌管理、基于角色的访问控制（RBAC）以及动态菜单权限分配。

## 整体架构

系统采用微服务架构，主要包含以下组件：

### 架构层次

```
客户端（前端应用）
    ↓
API网关（Gateway）
    ├─ 认证过滤器（JWT验证）
    ├─ 授权过滤器（权限检查）
    └─ 路由转发
    ↓
后端微服务
    ├─ 认证服务（Auth Service）
    │   ├─ 用户登录
    │   ├─ 令牌管理
    │   └─ 用户管理
    ├─ 授权服务（Authorization Service）
    │   ├─ 角色管理
    │   ├─ 权限管理
    │   └─ 菜单管理
    └─ 业务服务（其他微服务）
    ↓
数据层
    ├─ MySQL（用户、角色、权限数据）
    └─ Redis（令牌缓存、会话管理）
```

### 核心流程

1. **登录流程**：用户提交凭证 → 认证服务验证 → 生成JWT令牌 → 存储到Redis → 返回令牌和菜单
2. **请求认证流程**：客户端请求 → 网关提取令牌 → 验证令牌有效性 → 检查权限 → 转发到后端服务
3. **权限检查流程**：提取用户角色 → 查询角色权限 → 匹配请求资源 → 允许或拒绝访问

### 技术选型

- **Spring Boot 3.2.10**：应用框架
- **Spring Cloud Gateway**：API网关
- **Spring Security**：安全框架
- **JWT（jjwt库）**：令牌生成和验证
- **Redis**：令牌和会话缓存
- **MySQL**：用户和权限数据持久化
- **MyBatis-Plus**：数据访问层

## 完整业务逻辑

### 1. 用户登录完整流程

```
步骤1：用户提交登录请求
  - 输入：用户名、密码
  - 请求到达网关（登录接口在白名单中，跳过认证）
  
步骤2：网关转发到认证服务
  - 网关直接转发到认证服务的登录接口
  
步骤3：认证服务验证凭证
  - 从数据库查询用户信息
  - 检查用户是否存在
  - 检查账户是否被锁定
  - 使用BCrypt验证密码
  - 如果失败：
    * 记录失败次数到Redis（key: login:fail:{username}）
    * 如果失败次数≥5次，锁定账户15分钟
    * 返回错误信息
  
步骤4：生成JWT令牌
  - 载荷包含：用户ID、用户名、角色列表、过期时间
  - 使用密钥签名
  - 设置过期时间（默认2小时）
  
步骤5：存储令牌到Redis
  - Key: token:{userId}
  - Value: JWT令牌字符串
  - 过期时间：2小时
  
步骤6：查询用户菜单权限
  - 根据用户角色查询所有权限
  - 根据权限查询可访问的菜单
  - 构建树形菜单结构
  
步骤7：返回登录响应
  - JWT令牌
  - 用户基本信息
  - 菜单树
  - 权限列表
  
步骤8：清除失败记录
  - 删除Redis中的登录失败计数
```

### 2. 请求认证授权完整流程

```
步骤1：客户端发起请求
  - 请求头携带：Authorization: Bearer {JWT_TOKEN}
  
步骤2：网关认证过滤器拦截
  - 提取Authorization头
  - 检查请求路径是否在白名单中
  - 如果在白名单：直接放行
  - 如果不在白名单：继续验证
  
步骤3：JWT令牌验证
  - 解析JWT令牌
  - 验证签名是否正确
  - 验证是否过期
  - 如果验证失败：返回401错误
  
步骤4：Redis令牌校验
  - 从令牌中提取用户ID
  - 查询Redis: token:{userId}
  - 比对Redis中的令牌与请求令牌是否一致
  - 如果不一致（可能已登出或被踢出）：返回401错误
  
步骤5：权限验证
  - 从令牌中提取用户角色
  - 查询Redis缓存的权限信息（key: permission:{userId}）
  - 如果缓存不存在，从数据库加载并缓存
  - 根据请求路径匹配所需权限
  - 检查用户是否具有所需权限
  - 如果无权限：返回403错误
  
步骤6：令牌续期检查
  - 检查令牌剩余有效期
  - 如果剩余时间<30分钟：
    * 生成新令牌
    * 更新Redis中的令牌
    * 在响应头中返回新令牌
  
步骤7：添加用户信息到请求头
  - X-User-Id: 用户ID
  - X-User-Name: 用户名
  - X-User-Roles: 角色列表（逗号分隔）
  
步骤8：转发到后端服务
  - 网关将请求转发到目标微服务
  - 后端服务可直接从请求头获取用户信息
```

### 3. 权限管理完整逻辑

```
数据模型关系：
  用户(User) ←→ 用户角色关联(UserRole) ←→ 角色(Role)
  角色(Role) ←→ 角色权限关联(RolePermission) ←→ 权限(Permission)
  权限(Permission) ←→ 菜单权限关联(MenuPermission) ←→ 菜单(Menu)

权限检查逻辑：
  1. 根据用户ID查询所有角色
  2. 根据角色ID列表查询所有权限
  3. 权限去重（一个用户可能通过多个角色获得同一权限）
  4. 将权限列表缓存到Redis（过期时间30分钟）
  5. 匹配请求路径与权限资源标识符
  6. 返回是否有权限

菜单加载逻辑：
  1. 根据用户权限查询所有可访问菜单
  2. 按父子关系构建树形结构
  3. 按排序字段排序
  4. 返回菜单树（包含菜单ID、名称、图标、路由、子菜单）
```

### 4. 角色权限动态更新逻辑

```
场景1：管理员修改用户角色
  1. 更新数据库中的用户角色关联
  2. 删除Redis中的权限缓存（key: permission:{userId}）
  3. 用户下次请求时会重新加载权限
  
场景2：管理员修改角色权限
  1. 更新数据库中的角色权限关联
  2. 查询所有拥有该角色的用户
  3. 批量删除这些用户的权限缓存
  4. 这些用户下次请求时会重新加载权限
  
场景3：管理员修改菜单权限关联
  1. 更新数据库中的菜单权限关联
  2. 前端需要重新调用获取菜单接口
  3. 返回更新后的菜单树
```

### 5. 安全防护逻辑

```
防暴力破解：
  - 使用Redis记录登录失败次数
  - Key: login:fail:{username}
  - 每次失败：计数+1，设置过期时间15分钟
  - 达到5次：锁定账户，Key: account:locked:{username}，过期时间15分钟
  - 登录成功：删除失败计数

密码加密：
  - 注册/重置密码时使用BCrypt加密
  - BCrypt自动加盐，每次加密结果不同
  - 验证时使用BCrypt.matches()方法

令牌安全：
  - JWT使用HS256算法签名
  - 密钥存储在配置文件中，不硬编码
  - 令牌包含过期时间，过期自动失效
  - 用户登出时从Redis删除令牌

会话管理：
  - 同一用户只能有一个有效令牌（单点登录）
  - 新登录会覆盖旧令牌
  - 修改密码后所有令牌失效
```

### 6. 数据库表结构

```
用户表 (sys_user)：
  - id: 主键
  - username: 用户名（唯一）
  - password: 加密后的密码
  - nickname: 昵称
  - email: 邮箱
  - phone: 手机号
  - status: 状态（0正常 1禁用）
  - create_time: 创建时间
  - last_login_time: 最后登录时间

角色表 (sys_role)：
  - id: 主键
  - role_name: 角色名称
  - role_key: 角色标识（如ROLE_ADMIN）
  - description: 描述
  - status: 状态
  - create_time: 创建时间

权限表 (sys_permission)：
  - id: 主键
  - permission_name: 权限名称
  - permission_key: 权限标识（如system:user:add）
  - resource_type: 资源类型（menu/button/api）
  - resource_path: 资源路径
  - method: HTTP方法（GET/POST/PUT/DELETE）
  - description: 描述

菜单表 (sys_menu)：
  - id: 主键
  - parent_id: 父菜单ID
  - menu_name: 菜单名称
  - menu_path: 路由路径
  - component: 组件路径
  - icon: 图标
  - sort_order: 排序
  - visible: 是否可见
  - status: 状态

用户角色关联表 (sys_user_role)：
  - user_id: 用户ID
  - role_id: 角色ID

角色权限关联表 (sys_role_permission)：
  - role_id: 角色ID
  - permission_id: 权限ID

菜单权限关联表 (sys_menu_permission)：
  - menu_id: 菜单ID
  - permission_id: 权限ID
```

## 术语表

- **Authentication_Service**: 认证服务，负责处理用户登录、令牌生成和验证
- **Authorization_Service**: 授权服务，负责权限检查和访问控制
- **User**: 系统用户，具有唯一标识和凭证
- **Role**: 角色，用户权限的集合
- **Permission**: 权限，对特定资源或操作的访问权限
- **Menu**: 菜单项，系统功能的导航入口
- **JWT_Token**: JSON Web Token，用于无状态身份验证的令牌
- **Gateway_Filter**: 网关过滤器，在Spring Cloud Gateway中拦截和处理请求
- **Redis_Cache**: Redis缓存，用于存储令牌和会话信息

## 需求

### 需求 1：用户登录认证

**用户故事：** 作为系统用户，我想要使用用户名和密码登录系统，以便访问平台功能。

#### 验收标准

1. WHEN 用户提交有效的用户名和密码 THEN THE Authentication_Service SHALL 验证凭证并生成JWT_Token
2. WHEN 用户提交无效的用户名或密码 THEN THE Authentication_Service SHALL 返回认证失败错误并记录失败尝试
3. WHEN 用户成功登录 THEN THE Authentication_Service SHALL 将JWT_Token存储到Redis_Cache中并设置过期时间
4. WHEN 用户登录失败超过5次 THEN THE Authentication_Service SHALL 锁定账户15分钟
5. THE JWT_Token SHALL 包含用户ID、用户名、角色信息和过期时间

### 需求 2：令牌验证和刷新

**用户故事：** 作为系统用户，我想要系统自动验证我的登录状态，以便在令牌有效期内无需重复登录。

#### 验收标准

1. WHEN 请求包含有效的JWT_Token THEN THE Gateway_Filter SHALL 验证令牌签名和过期时间
2. WHEN 请求包含过期的JWT_Token THEN THE Gateway_Filter SHALL 返回401未授权错误
3. WHEN 请求包含无效的JWT_Token THEN THE Gateway_Filter SHALL 返回401未授权错误并记录安全事件
4. WHEN JWT_Token即将过期（剩余时间少于30分钟）且用户活跃 THEN THE Authentication_Service SHALL 自动刷新令牌
5. WHEN 用户主动登出 THEN THE Authentication_Service SHALL 从Redis_Cache中删除JWT_Token

### 需求 3：基于角色的访问控制

**用户故事：** 作为系统管理员，我想要为用户分配不同的角色，以便控制他们对系统功能的访问权限。

#### 验收标准

1. WHEN 创建用户 THEN THE Authorization_Service SHALL 允许分配一个或多个Role
2. WHEN 用户访问受保护的资源 THEN THE Authorization_Service SHALL 验证用户是否具有所需的Role
3. WHEN 用户没有所需的Role THEN THE Authorization_Service SHALL 返回403禁止访问错误
4. WHEN 管理员修改用户的Role THEN THE Authorization_Service SHALL 立即更新Redis_Cache中的权限信息
5. THE Authorization_Service SHALL 支持预定义角色：超级管理员、管理员、普通用户

### 需求 4：权限管理

**用户故事：** 作为系统管理员，我想要定义细粒度的权限，以便精确控制用户对特定功能的访问。

#### 验收标准

1. WHEN 定义Permission THEN THE Authorization_Service SHALL 包含资源标识符和操作类型（创建、读取、更新、删除）
2. WHEN Role被创建或修改 THEN THE Authorization_Service SHALL 允许关联多个Permission
3. WHEN 用户执行操作 THEN THE Authorization_Service SHALL 验证用户是否通过其Role拥有所需的Permission
4. WHEN 用户缺少所需的Permission THEN THE Authorization_Service SHALL 返回403禁止访问错误
5. THE Authorization_Service SHALL 支持权限继承，子角色继承父角色的所有权限

### 需求 5：动态菜单权限

**用户故事：** 作为系统用户，我想要看到我有权限访问的菜单项，以便快速导航到可用功能。

#### 验收标准

1. WHEN 用户登录成功 THEN THE Authorization_Service SHALL 返回用户可访问的Menu列表
2. WHEN Menu与Permission关联 THEN THE Authorization_Service SHALL 仅返回用户具有相应Permission的Menu
3. WHEN Menu具有父子层级关系 THEN THE Authorization_Service SHALL 返回完整的树形结构
4. WHEN 用户权限被修改 THEN THE Authorization_Service SHALL 在下次请求时返回更新后的Menu列表
5. THE Menu SHALL 包含菜单ID、名称、图标、路由路径和排序顺序

### 需求 6：网关集成

**用户故事：** 作为系统架构师，我想要在API网关层统一处理认证授权，以便保护所有微服务端点。

#### 验收标准

1. WHEN 请求到达Gateway THEN THE Gateway_Filter SHALL 首先验证JWT_Token
2. WHEN JWT_Token验证成功 THEN THE Gateway_Filter SHALL 将用户信息添加到请求头并转发到后端服务
3. WHEN 请求路径在白名单中（如登录接口）THEN THE Gateway_Filter SHALL 跳过认证检查
4. WHEN JWT_Token验证失败 THEN THE Gateway_Filter SHALL 直接返回错误响应而不转发请求
5. THE Gateway_Filter SHALL 支持配置化的路由权限规则

### 需求 7：安全增强

**用户故事：** 作为安全管理员，我想要系统具备基本的安全防护能力，以便防止常见的安全攻击。

#### 验收标准

1. WHEN 存储用户密码 THEN THE Authentication_Service SHALL 使用BCrypt算法加密
2. WHEN 生成JWT_Token THEN THE Authentication_Service SHALL 使用安全的密钥签名
3. WHEN 检测到异常登录行为（如短时间内多次失败）THEN THE Authentication_Service SHALL 触发安全告警
4. WHEN 用户修改密码 THEN THE Authentication_Service SHALL 使现有的所有JWT_Token失效
5. THE Authentication_Service SHALL 记录所有认证和授权相关的安全事件

### 需求 8：用户管理

**用户故事：** 作为系统管理员，我想要管理用户账户，以便维护系统的用户基础。

#### 验收标准

1. WHEN 创建用户 THEN THE Authentication_Service SHALL 验证用户名唯一性并设置初始密码
2. WHEN 查询用户列表 THEN THE Authentication_Service SHALL 支持分页和按用户名、角色筛选
3. WHEN 禁用用户 THEN THE Authentication_Service SHALL 使该用户的所有JWT_Token失效
4. WHEN 重置用户密码 THEN THE Authentication_Service SHALL 生成临时密码并要求用户首次登录时修改
5. THE Authentication_Service SHALL 记录用户的创建时间、最后登录时间和账户状态
