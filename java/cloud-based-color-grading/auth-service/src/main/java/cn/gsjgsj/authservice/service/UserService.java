package cn.gsjgsj.authservice.service;

import cn.gsjgsj.common.entity.User;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

/**
 * 用户服务接口
 * 提供用户管理功能
 */
public interface UserService {
    
    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户对象，不存在返回null
     */
    User getUserByUsername(String username);
    
    /**
     * 根据用户ID查询用户
     * @param userId 用户ID
     * @return 用户对象，不存在返回null
     */
    User getUserById(Long userId);
    
    /**
     * 创建用户
     * @param user 用户对象
     * @return 创建成功返回true
     */
    boolean createUser(User user);
    
    /**
     * 更新用户信息
     * @param user 用户对象
     * @return 更新成功返回true
     */
    boolean updateUser(User user);
    
    /**
     * 检查用户名是否已存在
     * @param username 用户名
     * @return 存在返回true
     */
    boolean isUsernameExists(String username);
    
    /**
     * 分页查询用户列表
     * @param page 分页对象
     * @param username 用户名（可选，用于筛选）
     * @return 分页结果
     */
    Page<User> getUserList(Page<User> page, String username);
    
    /**
     * 禁用用户
     * @param userId 用户ID
     * @return 禁用成功返回true
     */
    boolean disableUser(Long userId);
    
    /**
     * 启用用户
     * @param userId 用户ID
     * @return 启用成功返回true
     */
    boolean enableUser(Long userId);
    
    /**
     * 更新用户最后登录时间
     * @param userId 用户ID
     */
    void updateLastLoginTime(Long userId);
}
