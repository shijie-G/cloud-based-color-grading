package cn.gsjgsj.authzservice.service.impl;

import cn.gsjgsj.authzservice.mapper.PermissionMapper;
import cn.gsjgsj.authzservice.service.PermissionService;
import cn.gsjgsj.common.entity.Permission;
import cn.gsjgsj.common.service.RedisService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 权限服务实现类
 * 实现权限检查和权限管理功能
 */
@Service
public class PermissionServiceImpl implements PermissionService {
    
    private final PermissionMapper permissionMapper;
    private final RedisService redisService;
    
    public PermissionServiceImpl(PermissionMapper permissionMapper, RedisService redisService) {
        this.permissionMapper = permissionMapper;
        this.redisService = redisService;
    }
    
    /**
     * 检查用户是否有权限访问资源
     * @param userId 用户ID
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @return 是否有权限
     */
    @Override
    public boolean hasPermission(Long userId, String resourcePath, String method) {
        // 获取用户所有权限（优先从缓存读取）
        List<Permission> permissions = getUserPermissions(userId);
        
        // 检查是否有匹配的权限
        return permissions.stream()
                .anyMatch(permission -> 
                    matchesResource(permission, resourcePath, method));
    }
    
    /**
     * 获取用户所有权限
     * 优先从Redis缓存读取，缓存不存在则从数据库加载并缓存
     * @param userId 用户ID
     * @return 权限列表
     */
    @Override
    public List<Permission> getUserPermissions(Long userId) {
        // 先从Redis缓存读取
        List<Permission> permissions = redisService.getPermissions(userId);
        
        if (permissions == null) {
            // 缓存不存在，从数据库加载
            permissions = permissionMapper.selectPermissionsByUserId(userId);
            
            // 存入缓存
            if (permissions != null && !permissions.isEmpty()) {
                redisService.savePermissions(userId, permissions);
            }
        }
        
        return permissions;
    }
    
    /**
     * 清除用户权限缓存
     * @param userId 用户ID
     */
    @Override
    public void clearUserPermissionCache(Long userId) {
        redisService.clearPermissions(userId);
    }
    
    /**
     * 批量清除用户权限缓存
     * @param userIds 用户ID列表
     */
    @Override
    public void clearUserPermissionCacheBatch(List<Long> userIds) {
        redisService.clearPermissionsBatch(userIds);
    }
    
    /**
     * 检查权限是否匹配资源
     * @param permission 权限对象
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @return 是否匹配
     */
    private boolean matchesResource(Permission permission, String resourcePath, String method) {
        // 检查资源路径是否匹配
        boolean pathMatches = permission.getResourcePath() != null && 
                              resourcePath.matches(permission.getResourcePath());
        
        // 检查HTTP方法是否匹配（如果权限指定了方法）
        boolean methodMatches = permission.getMethod() == null || 
                                permission.getMethod().isEmpty() ||
                                permission.getMethod().equalsIgnoreCase(method);
        
        return pathMatches && methodMatches;
    }
    
    /**
     * 创建权限
     * @param permission 权限对象
     * @return 创建的权限
     */
    @Override
    public Permission createPermission(Permission permission) {
        permissionMapper.insert(permission);
        return permission;
    }
    
    /**
     * 更新权限
     * @param permission 权限对象
     * @return 更新的权限
     */
    @Override
    public Permission updatePermission(Permission permission) {
        permissionMapper.updateById(permission);
        return permission;
    }
    
    /**
     * 删除权限
     * @param permissionId 权限ID
     */
    @Override
    public void deletePermission(Long permissionId) {
        permissionMapper.deleteById(permissionId);
    }
    
    /**
     * 根据ID查询权限
     * @param permissionId 权限ID
     * @return 权限对象
     */
    @Override
    public Permission getPermissionById(Long permissionId) {
        return permissionMapper.selectById(permissionId);
    }
    
    /**
     * 查询所有权限
     * @return 权限列表
     */
    @Override
    public List<Permission> getAllPermissions() {
        return permissionMapper.selectList(null);
    }
}
