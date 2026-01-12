package cn.gsjgsj.gateway.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 网关安全审计日志记录器
 * 记录网关层的认证和授权事件
 */
@Component
public class SecurityAuditLogger {
    
    private static final Logger logger = LoggerFactory.getLogger("cn.gsjgsj.gateway.security");
    
    /**
     * 记录认证成功事件
     * @param userId 用户ID
     * @param username 用户名
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logAuthenticationSuccess(Long userId, String username, String path, String ipAddress) {
        logger.info("AUTHENTICATION_SUCCESS - UserId: {}, Username: {}, Path: {}, IP: {}", 
                userId, username, path, ipAddress);
    }
    
    /**
     * 记录认证失败事件
     * @param reason 失败原因
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logAuthenticationFailure(String reason, String path, String ipAddress) {
        logger.warn("AUTHENTICATION_FAILURE - Reason: {}, Path: {}, IP: {}", reason, path, ipAddress);
    }
    
    /**
     * 记录权限检查失败事件
     * @param userId 用户ID
     * @param username 用户名
     * @param path 请求路径
     * @param method HTTP方法
     * @param ipAddress IP地址
     */
    public void logAuthorizationFailure(Long userId, String username, String path, String method, String ipAddress) {
        logger.warn("AUTHORIZATION_FAILURE - UserId: {}, Username: {}, Method: {}, Path: {}, IP: {}", 
                userId, username, method, path, ipAddress);
    }
    
    /**
     * 记录权限检查成功事件
     * @param userId 用户ID
     * @param username 用户名
     * @param path 请求路径
     * @param method HTTP方法
     * @param ipAddress IP地址
     */
    public void logAuthorizationSuccess(Long userId, String username, String path, String method, String ipAddress) {
        logger.debug("AUTHORIZATION_SUCCESS - UserId: {}, Username: {}, Method: {}, Path: {}, IP: {}", 
                userId, username, method, path, ipAddress);
    }
    
    /**
     * 记录令牌过期事件
     * @param userId 用户ID
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logTokenExpired(Long userId, String path, String ipAddress) {
        logger.warn("TOKEN_EXPIRED - UserId: {}, Path: {}, IP: {}", userId, path, ipAddress);
    }
    
    /**
     * 记录令牌无效事件
     * @param token 令牌（部分）
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logInvalidToken(String token, String path, String ipAddress) {
        // 只记录令牌的前10个字符
        String tokenPrefix = token != null && token.length() > 10 ? token.substring(0, 10) + "..." : "null";
        logger.warn("INVALID_TOKEN - Token: {}, Path: {}, IP: {}", tokenPrefix, path, ipAddress);
    }
    
    /**
     * 记录令牌自动刷新事件
     * @param userId 用户ID
     * @param username 用户名
     * @param ipAddress IP地址
     */
    public void logTokenAutoRefresh(Long userId, String username, String ipAddress) {
        logger.info("TOKEN_AUTO_REFRESH - UserId: {}, Username: {}, IP: {}", userId, username, ipAddress);
    }
    
    /**
     * 记录白名单路径访问
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logWhitelistAccess(String path, String ipAddress) {
        logger.debug("WHITELIST_ACCESS - Path: {}, IP: {}", path, ipAddress);
    }
    
    /**
     * 记录异常访问行为
     * @param behavior 异常行为描述
     * @param path 请求路径
     * @param ipAddress IP地址
     */
    public void logAbnormalAccess(String behavior, String path, String ipAddress) {
        logger.warn("ABNORMAL_ACCESS - Behavior: {}, Path: {}, IP: {}", behavior, path, ipAddress);
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
