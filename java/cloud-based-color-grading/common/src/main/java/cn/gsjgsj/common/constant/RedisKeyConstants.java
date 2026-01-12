package cn.gsjgsj.common.constant;

/**
 * Redis键常量
 */
public class RedisKeyConstants {
    
    /**
     * 令牌存储键前缀
     */
    public static final String TOKEN_PREFIX = "token:";
    
    /**
     * 权限缓存键前缀
     */
    public static final String PERMISSION_PREFIX = "permission:";
    
    /**
     * 登录失败计数键前缀
     */
    public static final String LOGIN_FAIL_PREFIX = "login:fail:";
    
    /**
     * 账户锁定标记键前缀
     */
    public static final String ACCOUNT_LOCKED_PREFIX = "account:locked:";
    
    /**
     * 获取令牌键
     */
    public static String getTokenKey(Long userId) {
        return TOKEN_PREFIX + userId;
    }
    
    /**
     * 获取权限缓存键
     */
    public static String getPermissionKey(Long userId) {
        return PERMISSION_PREFIX + userId;
    }
    
    /**
     * 获取登录失败计数键
     */
    public static String getLoginFailKey(String username) {
        return LOGIN_FAIL_PREFIX + username;
    }
    
    /**
     * 获取账户锁定标记键
     */
    public static String getAccountLockedKey(String username) {
        return ACCOUNT_LOCKED_PREFIX + username;
    }
}
