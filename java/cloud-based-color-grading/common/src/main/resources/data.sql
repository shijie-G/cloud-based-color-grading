-- 用户认证授权系统初始数据

-- 插入初始角色
INSERT INTO sys_role (id, role_name, role_key, description, status) VALUES
(1, '超级管理员', 'ROLE_SUPER_ADMIN', '拥有系统所有权限', 0),
(2, '管理员', 'ROLE_ADMIN', '拥有系统管理权限', 0),
(3, '普通用户', 'ROLE_USER', '普通用户权限', 0);

-- 插入初始权限
INSERT INTO sys_permission (id, permission_name, permission_key, resource_type, resource_path, method, description) VALUES
-- 用户管理权限
(1, '查询用户', 'system:user:query', 'api', '/users', 'GET', '查询用户列表'),
(2, '创建用户', 'system:user:add', 'api', '/users', 'POST', '创建新用户'),
(3, '更新用户', 'system:user:edit', 'api', '/users/*', 'PUT', '更新用户信息'),
(4, '删除用户', 'system:user:delete', 'api', '/users/*', 'DELETE', '删除用户'),
(5, '重置密码', 'system:user:resetpwd', 'api', '/users/*/reset-password', 'POST', '重置用户密码'),

-- 角色管理权限
(6, '查询角色', 'system:role:query', 'api', '/roles', 'GET', '查询角色列表'),
(7, '创建角色', 'system:role:add', 'api', '/roles', 'POST', '创建新角色'),
(8, '更新角色', 'system:role:edit', 'api', '/roles/*', 'PUT', '更新角色信息'),
(9, '删除角色', 'system:role:delete', 'api', '/roles/*', 'DELETE', '删除角色'),
(10, '分配角色权限', 'system:role:permission', 'api', '/roles/*/permissions', 'POST', '为角色分配权限'),

-- 权限管理权限
(11, '查询权限', 'system:permission:query', 'api', '/permissions', 'GET', '查询权限列表'),
(12, '创建权限', 'system:permission:add', 'api', '/permissions', 'POST', '创建新权限'),
(13, '更新权限', 'system:permission:edit', 'api', '/permissions/*', 'PUT', '更新权限信息'),
(14, '删除权限', 'system:permission:delete', 'api', '/permissions/*', 'DELETE', '删除权限'),

-- 菜单管理权限
(15, '查询菜单', 'system:menu:query', 'api', '/menus', 'GET', '查询菜单列表'),
(16, '创建菜单', 'system:menu:add', 'api', '/menus', 'POST', '创建新菜单'),
(17, '更新菜单', 'system:menu:edit', 'api', '/menus/*', 'PUT', '更新菜单信息'),
(18, '删除菜单', 'system:menu:delete', 'api', '/menus/*', 'DELETE', '删除菜单'),

-- 认证相关权限
(19, '用户登录', 'system:auth:login', 'api', '/auth/login', 'POST', '用户登录'),
(20, '用户登出', 'system:auth:logout', 'api', '/auth/logout', 'POST', '用户登出'),
(21, '刷新令牌', 'system:auth:refresh', 'api', '/auth/refresh', 'POST', '刷新JWT令牌');

-- 插入初始菜单
INSERT INTO sys_menu (id, parent_id, menu_name, menu_path, component, icon, sort_order, visible, status) VALUES
-- 一级菜单
(1, 0, '系统管理', '/system', 'Layout', 'system', 1, 0, 0),
(2, 0, '工作台', '/dashboard', 'Dashboard', 'dashboard', 0, 0, 0),

-- 系统管理子菜单
(3, 1, '用户管理', '/system/user', 'system/user/index', 'user', 1, 0, 0),
(4, 1, '角色管理', '/system/role', 'system/role/index', 'role', 2, 0, 0),
(5, 1, '权限管理', '/system/permission', 'system/permission/index', 'permission', 3, 0, 0),
(6, 1, '菜单管理', '/system/menu', 'system/menu/index', 'menu', 4, 0, 0);

-- 超级管理员角色关联所有权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission;

-- 管理员角色关联部分权限（除了删除权限外）
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE permission_key NOT LIKE '%:delete';

-- 普通用户角色关联基础权限
INSERT INTO sys_role_permission (role_id, permission_id) VALUES
(3, 19), -- 登录
(3, 20), -- 登出
(3, 21); -- 刷新令牌

-- 菜单权限关联
INSERT INTO sys_menu_permission (menu_id, permission_id) VALUES
-- 工作台（所有用户可见）
(2, 19),

-- 用户管理菜单
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5),

-- 角色管理菜单
(4, 6), (4, 7), (4, 8), (4, 9), (4, 10),

-- 权限管理菜单
(5, 11), (5, 12), (5, 13), (5, 14),

-- 菜单管理菜单
(6, 15), (6, 16), (6, 17), (6, 18);

-- 插入超级管理员用户
-- 密码: admin123 (BCrypt加密后的值，实际使用时需要通过BCrypt生成)
-- 注意：这里使用的是BCrypt加密 "admin123" 的示例值
INSERT INTO sys_user (id, username, password, nickname, email, phone, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '超级管理员', 'admin@example.com', '13800138000', 0);

-- 关联超级管理员用户与超级管理员角色
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1);
