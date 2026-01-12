package cn.gsjgsj.authzservice.controller;

import cn.gsjgsj.authzservice.service.PermissionService;
import cn.gsjgsj.common.entity.Permission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * 权限控制器单元测试
 */
class PermissionControllerTest {
    
    @Mock
    private PermissionService permissionService;
    
    @InjectMocks
    private PermissionController permissionController;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    void testCheckPermission() {
        // 准备测试数据
        when(permissionService.hasPermission(anyLong(), anyString(), anyString())).thenReturn(true);
        
        // 执行测试
        Boolean result = permissionController.checkPermission(1L, "/api/users", "GET");
        
        // 验证结果
        assertTrue(result);
        verify(permissionService, times(1)).hasPermission(1L, "/api/users", "GET");
    }
    
    @Test
    void testCreatePermission() {
        // 准备测试数据
        Permission permission = new Permission();
        permission.setPermissionName("用户查询");
        permission.setPermissionKey("system:user:query");
        permission.setResourceType("api");
        permission.setResourcePath("/api/users");
        permission.setMethod("GET");
        
        Permission createdPermission = new Permission();
        createdPermission.setId(1L);
        createdPermission.setPermissionName("用户查询");
        createdPermission.setPermissionKey("system:user:query");
        
        when(permissionService.createPermission(any(Permission.class))).thenReturn(createdPermission);
        
        // 执行测试
        var result = permissionController.createPermission(permission);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(1L, result.getData().getId());
        
        verify(permissionService, times(1)).createPermission(any(Permission.class));
    }
    
    @Test
    void testUpdatePermission() {
        // 准备测试数据
        Permission permission = new Permission();
        permission.setPermissionName("更新后的权限");
        
        Permission updatedPermission = new Permission();
        updatedPermission.setId(1L);
        updatedPermission.setPermissionName("更新后的权限");
        
        when(permissionService.updatePermission(any(Permission.class))).thenReturn(updatedPermission);
        
        // 执行测试
        var result = permissionController.updatePermission(1L, permission);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(1L, result.getData().getId());
        
        verify(permissionService, times(1)).updatePermission(any(Permission.class));
    }
    
    @Test
    void testDeletePermission() {
        // 执行测试
        doNothing().when(permissionService).deletePermission(anyLong());
        var result = permissionController.deletePermission(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        
        verify(permissionService, times(1)).deletePermission(1L);
    }
    
    @Test
    void testGetPermissionById() {
        // 准备测试数据
        Permission permission = new Permission();
        permission.setId(1L);
        permission.setPermissionName("测试权限");
        
        when(permissionService.getPermissionById(anyLong())).thenReturn(permission);
        
        // 执行测试
        var result = permissionController.getPermissionById(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(1L, result.getData().getId());
        
        verify(permissionService, times(1)).getPermissionById(1L);
    }
    
    @Test
    void testGetAllPermissions() {
        // 准备测试数据
        Permission permission1 = new Permission();
        permission1.setId(1L);
        permission1.setPermissionName("权限1");
        
        Permission permission2 = new Permission();
        permission2.setId(2L);
        permission2.setPermissionName("权限2");
        
        List<Permission> permissions = Arrays.asList(permission1, permission2);
        
        when(permissionService.getAllPermissions()).thenReturn(permissions);
        
        // 执行测试
        var result = permissionController.getAllPermissions();
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(2, result.getData().size());
        
        verify(permissionService, times(1)).getAllPermissions();
    }
    
    @Test
    void testGetUserPermissions() {
        // 准备测试数据
        Permission permission1 = new Permission();
        permission1.setId(1L);
        permission1.setPermissionName("权限1");
        
        Permission permission2 = new Permission();
        permission2.setId(2L);
        permission2.setPermissionName("权限2");
        
        List<Permission> permissions = Arrays.asList(permission1, permission2);
        
        when(permissionService.getUserPermissions(anyLong())).thenReturn(permissions);
        
        // 执行测试
        var result = permissionController.getUserPermissions(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(2, result.getData().size());
        
        verify(permissionService, times(1)).getUserPermissions(1L);
    }
}
