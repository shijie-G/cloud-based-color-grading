package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.common.entity.Role;

import java.util.List;

/**
 * 角色服务接口
 * 提供角色管理和角色权限关联功能
 */
public interface RoleService {
    
    /**
     * 创建角色
     * @param role 角色对象
     * @return 创建的角色
     */
    Role createRole(Role role);
    
    /**
     * 更新角色
     * @param role 角色对象
     * @return 更新的角色
     */
    Role updateRole(Role role);
    
    /**
     * 删除角色
     * @param roleId 角色ID
     */
    void deleteRole(Long roleId);
    
    /**
     * 根据ID查询角色
     * @param roleId 角色ID
     * @return 角色对象
     */
    Role getRoleById(Long roleId);
    
    /**
     * 查询所有角色
     * @return 角色列表
     */
    List<Role> getAllRoles();
    
    /**
     * 为角色分配权限
     * 会清除拥有该角色的所有用户的权限缓存
     * @param roleId 角色ID
     * @param permissionIds 权限ID列表
     */
    void assignPermissionsToRole(Long roleId, List<Long> permissionIds);
    
    /**
     * 为用户分配角色
     * 会清除该用户的权限缓存
     * @param userId 用户ID
     * @param roleIds 角色ID列表
     */
    void assignRolesToUser(Long userId, List<Long> roleIds);
    
    /**
     * 移除用户的角色
     * 会清除该用户的权限缓存
     * @param userId 用户ID
     * @param roleId 角色ID
     */
    void removeRoleFromUser(Long userId, Long roleId);
}
