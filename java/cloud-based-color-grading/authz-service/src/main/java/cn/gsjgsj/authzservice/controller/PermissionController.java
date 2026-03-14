package cn.gsjgsj.authzservice.controller;

import cn.gsjgsj.authzservice.service.PermissionService;
import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.Permission;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 权限控制器
 * 提供权限检查接口供网关调用，以及权限管理接口
 */
@RestController
@RequestMapping("/permissions")
public class PermissionController {
    
    private final PermissionService permissionService;
    
    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }
    
    /**
     * 检查用户是否有权限访问资源
     * @param userId 用户ID
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @return 是否有权限
     */
    @GetMapping("/check")
    public Boolean checkPermission(
            @RequestParam Long userId,
            @RequestParam String resourcePath,
            @RequestParam String method) {
        return permissionService.hasPermission(userId, resourcePath, method);
    }
    
    /**
     * 创建权限
     * @param permission 权限对象
     * @return 创建的权限
     */
    @PostMapping
    public Result<Permission> createPermission(@RequestBody Permission permission) {
        Permission created = permissionService.createPermission(permission);
        return Result.success(created);
    }
    
    /**
     * 更新权限
     * @param id 权限ID
     * @param permission 权限对象
     * @return 更新的权限
     */
    @PutMapping("/{id}")
    public Result<Permission> updatePermission(@PathVariable Long id, @RequestBody Permission permission) {
        permission.setId(id);
        Permission updated = permissionService.updatePermission(permission);
        return Result.success(updated);
    }
    
    /**
     * 删除权限
     * @param id 权限ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Result<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return Result.success();
    }
    
    /**
     * 根据ID查询权限
     * @param id 权限ID
     * @return 权限对象
     */
    @GetMapping("/{id}")
    public Result<Permission> getPermissionById(@PathVariable Long id) {
        Permission permission = permissionService.getPermissionById(id);
        return Result.success(permission);
    }
    
    /**
     * 查询所有权限
     * @return 权限列表
     */
    @GetMapping
    public Result<List<Permission>> getAllPermissions() {
        List<Permission> permissions = permissionService.getAllPermissions();
        return Result.success(permissions);
    }
    
    /**
     * 获取用户所有权限
     * @param userId 用户ID
     * @return 权限列表
     */
    @GetMapping("/user/{userId}")
    public Result<List<Permission>> getUserPermissions(@PathVariable Long userId) {
        List<Permission> permissions = permissionService.getUserPermissions(userId);
        return Result.success(permissions);
    }
}
