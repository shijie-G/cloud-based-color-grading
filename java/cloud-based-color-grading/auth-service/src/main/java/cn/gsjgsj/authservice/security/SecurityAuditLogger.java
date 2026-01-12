package cn.gsjgsj.authservice.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 安全审计日志记录器
 * 记录所有认证和授权相关的安全事件
 */
@Component
public class SecurityAuditLogger {
    
    private static final Logger logger = LoggerFactory.getLogger("cn.gsjgsj.authservice.security");
    
    /**
     * 记录登录成功事件
     * @param username 用户名
     * @param userId 用户ID
     * @param ipAddress IP地址
     */
    public void logLoginSuccess(String username, Long userId, String ipAddress) {
        logger.info("LOGIN_SUCCESS - Username: {}, UserId: {}, IP: {}", username, userId, ipAddress);
    }
    
    /**
     * 记录登录失败事件
     * @param username 用户名
     * @param reason 失败原因
     * @param ipAddress IP地址
     */
    public void logLoginFailure(String username, String reason, String ipAddress) {
        logger.warn("LOGIN_FAILURE - Username: {}, Reason: {}, IP: {}", username, reason, ipAddress);
    }
    
    /**
     * 记录账户锁定事件
     * @param username 用户名
     * @param failureCount 失败次数
     * @param ipAddress IP地址
     */
    public void logAccountLocked(String username, int failureCount, String ipAddress) {
        logger.warn("ACCOUNT_LOCKED - Username: {}, FailureCount: {}, IP: {}", username, failureCount, ipAddress);
    }
    
    /**
     * 记录登出事件
     * @param username 用户名
     * @param userId 用户ID
     * @param ipAddress IP地址
     */
    public void logLogout(String username, Long userId, String ipAddress) {
        logger.info("LOGOUT - Username: {}, UserId: {}, IP: {}", username, userId, ipAddress);
    }
    
    /**
     * 记录令牌刷新事件
     * @param username 用户名
     * @param userId 用户ID
     * @param ipAddress IP地址
     */
    public void logTokenRefresh(String username, Long userId, String ipAddress) {
        logger.info("TOKEN_REFRESH - Username: {}, UserId: {}, IP: {}", username, userId, ipAddress);
    }
    
    /**
     * 记录令牌验证失败事件
     * @param token 令牌（部分）
     * @param reason 失败原因
     * @param ipAddress IP地址
     */
    public void logTokenValidationFailure(String token, String reason, String ipAddress) {
        // 只记录令牌的前10个字符，避免泄露完整令牌
        String tokenPrefix = token != null && token.length() > 10 ? token.substring(0, 10) + "..." : "null";
        logger.warn("TOKEN_VALIDATION_FAILURE - Token: {}, Reason: {}, IP: {}", tokenPrefix, reason, ipAddress);
    }
    
    /**
     * 记录密码修改事件
     * @param username 用户名
     * @param userId 用户ID
     * @param ipAddress IP地址
     */
    public void logPasswordChange(String username, Long userId, String ipAddress) {
        logger.info("PASSWORD_CHANGE - Username: {}, UserId: {}, IP: {}", username, userId, ipAddress);
    }
    
    /**
     * 记录用户创建事件
     * @param username 用户名
     * @param createdBy 创建者
     * @param ipAddress IP地址
     */
    public void logUserCreated(String username, String createdBy, String ipAddress) {
        logger.info("USER_CREATED - Username: {}, CreatedBy: {}, IP: {}", username, createdBy, ipAddress);
    }
    
    /**
     * 记录用户禁用事件
     * @param username 用户名
     * @param disabledBy 禁用者
     * @param ipAddress IP地址
     */
    public void logUserDisabled(String username, String disabledBy, String ipAddress) {
        logger.warn("USER_DISABLED - Username: {}, DisabledBy: {}, IP: {}", username, disabledBy, ipAddress);
    }
    
    /**
     * 记录异常登录行为
     * @param username 用户名
     * @param behavior 异常行为描述
     * @param ipAddress IP地址
     */
    public void logAbnormalLoginBehavior(String username, String behavior, String ipAddress) {
        logger.warn("ABNORMAL_LOGIN_BEHAVIOR - Username: {}, Behavior: {}, IP: {}", username, behavior, ipAddress);
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
