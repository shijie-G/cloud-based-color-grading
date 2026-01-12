package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.authzservice.mapper.RoleMapper;
import cn.gsjgsj.authzservice.mapper.RolePermissionMapper;
import cn.gsjgsj.authzservice.mapper.UserRoleMapper;
import cn.gsjgsj.authzservice.service.impl.RoleServiceImpl;
import cn.gsjgsj.common.entity.RolePermission;
import net.jqwik.api.*;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.Mockito.*;

/**
 * 角色权限修改属性测试
 * Feature: user-authentication-authorization, Property 10: 角色权限修改影响所有用户
 * 
 * 属性：对于任何角色，修改其权限后，所有拥有该角色的用户的权限缓存应该被清除
 * 验证需求：3.4
 */
class RolePermissionModificationPropertyTest {
    
    /**
     * 属性测试：角色权限修改影响所有用户
     * 对于任何角色，修改其权限后，所有拥有该角色的用户的权限缓存应该被清除
     */
    @Property(tries = 100)
    void rolePermissionModificationAffectsAllUsers(
            @ForAll("roleIds") long roleId,
            @ForAll("userCounts") int userCount,
            @ForAll("permissionCounts") int permissionCount) {
        
        // 创建mocks
        RoleMapper roleMapper = Mockito.mock(RoleMapper.class);
        RolePermissionMapper rolePermissionMapper = Mockito.mock(RolePermissionMapper.class);
        UserRoleMapper userRoleMapper = Mockito.mock(UserRoleMapper.class);
        PermissionService permissionService = Mockito.mock(PermissionService.class);
        RoleService roleService = new RoleServiceImpl(roleMapper, rolePermissionMapper, userRoleMapper, permissionService);
        
        // 创建拥有该角色的用户ID列表
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            userIds.add((long) (i + 1));
        }
        
        // 创建新的权限ID列表
        List<Long> permissionIds = new ArrayList<>();
        for (int i = 0; i < permissionCount; i++) {
            permissionIds.add((long) (i + 1));
        }
        
        // Mock查询拥有该角色的用户
        when(userRoleMapper.selectUserIdsByRoleId(roleId)).thenReturn(userIds);
        
        // 执行：为角色分配权限
        roleService.assignPermissionsToRole(roleId, permissionIds);
        
        // 验证：删除了旧的权限关联
        verify(rolePermissionMapper, times(1)).deleteByRoleId(roleId);
        
        // 验证：添加了新的权限关联
        verify(rolePermissionMapper, times(permissionCount)).insert(any(RolePermission.class));
        
        // 验证：查询了拥有该角色的用户
        verify(userRoleMapper, times(1)).selectUserIdsByRoleId(roleId);
        
