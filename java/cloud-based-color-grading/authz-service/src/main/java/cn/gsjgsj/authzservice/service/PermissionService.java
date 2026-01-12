package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.common.entity.Permission;

import java.util.List;

/**
 * 权限服务接口
 * 提供权限检查和权限管理功能
 */
public interface PermissionService {
    
    /**
     * 检查用户是否有权限访问资源
     * @param userId 用户ID
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @return 是否有权限
     */
    boolean hasPermission(Long userId, String resourcePath, String method);
    
    /**
     * 获取用户所有权限
     * 优先从Redis缓存读取，缓存不存在则从数据库加载并缓存
     * @param userId 用户ID
     * @return 权限列表
     */
    List<Permission> getUserPermissions(Long userId);
    
    /**
     * 清除用户权限缓存
     * @param userId 用户ID
     */
    void clearUserPermissionCache(Long userId);
    
    /**
     * 批量清除用户权限缓存
     * @param userIds 用户ID列表
     */
    void clearUserPermissionCacheBatch(List<Long> userIds);
    
    /**
     * 创建权限
     * @param permission 权限对象
     * @return 创建的权限
     */
    Permission createPermission(Permission permission);
    
    /**
     * 更新权限
     * @param permission 权限对象
     * @return 更新的权限
     */
    Permission updatePermission(Permission permission);
    
    /**
     * 删除权限
     * @param permissionId 权限ID
     */
    void deletePermission(Long permissionId);
    
    /**
     * 根据ID查询权限
     * @param permissionId 权限ID
     * @return 权限对象
     */
    Permission getPermissionById(Long permissionId);
    
    /**
     * 查询所有权限
     * @return 权限列表
     */
    List<Permission> getAllPermissions();
}
