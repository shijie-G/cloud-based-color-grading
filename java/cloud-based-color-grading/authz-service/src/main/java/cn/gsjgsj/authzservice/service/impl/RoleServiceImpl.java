package cn.gsjgsj.authzservice.service.impl;

import cn.gsjgsj.authzservice.mapper.RoleMapper;
import cn.gsjgsj.authzservice.mapper.RolePermissionMapper;
import cn.gsjgsj.authzservice.mapper.UserRoleMapper;
import cn.gsjgsj.authzservice.service.PermissionService;
import cn.gsjgsj.authzservice.service.RoleService;
import cn.gsjgsj.common.entity.Role;
import cn.gsjgsj.common.entity.RolePermission;
import cn.gsjgsj.common.entity.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 角色服务实现类
 * 实现角色管理和角色权限关联功能
 */
@Service
public class RoleServiceImpl implements RoleService {
    
    private final RoleMapper roleMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final UserRoleMapper userRoleMapper;
    private final PermissionService permissionService;
    
    public RoleServiceImpl(RoleMapper roleMapper,
                          RolePermissionMapper rolePermissionMapper,
                          UserRoleMapper userRoleMapper,
                          PermissionService permissionService) {
        this.roleMapper = roleMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.userRoleMapper = userRoleMapper;
        this.permissionService = permissionService;
    }
    
    @Override
    public Role createRole(Role role) {
        roleMapper.insert(role);
        return role;
    }
    
    @Override
    public Role updateRole(Role role) {
        roleMapper.updateById(role);
        return role;
    }
    
    @Override
    @Transactional
    public void deleteRole(Long roleId) {
        // 删除角色权限关联
        rolePermissionMapper.deleteByRoleId(roleId);
        
        // 删除用户角色关联
        userRoleMapper.deleteByRoleId(roleId);
        
        // 删除角色
        roleMapper.deleteById(roleId);
    }
    
    @Override
    public Role getRoleById(Long roleId) {
        return roleMapper.selectById(roleId);
    }
    
    @Override
    public List<Role> getAllRoles() {
        return roleMapper.selectList(null);
    }
    
    /**
     * 为角色分配权限
     * 会清除拥有该角色的所有用户的权限缓存
     * @param roleId 角色ID
     * @param permissionIds 权限ID列表
     */
    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        // 删除角色的所有现有权限关联
        rolePermissionMapper.deleteByRoleId(roleId);
        
        // 添加新的权限关联
        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (Long permissionId : permissionIds) {
                RolePermission rolePermission = new RolePermission();
                rolePermission.setRoleId(roleId);
                rolePermission.setPermissionId(permissionId);
                rolePermissionMapper.insert(rolePermission);
            }
        }
        
        // 查询所有拥有该角色的用户
        List<Long> userIds = userRoleMapper.selectUserIdsByRoleId(roleId);
        
        // 批量清除这些用户的权限缓存
        if (userIds != null && !userIds.isEmpty()) {
            permissionService.clearUserPermissionCacheBatch(userIds);
        }
    }
    
    /**
     * 为用户分配角色
     * 会清除该用户的权限缓存
     * @param userId 用户ID
     * @param roleIds 角色ID列表
     */
    @Override
    @Transactional
    public void assignRolesToUser(Long userId, List<Long> roleIds) {
        // 删除用户的所有现有角色关联
        userRoleMapper.deleteByUserId(userId);
        
        // 添加新的角色关联
        if (roleIds != null && !roleIds.isEmpty()) {
            for (Long roleId : roleIds) {
                UserRole userRole = new UserRole();
                userRole.setUserId(userId);
                userRole.setRoleId(roleId);
                userRoleMapper.insert(userRole);
            }
        }
        
        // 清除用户的权限缓存
        permissionService.clearUserPermissionCache(userId);
    }
    
    /**
     * 移除用户的角色
     * 会清除该用户的权限缓存
     * @param userId 用户ID
     * @param roleId 角色ID
     */
    @Override
    @Transactional
    public void removeRoleFromUser(Long userId, Long roleId) {
        // 使用QueryWrapper删除用户角色关联
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<UserRole> queryWrapper = 
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        queryWrapper.eq("user_id", userId).eq("role_id", roleId);
        userRoleMapper.delete(queryWrapper);
        
        // 清除用户的权限缓存
        permissionService.clearUserPermissionCache(userId);
    }
}
