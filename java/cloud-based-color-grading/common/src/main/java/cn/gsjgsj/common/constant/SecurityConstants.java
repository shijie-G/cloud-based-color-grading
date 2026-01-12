package cn.gsjgsj.common.constant;

/**
 * 安全相关常量
 */
public class SecurityConstants {
    
    /**
     * JWT令牌请求头名称
     */
    public static final String TOKEN_HEADER = "Authorization";
    
    /**
     * JWT令牌前缀
     */
    public static final String TOKEN_PREFIX = "Bearer ";
    
    /**
     * 用户ID请求头
     */
    public static final String USER_ID_HEADER = "X-User-Id";
    
    /**
     * 用户名请求头
     */
    public static final String USER_NAME_HEADER = "X-User-Name";
    
    /**
     * 用户角色请求头
     */
    public static final String USER_ROLES_HEADER = "X-User-Roles";
    
    /**
     * 登录失败最大次数
     */
    public static final int MAX_LOGIN_FAIL_COUNT = 5;
    
    /**
     * 账户锁定时间（分钟）
     */
    public static final int ACCOUNT_LOCK_MINUTES = 15;
    
    /**
     * 令牌过期时间（小时）
     */
    public static final int TOKEN_EXPIRE_HOURS = 2;
    
    /**
     * 令牌刷新阈值（分钟）
     */
    public static final int TOKEN_REFRESH_THRESHOLD_MINUTES = 30;
    
    /**
     * 权限缓存过期时间（分钟）
     */
    public static final int PERMISSION_CACHE_MINUTES = 30;
}
