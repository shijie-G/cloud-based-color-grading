package cn.gsjgsj.authservice.service;

import cn.gsjgsj.common.dto.LoginResponse;

/**
 * 认证服务接口
 * 提供用户登录、登出、令牌刷新等认证功能
 */
public interface AuthService {
    
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return 登录响应（包含令牌、用户信息、菜单）
     */
    LoginResponse login(String username, String password);
    
    /**
     * 用户登出
     * @param userId 用户ID
     */
    void logout(Long userId);
    
    /**
     * 刷新令牌
     * @param oldToken 旧令牌
     * @return 新令牌
     */
    String refreshToken(String oldToken);
    
    /**
     * 验证令牌
     * @param token JWT令牌
     * @return 是否有效
     */
    boolean validateToken(String token);
    
    /**
     * 记录登录失败
     * @param username 用户名
     * @return 是否需要锁定账户
     */
    boolean recordLoginFailure(String username);
    
    /**
     * 检查账户是否被锁定
     * @param username 用户名
     * @return 是否被锁定
     */
    boolean isAccountLocked(String username);
}
