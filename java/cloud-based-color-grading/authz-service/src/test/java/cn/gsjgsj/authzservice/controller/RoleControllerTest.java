package cn.gsjgsj.authzservice.controller;

import cn.gsjgsj.authzservice.service.RoleService;
import cn.gsjgsj.common.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * 角色控制器单元测试
 */
class RoleControllerTest {
    
    @Mock
    private RoleService roleService;
    
    @InjectMocks
    private RoleController roleController;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    void testCreateRole() {
        // 准备测试数据
        Role role = new Role();
        role.setRoleName("测试角色");
        role.setRoleKey("ROLE_TEST");
        role.setDescription("测试角色描述");
        role.setStatus(0);
        
        Role createdRole = new Role();
        createdRole.setId(1L);
        createdRole.setRoleName("测试角色");
        createdRole.setRoleKey("ROLE_TEST");
        createdRole.setDescription("测试角色描述");
        createdRole.setStatus(0);
        createdRole.setCreateTime(LocalDateTime.now());
        
        when(roleService.createRole(any(Role.class))).thenReturn(createdRole);
        
        // 执行测试
        var result = roleController.createRole(role);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(1L, result.getData().getId());
        assertEquals("测试角色", result.getData().getRoleName());
        
        verify(roleService, times(1)).createRole(any(Role.class));
    }
    
    @Test
    void testUpdateRole() {
        // 准备测试数据
        Role role = new Role();
        role.setRoleName("更新后的角色");
        role.setRoleKey("ROLE_UPDATED");
        
        Role updatedRole = new Role();
        updatedRole.setId(1L);
        updatedRole.setRoleName("更新后的角色");
        updatedRole.setRoleKey("ROLE_UPDATED");
        
        when(roleService.updateRole(any(Role.class))).thenReturn(updatedRole);
        
        // 执行测试
        var result = roleController.updateRole(1L, role);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(1L, result.getData().getId());
        
        verify(roleService, times(1)).updateRole(any(Role.class));
    }
    
    @Test
    void testDeleteRole() {
        // 执行测试
        doNothing().when(roleService).deleteRole(anyLong());
        var result = roleController.deleteRole(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        
        verify(roleService, times(1)).deleteRole(1L);
    }
    
    @Test
    void testGetRoleById() {
        // 准备测试数据
        Role role = new Role();
        role.setId(1L);
        role.setRoleName("测试角色");
        
        when(roleService.getRoleById(anyLong())).thenReturn(role);
        
        // 执行测试
        var result = roleController.getRoleById(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(1L, result.getData().getId());
        
        verify(roleService, times(1)).getRoleById(1L);
    }
    
    @Test
    void testGetAllRoles() {
        // 准备测试数据
        Role role1 = new Role();
        role1.setId(1L);
        role1.setRoleName("角色1");
        
        Role role2 = new Role();
        role2.setId(2L);
        role2.setRoleName("角色2");
        
        List<Role> roles = Arrays.asList(role1, role2);
        
        when(roleService.getAllRoles()).thenReturn(roles);
        
        // 执行测试
        var result = roleController.getAllRoles();
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        assertEquals(2, result.getData().size());
        
        verify(roleService, times(1)).getAllRoles();
    }
    
    @Test
    void testAssignPermissionsToRole() {
        // 准备测试数据
        List<Long> permissionIds = Arrays.asList(1L, 2L, 3L);
        
        doNothing().when(roleService).assignPermissionsToRole(anyLong(), anyList());
        
        // 执行测试
        var result = roleController.assignPermissionsToRole(1L, permissionIds);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        
        verify(roleService, times(1)).assignPermissionsToRole(1L, permissionIds);
    }
    
    @Test
    void testAssignRolesToUser() {
        // 准备测试数据
        List<Long> roleIds = Arrays.asList(1L, 2L);
        
        doNothing().when(roleService).assignRolesToUser(anyLong(), anyList());
        
        // 执行测试
        var result = roleController.assignRolesToUser(1L, roleIds);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        
        verify(roleService, times(1)).assignRolesToUser(1L, roleIds);
    }
    
    @Test
    void testRemoveRoleFromUser() {
        // 执行测试
        doNothing().when(roleService).removeRoleFromUser(anyLong(), anyLong());
        var result = roleController.removeRoleFromUser(1L, 2L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals(200, result.getCode());
        
        verify(roleService, times(1)).removeRoleFromUser(1L, 2L);
    }
}
