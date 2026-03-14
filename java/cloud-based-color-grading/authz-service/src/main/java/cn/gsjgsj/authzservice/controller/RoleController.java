package cn.gsjgsj.authzservice.controller;

import cn.gsjgsj.authzservice.service.RoleService;
import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.Role;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 角色控制器
 * 提供角色管理接口
 */
@RestController
@RequestMapping("/roles")
public class RoleController {
    
    private final RoleService roleService;
    
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }
    
    /**
     * 创建角色
     * @param role 角色对象
     * @return 创建的角色
     */
    @PostMapping
    public Result<Role> createRole(@RequestBody Role role) {
        Role created = roleService.createRole(role);
        return Result.success(created);
    }
    
    /**
     * 更新角色
     * @param id 角色ID
     * @param role 角色对象
     * @return 更新的角色
     */
    @PutMapping("/{id}")
    public Result<Role> updateRole(@PathVariable Long id, @RequestBody Role role) {
        role.setId(id);
        Role updated = roleService.updateRole(role);
        return Result.success(updated);
    }
    
    /**
     * 删除角色
     * @param id 角色ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return Result.success();
    }
    
    /**
     * 根据ID查询角色
     * @param id 角色ID
     * @return 角色对象
     */
    @GetMapping("/{id}")
    public Result<Role> getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        return Result.success(role);
    }
    
    /**
     * 查询所有角色
     * @return 角色列表
     */
    @GetMapping
    public Result<List<Role>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        return Result.success(roles);
    }
    
    /**
     * 为角色分配权限
     * @param roleId 角色ID
     * @param permissionIds 权限ID列表
     * @return 操作结果
     */
    @PostMapping("/{roleId}/permissions")
    public Result<Void> assignPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        roleService.assignPermissionsToRole(roleId, permissionIds);
        return Result.success();
    }
    
    /**
     * 为用户分配角色
     * @param userId 用户ID
     * @param roleIds 角色ID列表
     * @return 操作结果
     */
    @PostMapping("/users/{userId}")
    public Result<Void> assignRolesToUser(
            @PathVariable Long userId,
            @RequestBody List<Long> roleIds) {
        roleService.assignRolesToUser(userId, roleIds);
        return Result.success();
    }
    
    /**
     * 移除用户的角色
     * @param userId 用户ID
     * @param roleId 角色ID
     * @return 操作结果
     */
    @DeleteMapping("/users/{userId}/roles/{roleId}")
    public Result<Void> removeRoleFromUser(
            @PathVariable Long userId,
            @PathVariable Long roleId) {
        roleService.removeRoleFromUser(userId, roleId);
        return Result.success();
    }
}
