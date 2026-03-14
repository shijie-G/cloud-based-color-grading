# 需求文档 - 登录页面

## 简介

本文档定义了用户登录页面的功能需求。登录页面是用户访问系统的入口，负责验证用户身份并获取访问令牌。该功能基于 Vue 3 + TypeScript + Element Plus 技术栈实现，与后端认证服务集成。

## 术语表

- **Login_Page**: 用户登录页面组件
- **Login_Form**: 登录表单组件，包含账号（手机号或邮箱）和密码输入字段
- **Auth_Service**: 后端认证服务，提供用户登录接口
- **User_Store**: Pinia 状态管理存储，用于管理用户登录状态和信息
- **Router**: Vue Router 路由管理器
- **Token**: JWT 访问令牌，用于后续 API 请求的身份验证
- **Valid_Credentials**: 有效的用户凭证，包含有效格式的账号（手机号或邮箱）和密码
- **Phone_Number**: 中国手机号，格式为 1 开头的 11 位数字
- **Email_Address**: 邮箱地址，符合标准邮箱格式（例如：user@example.com）

## 需求

### 需求 1: 登录表单展示

**用户故事:** 作为用户，我想看到一个清晰的登录表单，以便我可以输入凭证登录系统。

#### 验收标准

1. THE Login_Page SHALL 展示一个包含账号输入框、密码输入框和登录按钮的表单
2. THE Account_Input SHALL 支持输入手机号或邮箱地址
3. THE Login_Page SHALL 在页面中央垂直和水平居中显示登录表单
4. THE Login_Form SHALL 设置宽度为 400px
5. THE Login_Page SHALL 在表单顶部显示系统标题或 Logo
6. THE Password_Input SHALL 以密码形式隐藏输入的字符

### 需求 2: 表单验证

**用户故事:** 作为用户，我想在提交前验证输入，以便及时发现并纠正错误。

#### 验收标准

1. WHEN 账号输入框失去焦点且为空时，THE Login_Form SHALL 显示"请输入手机号或邮箱"错误提示
2. WHEN 密码输入框失去焦点且为空时，THE Login_Form SHALL 显示"请输入密码"错误提示
3. WHEN 账号输入框内容不为空且不符合手机号格式（正则：^1\d{10}$）也不符合邮箱格式（正则：^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$）时，THE Login_Form SHALL 显示"请输入有效的手机号或邮箱地址"错误提示
4. WHEN 密码长度小于 6 个字符时，THE Login_Form SHALL 显示"密码至少 6 个字符"错误提示
5. WHILE 表单存在验证错误时，THE Login_Button SHALL 保持禁用状态

### 需求 3: 用户登录

**用户故事:** 作为用户，我想使用手机号或邮箱和密码登录，以便访问系统功能。

#### 验收标准

1. WHEN 用户点击登录按钮且表单验证通过时，THE Login_Form SHALL 向 Auth_Service 发送 POST 请求到 http://localhost:8080/auth/login 接口
2. THE Login_Form SHALL 在请求体中包含 username 字段（值为用户输入的手机号或邮箱）和 password 字段
3. WHEN 登录请求发送后，THE Login_Button SHALL 显示加载状态并禁用按钮
4. WHEN Auth_Service 返回成功响应（状态码 200）时，THE User_Store SHALL 保存 token、userId、username、nickname、roles、permissions 和 menus 数据
5. WHEN 用户信息保存成功后，THE Router SHALL 导航到首页路由

### 需求 4: 错误处理

**用户故事:** 作为用户，我想在登录失败时看到明确的错误信息，以便了解失败原因并采取相应措施。

#### 验收标准

1. WHEN Auth_Service 返回 401 错误时，THE Login_Form SHALL 显示"手机号/邮箱或密码错误"消息
2. WHEN Auth_Service 返回 403 错误时，THE Login_Form SHALL 显示"账户已被锁定或禁用，请联系管理员"消息
3. WHEN Auth_Service 返回 500 错误时，THE Login_Form SHALL 显示"登录失败，请稍后重试"消息
4. WHEN 网络请求失败时，THE Login_Form SHALL 显示"网络连接失败，请检查网络设置"消息
5. WHEN 登录失败后，THE Login_Button SHALL 恢复可点击状态

### 需求 5: Token 持久化

**用户故事:** 作为用户，我想在刷新页面后保持登录状态，以便不需要重复登录。

#### 验收标准

1. WHEN 登录成功后，THE User_Store SHALL 将 token 存储到浏览器的 localStorage 中
2. WHEN 登录成功后，THE User_Store SHALL 将用户信息（userId、username、nickname、roles、permissions）存储到浏览器的 localStorage 中
3. WHEN 应用初始化时，THE User_Store SHALL 从 localStorage 读取 token 和用户信息（userId、username、nickname、roles、permissions）
4. WHEN localStorage 中存在有效 token 时，THE Router SHALL 允许访问受保护的路由
5. WHEN 用户退出登录时，THE User_Store SHALL 清除 localStorage 中的 token 和用户信息（userId、username、nickname、roles、permissions）

### 需求 6: 路由守卫

**用户故事:** 作为系统，我想保护需要认证的页面，以便未登录用户无法访问。

#### 验收标准

1. WHEN 用户访问受保护路由且未登录时，THE Router SHALL 重定向到登录页面
2. WHEN 用户已登录且访问登录页面时，THE Router SHALL 重定向到首页
3. THE Router SHALL 在重定向到登录页面时保存原始目标路由
4. WHEN 登录成功后，THE Router SHALL 导航到原始目标路由或默认首页

### 需求 7: 用户体验优化

**用户故事:** 作为用户，我想获得流畅的登录体验，以便快速完成登录操作。

#### 验收标准

1. WHEN 用户在账号或密码输入框中按下 Enter 键时，THE Login_Form SHALL 触发登录操作
2. WHEN 页面加载完成时，THE Login_Form SHALL 自动聚焦到账号输入框
3. THE Login_Form SHALL 在登录成功时显示成功提示消息
4. THE Login_Form SHALL 使用 Element Plus 的 Message 组件显示所有提示消息

### 需求 8: HTTP 请求配置

**用户故事:** 作为开发者，我想配置 Axios 实例，以便统一处理 API 请求和响应。

#### 验收标准

1. THE Axios_Instance SHALL 配置 baseURL 为 http://localhost:8080
2. THE Axios_Instance SHALL 配置请求超时时间为 10000 毫秒
3. WHEN 发送请求时，THE Axios_Instance SHALL 在请求头中自动添加 Authorization 字段（值为 "Bearer {token}"）
4. WHEN 发送请求时，THE Axios_Instance SHALL 在请求头中自动添加 X-User-Id 字段（值为当前用户 ID）
5. WHEN 响应状态码为 401 时，THE Axios_Instance SHALL 清除本地存储的 token 和用户信息并重定向到登录页面
