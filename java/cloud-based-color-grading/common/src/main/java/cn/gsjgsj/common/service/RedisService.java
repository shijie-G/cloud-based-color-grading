package cn.gsjgsj.common.service;

import cn.gsjgsj.common.constant.RedisKeyConstants;
import cn.gsjgsj.common.entity.Permission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Redis缓存服务
 * 提供令牌存储、权限缓存、登录失败计数和账户锁定功能
 */
@Service
public class RedisService {
    
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    
    // 令牌过期时间：2小时
    private static final long TOKEN_EXPIRATION = 2 * 60 * 60 * 1000;
    
    // 权限缓存过期时间：30分钟
    private static final long PERMISSION_EXPIRATION = 30 * 60 * 1000;
    
    // 登录失败计数过期时间：15分钟
    private static final long LOGIN_FAIL_EXPIRATION = 15 * 60 * 1000;
    
    // 账户锁定过期时间：15分钟
    private static final long ACCOUNT_LOCKED_EXPIRATION = 15 * 60 * 1000;
    
    // 登录失败锁定阈值
    private static final int LOGIN_FAIL_THRESHOLD = 5;
    
    public RedisService(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }
    
    // ==================== 令牌存储和获取方法 ====================
    
    /**
     * 存储JWT令牌
     * @param userId 用户ID
     * @param token JWT令牌字符串
     */
    public void saveToken(Long userId, String token) {
        String key = RedisKeyConstants.getTokenKey(userId);
        redisTemplate.opsForValue().set(key, token, TOKEN_EXPIRATION, TimeUnit.MILLISECONDS);
    }
    
    /**
     * 获取JWT令牌
     * @param userId 用户ID
     * @return JWT令牌字符串，不存在返回null
     */
    public String getToken(Long userId) {
        String key = RedisKeyConstants.getTokenKey(userId);
        return redisTemplate.opsForValue().get(key);
    }
    
    /**
     * 删除JWT令牌（用于登出）
     * @param userId 用户ID
     */
    public void deleteToken(Long userId) {
        String key = RedisKeyConstants.getTokenKey(userId);
        redisTemplate.delete(key);
    }
    
    /**
     * 检查令牌是否存在
     * @param userId 用户ID
     * @return 是否存在
     */
    public boolean hasToken(Long userId) {
        String key = RedisKeyConstants.getTokenKey(userId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    // ==================== 权限缓存存储和获取方法 ====================
    
    /**
     * 缓存用户权限列表
     * @param userId 用户ID
     * @param permissions 权限列表
     */
    public void savePermissions(Long userId, List<Permission> permissions) {
        String key = RedisKeyConstants.getPermissionKey(userId);
        try {
            String json = objectMapper.writeValueAsString(permissions);
            redisTemplate.opsForValue().set(key, json, PERMISSION_EXPIRATION, TimeUnit.MILLISECONDS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize permissions", e);
        }
    }
    
    /**
     * 获取用户权限列表
     * @param userId 用户ID
     * @return 权限列表，不存在返回null
     */
    public List<Permission> getPermissions(Long userId) {
        String key = RedisKeyConstants.getPermissionKey(userId);
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Permission>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize permissions", e);
        }
    }
    
    /**
     * 清除用户权限缓存
     * @param userId 用户ID
     */
    public void clearPermissions(Long userId) {
        String key = RedisKeyConstants.getPermissionKey(userId);
        redisTemplate.delete(key);
    }
    
    /**
     * 批量清除用户权限缓存
     * @param userIds 用户ID列表
     */
    public void clearPermissionsBatch(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }
        userIds.forEach(this::clearPermissions);
    }
    
    // ==================== 登录失败计数方法 ====================
    
    /**
     * 记录登录失败
     * @param username 用户名
     * @return 当前失败次数
     */
    public int recordLoginFailure(String username) {
        String key = RedisKeyConstants.getLoginFailKey(username);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == null) {
            count = 0L;
        }
        // 设置过期时间
        if (count == 1) {
            redisTemplate.expire(key, LOGIN_FAIL_EXPIRATION, TimeUnit.MILLISECONDS);
        }
        
        // 如果达到阈值，自动锁定账户
        if (count >= LOGIN_FAIL_THRESHOLD) {
            lockAccount(username);
        }
        
        return count.intValue();
    }
    
    /**
     * 获取登录失败次数
     * @param username 用户名
     * @return 失败次数
     */
    public int getLoginFailCount(String username) {
        String key = RedisKeyConstants.getLoginFailKey(username);
        String value = redisTemplate.opsForValue().get(key);
        return value == null ? 0 : Integer.parseInt(value);
    }
    
    /**
     * 清除登录失败记录
     * @param username 用户名
     */
    public void clearLoginFailCount(String username) {
        String key = RedisKeyConstants.getLoginFailKey(username);
        redisTemplate.delete(key);
    }
    
    /**
     * 检查是否需要锁定账户
     * @param username 用户名
     * @return 是否需要锁定
     */
    public boolean shouldLockAccount(String username) {
        return getLoginFailCount(username) >= LOGIN_FAIL_THRESHOLD;
    }
    
    // ==================== 账户锁定标记方法 ====================
    
    /**
     * 锁定账户
     * @param username 用户名
     */
    public void lockAccount(String username) {
        String key = RedisKeyConstants.getAccountLockedKey(username);
        redisTemplate.opsForValue().set(key, "1", ACCOUNT_LOCKED_EXPIRATION, TimeUnit.MILLISECONDS);
    }
    
    /**
     * 检查账户是否被锁定
     * @param username 用户名
     * @return 是否被锁定
     */
    public boolean isAccountLocked(String username) {
        String key = RedisKeyConstants.getAccountLockedKey(username);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    /**
     * 解锁账户
     * @param username 用户名
     */
    public void unlockAccount(String username) {
        String key = RedisKeyConstants.getAccountLockedKey(username);
        redisTemplate.delete(key);
    }
    
    /**
     * 获取账户锁定剩余时间（秒）
     * @param username 用户名
     * @return 剩余时间，未锁定返回0
     */
    public long getAccountLockRemainingTime(String username) {
        String key = RedisKeyConstants.getAccountLockedKey(username);
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }
}
