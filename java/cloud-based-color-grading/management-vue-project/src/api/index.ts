/**
 * API 服务层统一导出
 * 提供认证、用户、角色、菜单、权限相关的 API 接口
 */

// 认证相关 API
export {
  login,
  logout,
  refreshToken
} from './auth'

// 用户相关 API
export {
  getUserInfo,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from './user'

// 角色相关 API
export {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionsToRole,
  assignRolesToUser,
  removeRoleFromUser
} from './role'

// 菜单相关 API
export {
  getMenus,
  getMenuById,
  getUserMenuTree,
  createMenu,
  updateMenu,
  deleteMenu,
  associateMenuPermission,
  disassociateMenuPermission
} from './menu'

// 权限相关 API
export {
  getPermissions,
  getPermissionById,
  getUserPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from './permission'
