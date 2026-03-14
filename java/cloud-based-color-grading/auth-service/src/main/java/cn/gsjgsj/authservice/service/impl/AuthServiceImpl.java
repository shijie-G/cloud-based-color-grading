package cn.gsjgsj.authservice.service.impl;

import cn.gsjgsj.authservice.client.AuthzServiceClient;
import cn.gsjgsj.authservice.security.SecurityAuditLogger;
import cn.gsjgsj.authservice.service.AuthService;
import cn.gsjgsj.authservice.service.UserService;
import cn.gsjgsj.common.dto.LoginResponse;
import cn.gsjgsj.common.entity.User;
import cn.gsjgsj.common.service.RedisService;
import cn.gsjgsj.common.util.JwtTokenProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 认证服务实现类
 */
@Service
public class AuthServiceImpl implements AuthService {
    
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisService redisService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final SecurityAuditLogger securityAuditLogger;
    private final AuthzServiceClient authzServiceClient;
    
    public AuthServiceImpl(UserService userService, 
                          JwtTokenProvider jwtTokenProvider,
                          RedisService redisService,
                          SecurityAuditLogger securityAuditLogger,
                          AuthzServiceClient authzServiceClient) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.redisService = redisService;
        this.securityAuditLogger = securityAuditLogger;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.authzServiceClient = authzServiceClient;
    }
    
    @Override
    public LoginResponse login(String username, String password) {
        String ipAddress = "unknown"; // TODO: Extract from request context
        
        // 1. 检查账户是否被锁定
        if (isAccountLocked(username)) {
            long remainingTime = redisService.getAccountLockRemainingTime(username);
            securityAuditLogger.logLoginFailure(username, "Account locked", ipAddress);
            throw new IllegalStateException("账户已被锁定，请在 " + remainingTime + " 秒后重试");
        }
        
        // 2. 查询用户
        User user = userService.getUserByUsername(username);
        if (user == null) {
            // 记录登录失败
            recordLoginFailure(username);
            securityAuditLogger.logLoginFailure(username, "User not found", ipAddress);
            throw new IllegalArgumentException("用户名或密码错误");
        }
        
        // 3. 检查用户状态
        if (user.getStatus() != null && user.getStatus() == 1) {
            securityAuditLogger.logLoginFailure(username, "Account disabled", ipAddress);
            throw new IllegalStateException("账户已被禁用");
        }
        
        // 4. 验证密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            // 记录登录失败
            boolean locked = recordLoginFailure(username);
            if (locked) {
                int failCount = redisService.getLoginFailCount(username);
                securityAuditLogger.logAccountLocked(username, failCount, ipAddress);
            } else {
                securityAuditLogger.logLoginFailure(username, "Invalid password", ipAddress);
            }
            throw new IllegalArgumentException("用户名或密码错误");
        }
        
        // 5. 登录成功，清除失败记录
        redisService.clearLoginFailCount(username);
        redisService.unlockAccount(username);
        
        // 6. 生成JWT令牌
        // TODO: 从数据库查询用户角色，这里暂时使用空列表
        List<String> roles = new ArrayList<>();
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), roles);
        
        // 7. 存储令牌到Redis
        redisService.saveToken(user.getId(), token);
        
        // 8. 更新最后登录时间
        userService.updateLastLoginTime(user.getId());
        
        // 9. 记录登录成功
        securityAuditLogger.logLoginSuccess(username, user.getId(), ipAddress);
        
        // 10. 构建登录响应
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setNickname(user.getNickname());
        response.setRoles(roles);
        
        // 查询用户权限和菜单
        try {
            List<String> permissions = authzServiceClient.getUserPermissions(user.getId());
            response.setPermissions(permissions);
            
            Object menus = authzServiceClient.getUserMenuTree(user.getId());
            response.setMenus((List) menus);
        } catch (Exception e) {
            // 如果查询权限失败，使用空列表，不影响登录
            response.setPermissions(new ArrayList<>());
            response.setMenus(new ArrayList<>());
        }
        
        return response;
    }
    
    @Override
    public void logout(Long userId) {
        String ipAddress = "unknown"; // TODO: Extract from request context
        
        // 从Redis中删除令牌
        redisService.deleteToken(userId);
        
        // 清除权限缓存
        redisService.clearPermissions(userId);
        
        // 记录登出事件
        securityAuditLogger.logLogout("user-" + userId, userId, ipAddress);
    }
    
    @Override
    public String refreshToken(String oldToken) {
        String ipAddress = "unknown"; // TODO: Extract from request context
        
        // 1. 验证旧令牌
        if (!jwtTokenProvider.validateToken(oldToken)) {
            securityAuditLogger.logTokenValidationFailure(oldToken, "Invalid token", ipAddress);
            throw new IllegalArgumentException("令牌无效");
        }
        
        // 2. 从旧令牌中提取用户信息
        Long userId = jwtTokenProvider.getUserIdFromToken(oldToken);
        String username = jwtTokenProvider.getUsernameFromToken(oldToken);
        List<String> roles = jwtTokenProvider.getRolesFromToken(oldToken);
        
        // 3. 检查Redis中的令牌是否匹配
        String storedToken = redisService.getToken(userId);
        if (storedToken == null || !storedToken.equals(oldToken)) {
            securityAuditLogger.logTokenValidationFailure(oldToken, "Token mismatch or not found", ipAddress);
            throw new IllegalArgumentException("令牌已失效");
        }
        
        // 4. 生成新令牌
        String newToken = jwtTokenProvider.generateToken(userId, username, roles);
        
        // 5. 更新Redis中的令牌
        redisService.saveToken(userId, newToken);
        
        // 6. 记录令牌刷新
        securityAuditLogger.logTokenRefresh(username, userId, ipAddress);
        
        return newToken;
    }
    
    @Override
    public boolean validateToken(String token) {
        // 1. 验证JWT令牌格式和签名
        if (!jwtTokenProvider.validateToken(token)) {
            return false;
        }
        
        // 2. 从令牌中提取用户ID
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        
        // 3. 检查Redis中是否存在该令牌
        String storedToken = redisService.getToken(userId);
        
        // 4. 比对令牌是否一致
        return storedToken != null && storedToken.equals(token);
    }
    
    @Override
    public boolean recordLoginFailure(String username) {
        // 记录登录失败次数
        int failCount = redisService.recordLoginFailure(username);
        
        // 检查是否需要锁定账户
        if (redisService.shouldLockAccount(username)) {
            redisService.lockAccount(username);
            return true;
        }
        
        return false;
    }
    
    @Override
    public boolean isAccountLocked(String username) {
        return redisService.isAccountLocked(username);
    }
}