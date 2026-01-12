package cn.gsjgsj.authservice.service.impl;

import cn.gsjgsj.authservice.mapper.UserMapper;
import cn.gsjgsj.authservice.service.UserService;
import cn.gsjgsj.common.entity.User;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 用户服务实现类
 */
@Service
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    
    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
    
    @Override
    public User getUserByUsername(String username) {
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        return userMapper.selectOne(queryWrapper);
    }
    
    @Override
    public User getUserById(Long userId) {
        return userMapper.selectById(userId);
    }
    
    @Override
    public boolean createUser(User user) {
        // 检查用户名是否已存在
        if (isUsernameExists(user.getUsername())) {
            throw new IllegalArgumentException("用户名已存在");
        }
        
        // 设置创建时间
        user.setCreateTime(LocalDateTime.now());
        
        // 设置默认状态为正常
        if (user.getStatus() == null) {
            user.setStatus(0);
        }
        
        return userMapper.insert(user) > 0;
    }
    
    @Override
    public boolean updateUser(User user) {
        // 如果要更新用户名，检查新用户名是否已被其他用户使用
        if (user.getUsername() != null) {
            User existingUser = getUserByUsername(user.getUsername());
            if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                throw new IllegalArgumentException("用户名已存在");
            }
        }
        
        return userMapper.updateById(user) > 0;
    }
    
    @Override
    public boolean isUsernameExists(String username) {
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        return userMapper.selectCount(queryWrapper) > 0;
    }
    
    @Override
    public Page<User> getUserList(Page<User> page, String username) {
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        
        // 如果提供了用户名，进行模糊查询
        if (username != null && !username.trim().isEmpty()) {
            queryWrapper.like(User::getUsername, username);
        }
        
        // 按创建时间倒序排列
        queryWrapper.orderByDesc(User::getCreateTime);
        
        return userMapper.selectPage(page, queryWrapper);
    }
    
    @Override
    public boolean disableUser(Long userId) {
        User user = new User();
        user.setId(userId);
        user.setStatus(1); // 1表示禁用
        return userMapper.updateById(user) > 0;
    }
    
    @Override
    public boolean enableUser(Long userId) {
        User user = new User();
        user.setId(userId);
        user.setStatus(0); // 0表示正常
        return userMapper.updateById(user) > 0;
    }
    
    @Override
    public void updateLastLoginTime(Long userId) {
        User user = new User();
        user.setId(userId);
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);
    }
}