        // 验证：批量清除了所有用户的权限缓存
        verify(permissionService, times(1)).clearUserPermissionCacheBatch(userIds);
    }
    
    /**
     * 属性测试：角色权限修改时无用户不清除缓存
     * 如果角色没有关联任何用户，修改权限时不应该清除任何缓存
     */
    @Property(tries = 100)
    void rolePermissionModificationWithNoUsers(
            @ForAll("roleIds") long roleId,
            @ForAll("permissionCounts") int permissionCount) {
        
        // 创建mocks
        RoleMapper roleMapper = Mockito.mock(RoleMapper.class);
        RolePermissionMapper rolePermissionMapper = Mockito.mock(RolePermissionMapper.class);
        UserRoleMapper userRoleMapper = Mockito.mock(UserRoleMapper.class);
        PermissionService permissionService = Mockito.mock(PermissionService.class);
        RoleService roleService = new RoleServiceImpl(roleMapper, rolePermissionMapper, userRoleMapper, permissionService);
        
        // 创建权限ID列表
        List<Long> permissionIds = new ArrayList<>();
        for (int i = 0; i < permissionCount; i++) {
            permissionIds.add((long) (i + 1));
        }
        
        // Mock查询拥有该角色的用户（返回空列表）
        when(userRoleMapper.selectUserIdsByRoleId(roleId)).thenReturn(new ArrayList<>());
        
        // 执行：为角色分配权限
        roleService.assignPermissionsToRole(roleId, permissionIds);
        
        // 验证：删除了旧的权限关联
        verify(rolePermissionMapper, times(1)).deleteByRoleId(roleId);
        
        // 验证：添加了新的权限关联
        verify(rolePermissionMapper, times(permissionCount)).insert(any(RolePermission.class));
        
        // 验证：查询了拥有该角色的用户
        verify(userRoleMapper, times(1)).selectUserIdsByRoleId(roleId);
        
        // 验证：没有清除任何缓存（因为没有用户）
        verify(permissionService, never()).clearUserPermissionCacheBatch(anyList());
    }
    
    /**
     * 属性测试：用户角色修改清除该用户缓存
     * 修改用户的角色时，应该清除该用户的权限缓存
     */
    @Property(tries = 100)
    void userRoleModificationClearsUserCache(
            @ForAll("userIds") long userId,
            @ForAll("roleCounts") int roleCount) {
        
        // 创建mocks
        RoleMapper roleMapper = Mockito.mock(RoleMapper.class);
        RolePermissionMapper rolePermissionMapper = Mockito.mock(RolePermissionMapper.class);
        UserRoleMapper userRoleMapper = Mockito.mock(UserRoleMapper.class);
        PermissionService permissionService = Mockito.mock(PermissionService.class);
        RoleService roleService = new RoleServiceImpl(roleMapper, rolePermissionMapper, userRoleMapper, permissionService);
        
        // 创建角色ID列表
        List<Long> roleIds = new ArrayList<>();
        for (int i = 0; i < roleCount; i++) {
            roleIds.add((long) (i + 1));
        }
        
        // 执行：为用户分配角色
        roleService.assignRolesToUser(userId, roleIds);
        
        // 验证：删除了用户的旧角色关联
        verify(userRoleMapper, times(1)).deleteByUserId(userId);
        
        // 验证：添加了新的角色关联
        verify(userRoleMapper, times(roleCount)).insert(any());
        
        // 验证：清除了该用户的权限缓存
        verify(permissionService, times(1)).clearUserPermissionCache(userId);
    }
    
    /**
     * 属性测试：移除用户角色清除该用户缓存
     * 移除用户的某个角色时，应该清除该用户的权限缓存
     */
    @Property(tries = 100)
    void removeUserRoleClearsUserCache(
            @ForAll("userIds") long userId,
            @ForAll("roleIds") long roleId) {
        
        // 创建mocks
        RoleMapper roleMapper = Mockito.mock(RoleMapper.class);
        RolePermissionMapper rolePermissionMapper = Mockito.mock(RolePermissionMapper.class);
        UserRoleMapper userRoleMapper = Mockito.mock(UserRoleMapper.class);
        PermissionService permissionService = Mockito.mock(PermissionService.class);
        RoleService roleService = new RoleServiceImpl(roleMapper, rolePermissionMapper, userRoleMapper, permissionService);
        
        // 执行：移除用户的角色
        roleService.removeRoleFromUser(userId, roleId);
        
        // 验证：删除了用户角色关联（使用delete方法而不是deleteById）
        verify(userRoleMapper, times(1)).delete(any());
        
        // 验证：清除了该用户的权限缓存
        verify(permissionService, times(1)).clearUserPermissionCache(userId);
    }
    
    /**
     * 属性测试：角色权限清空影响所有用户
     * 清空角色的所有权限时，所有拥有该角色的用户的权限缓存应该被清除
     */
    @Property(tries = 100)
    void clearRolePermissionsAffectsAllUsers(
            @ForAll("roleIds") long roleId,
            @ForAll("userCounts") int userCount) {
        
        // 创建mocks
        RoleMapper roleMapper = Mockito.mock(RoleMapper.class);
        RolePermissionMapper rolePermissionMapper = Mockito.mock(RolePermissionMapper.class);
        UserRoleMapper userRoleMapper = Mockito.mock(UserRoleMapper.class);
        PermissionService permissionService = Mockito.mock(PermissionService.class);
        RoleService roleService = new RoleServiceImpl(roleMapper, rolePermissionMapper, userRoleMapper, permissionService);
        
        // 创建拥有该角色的用户ID列表
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            userIds.add((long) (i + 1));
        }
        
        // Mock查询拥有该角色的用户
        when(userRoleMapper.selectUserIdsByRoleId(roleId)).thenReturn(userIds);
        
        // 执行：清空角色的权限（传入空列表）
        roleService.assignPermissionsToRole(roleId, new ArrayList<>());
        
        // 验证：删除了旧的权限关联
        verify(rolePermissionMapper, times(1)).deleteByRoleId(roleId);
        
        // 验证：没有添加新的权限关联
        verify(rolePermissionMapper, never()).insert(any(RolePermission.class));
        
        // 验证：批量清除了所有用户的权限缓存
        verify(permissionService, times(1)).clearUserPermissionCacheBatch(userIds);
    }
    
    /**
     * 生成用户ID (1-1000)
     */
    @Provide
    Arbitrary<Long> userIds() {
        return Arbitraries.longs().between(1L, 1000L);
    }
    
    /**
     * 生成角色ID (1-100)
     */
    @Provide
    Arbitrary<Long> roleIds() {
        return Arbitraries.longs().between(1L, 100L);
    }
    
    /**
     * 生成用户数量 (1-10)
     */
    @Provide
    Arbitrary<Integer> userCounts() {
        return Arbitraries.integers().between(1, 10);
    }
    
    /**
     * 生成权限数量 (1-5)
     */
    @Provide
    Arbitrary<Integer> permissionCounts() {
        return Arbitraries.integers().between(1, 5);
    }
    
    /**
     * 生成角色数量 (1-5)
     */
    @Provide
    Arbitrary<Integer> roleCounts() {
        return Arbitraries.integers().between(1, 5);
    }
}
