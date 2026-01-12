package cn.gsjgsj.authservice.controller;

import cn.gsjgsj.authservice.service.AuthService;
import cn.gsjgsj.authservice.service.UserService;
import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.User;
import cn.gsjgsj.common.service.RedisService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 用户管理控制器
 * 提供用户的创建、查询、更新、禁用和密码重置功能
 */
@RestController
@RequestMapping("/users")
public class UserController {
    
    private final UserService userService;
    private final RedisService redisService;
    private final BCryptPasswordEncoder passwordEncoder;
    
    public UserController(UserService userService, RedisService redisService) {
        this.userService = userService;
        this.redisService = redisService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }
    
    /**
     * 创建用户
     * @param user 用户对象（包含用户名、密码、昵称等信息）
     * @return 创建结果
     */
    @PostMapping
    public Result<User> createUser(@RequestBody User user) {
        try {
            // 验证必填字段
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return Result.error(400, "用户名不能为空");
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return Result.error(400, "密码不能为空");
            }
            
            // 检查用户名唯一性
            if (userService.isUsernameExists(user.getUsername())) {
                return Result.error(409, "用户名已存在");
            }
            
            // 加密密码
            String encryptedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encryptedPassword);
            
            // 创建用户
            boolean success = userService.createUser(user);
            if (success) {
                // 不返回密码
                user.setPassword(null);
                return Result.success(user);
            } else {
                return Result.error("创建用户失败");
            }
        } catch (IllegalArgumentException e) {
            return Result.error(409, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "创建用户失败：" + e.getMessage());
        }
    }
    
    /**
     * 查询用户列表（分页）
     * @param current 当前页码（默认1）
     * @param size 每页大小（默认10）
     * @param username 用户名（可选，用于筛选）
     * @return 分页结果
     */
    @GetMapping
    public Result<Page<User>> getUserList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String username) {
        try {
            Page<User> page = new Page<>(current, size);
            Page<User> result = userService.getUserList(page, username);
            
            // 不返回密码
            result.getRecords().forEach(user -> user.setPassword(null));
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(500, "查询用户列表失败：" + e.getMessage());
        }
    }
    
    /**
     * 更新用户信息
     * @param id 用户ID
     * @param user 用户对象（包含要更新的字段）
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            // 检查用户是否存在
            User existingUser = userService.getUserById(id);
            if (existingUser == null) {
                return Result.error(404, "用户不存在");
            }
            
            // 设置用户ID
            user.setId(id);
            
            // 如果要更新密码，需要加密
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                String encryptedPassword = passwordEncoder.encode(user.getPassword());
                user.setPassword(encryptedPassword);
                
                // 修改密码后，使所有令牌失效
                redisService.deleteToken(id);
            }
            
            // 更新用户
            boolean success = userService.updateUser(user);
            if (success) {
                // 查询更新后的用户信息
                User updatedUser = userService.getUserById(id);
                updatedUser.setPassword(null);
                return Result.success(updatedUser);
            } else {
                return Result.error("更新用户失败");
            }
        } catch (IllegalArgumentException e) {
            return Result.error(409, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "更新用户失败：" + e.getMessage());
        }
    }
    
    /**
     * 禁用用户
     * @param id 用户ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Result<Void> disableUser(@PathVariable Long id) {
        try {
            // 检查用户是否存在
            User user = userService.getUserById(id);
            if (user == null) {
                return Result.error(404, "用户不存在");
            }
            
            // 禁用用户
            boolean success = userService.disableUser(id);
            if (success) {
                // 禁用用户后，使该用户的所有令牌失效
                redisService.deleteToken(id);
                
                // 清除权限缓存
                redisService.clearPermissions(id);
                
                return Result.success();
            } else {
                return Result.error("禁用用户失败");
            }
        } catch (Exception e) {
            return Result.error(500, "禁用用户失败：" + e.getMessage());
        }
    }
    
    /**
     * 重置用户密码
     * @param id 用户ID
     * @return 临时密码
     */
    @PostMapping("/{id}/reset-password")
    public Result<String> resetPassword(@PathVariable Long id) {
        try {
            // 检查用户是否存在
            User user = userService.getUserById(id);
            if (user == null) {
                return Result.error(404, "用户不存在");
            }
            
            // 生成临时密码（8位随机字符串）
            String tempPassword = generateTempPassword();
            
            // 加密临时密码
            String encryptedPassword = passwordEncoder.encode(tempPassword);
            
            // 更新用户密码
            User updateUser = new User();
            updateUser.setId(id);
            updateUser.setPassword(encryptedPassword);
            boolean success = userService.updateUser(updateUser);
            
            if (success) {
                // 重置密码后，使该用户的所有令牌失效
                redisService.deleteToken(id);
                
                // 返回临时密码（实际应用中应该通过邮件或短信发送）
                return Result.success(tempPassword);
            } else {
                return Result.error("重置密码失败");
            }
        } catch (Exception e) {
            return Result.error(500, "重置密码失败：" + e.getMessage());
        }
    }
    
    /**
     * 生成临时密码
     * @return 8位随机密码
     */
    private String generateTempPassword() {
        // 生成8位随机密码（包含字母和数字）
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid.substring(0, 8);
    }
}
