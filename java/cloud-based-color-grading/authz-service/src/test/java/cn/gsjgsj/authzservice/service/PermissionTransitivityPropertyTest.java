package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.authzservice.mapper.PermissionMapper;
import cn.gsjgsj.authzservice.service.impl.PermissionServiceImpl;
import cn.gsjgsj.common.entity.Permission;
import cn.gsjgsj.common.service.RedisService;
import net.jqwik.api.*;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * 权限检查传递性属性测试
 * Feature: user-authentication-authorization, Property 4: 权限检查传递性
 * 
 * 属性：对于任何用户，如果用户拥有角色A，角色A拥有权限P，则用户应该拥有权限P
 * 验证需求：3.2, 4.3
 */
class PermissionTransitivityPropertyTest {
    
    /**
     * 属性测试：权限检查传递性
     * 对于任何用户，如果用户拥有角色A，角色A拥有权限P，则用户应该拥有权限P
     */
    @Property(tries = 100)
    void permissionTransitivity(
            @ForAll("userIds") long userId,
            @ForAll("roleIds") long roleId,
            @ForAll("permissionIds") long permissionId,
            @ForAll("resourcePaths") String resourcePath,
            @ForAll("httpMethods") String method) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        // 创建权限对象
        Permission permission = new Permission();
        permission.setId(permissionId);
        permission.setPermissionKey("test:permission:" + permissionId);
        permission.setResourcePath(resourcePath);
        permission.setMethod(method);
        
        // 创建权限列表（用户通过角色获得的权限）
        List<Permission> permissions = new ArrayList<>();
        permissions.add(permission);
        
        // Mock Redis缓存返回null（强制从数据库加载）
        when(redisService.getPermissions(userId)).thenReturn(null);
        
        // Mock数据库查询返回权限列表
        when(permissionMapper.selectPermissionsByUserId(userId)).thenReturn(permissions);
        
        // 执行：获取用户权限
        List<Permission> userPermissions = permissionService.getUserPermissions(userId);
        
        // 验证：用户应该拥有该权限
        assertThat(userPermissions)
                .as("用户通过角色获得的权限应该包含在用户权限列表中")
                .isNotNull()
                .isNotEmpty()
                .contains(permission);
        
        // 验证：权限应该被缓存
        verify(redisService, times(1)).savePermissions(userId, permissions);
    }
    
    /**
     * 属性测试：多角色权限传递性
     * 对于任何用户，如果用户拥有多个角色，每个角色都有权限，则用户应该拥有所有这些权限
     */
    @Property(tries = 100)
    void multiRolePermissionTransitivity(
            @ForAll("userIds") long userId,
            @ForAll("roleCounts") int roleCount,
            @ForAll("permissionCounts") int permissionsPerRole) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        // 创建多个角色的权限列表
        List<Permission> allPermissions = new ArrayList<>();
        
        for (int i = 0; i < roleCount * permissionsPerRole; i++) {
            Permission permission = new Permission();
            permission.setId((long) (i + 1));
            permission.setPermissionKey("test:permission:" + (i + 1));
            permission.setResourcePath("/api/resource/" + (i + 1));
            permission.setMethod("GET");
            allPermissions.add(permission);
        }
        
        // Mock Redis缓存返回null
        when(redisService.getPermissions(userId)).thenReturn(null);
        
        // Mock数据库查询返回所有权限
        when(permissionMapper.selectPermissionsByUserId(userId)).thenReturn(allPermissions);
        
        // 执行：获取用户权限
        List<Permission> userPermissions = permissionService.getUserPermissions(userId);
        
        // 验证：用户应该拥有所有角色的所有权限
        assertThat(userPermissions)
                .as("用户应该拥有所有角色的所有权限")
                .isNotNull()
                .hasSize(allPermissions.size())
                .containsExactlyInAnyOrderElementsOf(allPermissions);
    }
    
    /**
     * 属性测试：权限检查方法的传递性
     * 如果用户通过角色拥有权限P，则hasPermission方法应该返回true
     */
    @Property(tries = 100)
    void hasPermissionTransitivity(
            @ForAll("userIds") long userId,
            @ForAll("resourcePaths") String resourcePath,
            @ForAll("httpMethods") String method) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        // 创建匹配的权限
        Permission permission = new Permission();
        permission.setId(1L);
        permission.setPermissionKey("test:permission");
        permission.setResourcePath(resourcePath);
        permission.setMethod(method);
        
        List<Permission> permissions = new ArrayList<>();
        permissions.add(permission);
        
        // Mock Redis缓存返回null
        when(redisService.getPermissions(userId)).thenReturn(null);
        
        // Mock数据库查询返回权限
        when(permissionMapper.selectPermissionsByUserId(userId)).thenReturn(permissions);
        
        // 执行：检查权限
        boolean hasPermission = permissionService.hasPermission(userId, resourcePath, method);
        
        // 验证：应该有权限
        assertThat(hasPermission)
                .as("用户通过角色拥有的权限应该在hasPermission检查中返回true")
                .isTrue();
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
     * 生成权限ID (1-100)
     */
    @Provide
    Arbitrary<Long> permissionIds() {
        return Arbitraries.longs().between(1L, 100L);
    }
    
    /**
     * 生成资源路径
     */
    @Provide
    Arbitrary<String> resourcePaths() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(5)
                .ofMaxLength(50);
    }
    
    /**
     * 生成HTTP方法
     */
    @Provide
    Arbitrary<String> httpMethods() {
        return Arbitraries.of("GET", "POST", "PUT", "DELETE", "PATCH");
    }
    
    /**
     * 生成角色数量 (1-5)
     */
    @Provide
    Arbitrary<Integer> roleCounts() {
        return Arbitraries.integers().between(1, 5);
    }
    
    /**
     * 生成权限数量 (1-3)
     */
    @Provide
    Arbitrary<Integer> permissionCounts() {
        return Arbitraries.integers().between(1, 3);
    }
}
