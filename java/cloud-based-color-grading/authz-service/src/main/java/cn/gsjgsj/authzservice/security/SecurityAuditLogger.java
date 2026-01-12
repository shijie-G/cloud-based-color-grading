package cn.gsjgsj.authzservice.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 授权服务安全审计日志记录器
 * 记录权限管理相关的安全事件
 */
@Component
public class SecurityAuditLogger {
    
    private static final Logger logger = LoggerFactory.getLogger("cn.gsjgsj.authzservice.security");
    
    /**
     * 记录权限检查事件
     * @param userId 用户ID
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @param hasPermission 是否有权限
     * @param ipAddress IP地址
     */
    public void logPermissionCheck(Long userId, String resourcePath, String method, boolean hasPermission, String ipAddress) {
        if (hasPermission) {
            logger.debug("PERMISSION_CHECK_SUCCESS - UserId: {}, Method: {}, Path: {}, IP: {}", 
                    userId, method, resourcePath, ipAddress);
        } else {
            logger.warn("PERMISSION_CHECK_FAILURE - UserId: {}, Method: {}, Path: {}, IP: {}", 
                    userId, method, resourcePath, ipAddress);
        }
    }
    
    /**
     * 记录角色分配事件
     * @param userId 用户ID
     * @param roleId 角色ID
     * @param assignedBy 分配者
     * @param ipAddress IP地址
     */
    public void logRoleAssigned(Long userId, Long roleId, String assignedBy, String ipAddress) {
        logger.info("ROLE_ASSIGNED - UserId: {}, RoleId: {}, AssignedBy: {}, IP: {}", 
                userId, roleId, assignedBy, ipAddress);
    }
    
    /**
     * 记录角色移除事件
     * @param userId 用户ID
     * @param roleId 角色ID
     * @param removedBy 移除者
     * @param ipAddress IP地址
     */
    public void logRoleRemoved(Long userId, Long roleId, String removedBy, String ipAddress) {
        logger.info("ROLE_REMOVED - UserId: {}, RoleId: {}, RemovedBy: {}, IP: {}", 
                userId, roleId, removedBy, ipAddress);
    }
    
    /**
     * 记录权限分配事件
     * @param roleId 角色ID
     * @param permissionId 权限ID
     * @param assignedBy 分配者
     * @param ipAddress IP地址
     */
    public void logPermissionAssigned(Long roleId, Long permissionId, String assignedBy, String ipAddress) {
        logger.info("PERMISSION_ASSIGNED - RoleId: {}, PermissionId: {}, AssignedBy: {}, IP: {}", 
                roleId, permissionId, assignedBy, ipAddress);
    }
    
    /**
     * 记录权限移除事件
     * @param roleId 角色ID
     * @param permissionId 权限ID
     * @param removedBy 移除者
     * @param ipAddress IP地址
     */
    public void logPermissionRemoved(Long roleId, Long permissionId, String removedBy, String ipAddress) {
        logger.info("PERMISSION_REMOVED - RoleId: {}, PermissionId: {}, RemovedBy: {}, IP: {}", 
                roleId, permissionId, removedBy, ipAddress);
    }
    
    /**
     * 记录权限缓存清除事件
     * @param userId 用户ID
     * @param reason 清除原因
     */
    public void logPermissionCacheCleared(Long userId, String reason) {
        logger.info("PERMISSION_CACHE_CLEARED - UserId: {}, Reason: {}", userId, reason);
    }
    
    /**
     * 记录批量权限缓存清除事件
     * @param userCount 用户数量
     * @param reason 清除原因
     */
    public void logBatchPermissionCacheCleared(int userCount, String reason) {
        logger.info("BATCH_PERMISSION_CACHE_CLEARED - UserCount: {}, Reason: {}", userCount, reason);
    }
    
    /**
     * 记录菜单权限关联事件
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @param assignedBy 分配者
     * @param ipAddress IP地址
     */
    public void logMenuPermissionAssigned(Long menuId, Long permissionId, String assignedBy, String ipAddress) {
        logger.info("MENU_PERMISSION_ASSIGNED - MenuId: {}, PermissionId: {}, AssignedBy: {}, IP: {}", 
                menuId, permissionId, assignedBy, ipAddress);
    }
    
    /**
     * 记录安全异常
     * @param event 事件类型
     * @param details 详细信息
     * @param ipAddress IP地址
     */
    public void logSecurityException(String event, String details, String ipAddress) {
        logger.error("SECURITY_EXCEPTION - Event: {}, Details: {}, IP: {}", event, details, ipAddress);
    }
}
