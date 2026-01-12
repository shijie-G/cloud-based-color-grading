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
 * 权限缓存一致性属性测试
 * Feature: user-authentication-authorization, Property 7: 权限缓存一致性
 * 
 * 属性：对于任何用户，清除权限缓存后重新加载的权限列表应该与数据库中的权限列表一致
 * 验证需求：3.4
 */
class PermissionCacheConsistencyPropertyTest {
    
    /**
     * 属性测试：权限缓存一致性
     * 对于任何用户，清除权限缓存后重新加载的权限列表应该与数据库中的权限列表一致
     */
    @Property(tries = 100)
    void permissionCacheConsistency(
            @ForAll("userIds") long userId,
            @ForAll("permissionCounts") int permissionCount) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        // 创建数据库中的权限列表
        List<Permission> dbPermissions = new ArrayList<>();
        for (int i = 0; i < permissionCount; i++) {
            Permission permission = new Permission();
            permission.setId((long) (i + 1));
            permission.setPermissionKey("test:permission:" + (i + 1));
            permission.setResourcePath("/api/resource/" + (i + 1));
            permission.setMethod("GET");
            dbPermissions.add(permission);
        }
        
        // Mock数据库查询返回权限列表
        when(permissionMapper.selectPermissionsByUserId(userId)).thenReturn(dbPermissions);
        
        // 第一次调用：缓存不存在，从数据库加载
        when(redisService.getPermissions(userId)).thenReturn(null);
        List<Permission> firstLoad = permissionService.getUserPermissions(userId);
        
        // 验证：第一次加载应该从数据库获取
        verify(permissionMapper, times(1)).selectPermissionsByUserId(userId);
        verify(redisService, times(1)).savePermissions(userId, dbPermissions);
        
        // 验证：第一次加载的权限应该与数据库一致
        assertThat(firstLoad)
                .as("第一次加载的权限应该与数据库一致")
                .isNotNull()
                .hasSize(dbPermissions.size())
                .containsExactlyInAnyOrderElementsOf(dbPermissions);
        
        // 清除缓存
        permissionService.clearUserPermissionCache(userId);
        verify(redisService, times(1)).clearPermissions(userId);
        
        // 第二次调用：缓存被清除，再次从数据库加载
        when(redisService.getPermissions(userId)).thenReturn(null);
        List<Permission> secondLoad = permissionService.getUserPermissions(userId);
        
        // 验证：第二次加载应该再次从数据库获取
        verify(permissionMapper, times(2)).selectPermissionsByUserId(userId);
        verify(redisService, times(2)).savePermissions(userId, dbPermissions);
        
        // 验证：第二次加载的权限应该与数据库一致
        assertThat(secondLoad)
                .as("清除缓存后重新加载的权限应该与数据库一致")
                .isNotNull()
                .hasSize(dbPermissions.size())
                .containsExactlyInAnyOrderElementsOf(dbPermissions);
        
        // 验证：两次加载的结果应该一致
        assertThat(secondLoad)
                .as("清除缓存前后加载的权限应该一致")
                .containsExactlyInAnyOrderElementsOf(firstLoad);
    }
    
    /**
     * 属性测试：缓存命中时的一致性
     * 当缓存存在时，返回的权限应该与缓存中的权限一致
     */
    @Property(tries = 100)
    void cachedPermissionConsistency(
            @ForAll("userIds") long userId,
            @ForAll("permissionCounts") int permissionCount) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        // 创建缓存中的权限列表
        List<Permission> cachedPermissions = new ArrayList<>();
        for (int i = 0; i < permissionCount; i++) {
            Permission permission = new Permission();
            permission.setId((long) (i + 1));
            permission.setPermissionKey("cached:permission:" + (i + 1));
            permission.setResourcePath("/api/cached/" + (i + 1));
            permission.setMethod("POST");
            cachedPermissions.add(permission);
        }
        
        // Mock Redis缓存返回权限列表
        when(redisService.getPermissions(userId)).thenReturn(cachedPermissions);
        
        // 执行：获取用户权限
        List<Permission> permissions = permissionService.getUserPermissions(userId);
        
        // 验证：应该从缓存获取，不查询数据库
        verify(redisService, times(1)).getPermissions(userId);
        verify(permissionMapper, never()).selectPermissionsByUserId(userId);
        verify(redisService, never()).savePermissions(anyLong(), anyList());
        
        // 验证：返回的权限应该与缓存一致
        assertThat(permissions)
                .as("从缓存获取的权限应该与缓存中的权限一致")
                .isNotNull()
                .hasSize(cachedPermissions.size())
                .containsExactlyInAnyOrderElementsOf(cachedPermissions);
    }
    
    /**
     * 属性测试：批量清除缓存的一致性
     * 批量清除多个用户的缓存后，每个用户重新加载的权限应该与数据库一致
     */
    @Property(tries = 100)
    void batchClearCacheConsistency(
            @ForAll("userCounts") int userCount,
            @ForAll("smallPermissionCounts") int permissionCount) {
        
        // 创建mocks
        PermissionMapper permissionMapper = Mockito.mock(PermissionMapper.class);
        RedisService redisService = Mockito.mock(RedisService.class);
        PermissionService permissionService = new PermissionServiceImpl(permissionMapper, redisService);
        
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            userIds.add((long) (i + 1));
        }
        
        // 为每个用户创建权限列表
        for (Long userId : userIds) {
            List<Permission> permissions = new ArrayList<>();
            for (int j = 0; j < permissionCount; j++) {
                Permission permission = new Permission();
                permission.setId((long) (j + 1));
                permission.setPermissionKey("user" + userId + ":permission:" + (j + 1));
                permission.setResourcePath("/api/user" + userId + "/resource/" + (j + 1));
                permission.setMethod("GET");
                permissions.add(permission);
            }
            
            // Mock数据库查询
            when(permissionMapper.selectPermissionsByUserId(userId)).thenReturn(permissions);
        }
        
        // 批量清除缓存
        permissionService.clearUserPermissionCacheBatch(userIds);
        verify(redisService, times(1)).clearPermissionsBatch(userIds);
        
        // 验证每个用户重新加载的权限与数据库一致
        for (Long userId : userIds) {
            when(redisService.getPermissions(userId)).thenReturn(null);
            List<Permission> reloadedPermissions = permissionService.getUserPermissions(userId);
            
            // 验证：应该从数据库重新加载
            verify(permissionMapper, atLeastOnce()).selectPermissionsByUserId(userId);
            
            // 验证：重新加载的权限数量正确
            assertThat(reloadedPermissions)
                    .as("用户 " + userId + " 重新加载的权限数量应该正确")
                    .hasSize(permissionCount);
        }
    }
    
    /**
     * 生成用户ID (1-1000)
     */
    @Provide
    Arbitrary<Long> userIds() {
        return Arbitraries.longs().between(1L, 1000L);
    }
    
    /**
     * 生成权限数量 (1-10)
     */
    @Provide
    Arbitrary<Integer> permissionCounts() {
        return Arbitraries.integers().between(1, 10);
    }
    
    /**
     * 生成小权限数量 (1-5)
     */
    @Provide
    Arbitrary<Integer> smallPermissionCounts() {
        return Arbitraries.integers().between(1, 5);
    }
    
    /**
     * 生成用户数量 (2-5)
     */
    @Provide
    Arbitrary<Integer> userCounts() {
        return Arbitraries.integers().between(2, 5);
    }
}
