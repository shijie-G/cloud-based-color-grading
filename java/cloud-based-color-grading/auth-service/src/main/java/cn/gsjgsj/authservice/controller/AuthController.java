package cn.gsjgsj.authservice.controller;

import cn.gsjgsj.authservice.service.AuthService;
import cn.gsjgsj.common.dto.LoginRequest;
import cn.gsjgsj.common.dto.LoginResponse;
import cn.gsjgsj.common.dto.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 提供登录、登出、令牌刷新等接口
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    /**
     * 用户登录接口
     * @param loginRequest 登录请求（包含用户名和密码）
     * @return 登录响应（包含令牌、用户信息和菜单）
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(
                loginRequest.getUsername(), 
                loginRequest.getPassword()
            );
            return Result.success(response);
        } catch (IllegalArgumentException e) {
            // 用户名或密码错误
            return Result.error(401, e.getMessage());
        } catch (IllegalStateException e) {
            // 账户被锁定或禁用
            return Result.error(403, e.getMessage());
        } catch (Exception e) {
            // 其他异常
            return Result.error(500, "登录失败：" + e.getMessage());
        }
    }
    
    /**
     * 用户登出接口
     * @param userId 用户ID（从请求头或令牌中提取）
     * @return 操作结果
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("X-User-Id") Long userId) {
        try {
            authService.logout(userId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(500, "登出失败：" + e.getMessage());
        }
    }
    
    /**
     * 刷新令牌接口
     * @param authorization Authorization头（Bearer token）
     * @return 新令牌
     */
    @PostMapping("/refresh")
    public Result<String> refreshToken(@RequestHeader("Authorization") String authorization) {
        try {
            // 提取Bearer token
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return Result.error(401, "令牌格式错误");
            }
            
            String oldToken = authorization.substring(7);
            String newToken = authService.refreshToken(oldToken);
            return Result.success(newToken);
        } catch (IllegalArgumentException e) {
            // 令牌无效或已失效
            return Result.error(401, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "刷新令牌失败：" + e.getMessage());
        }
    }
}
