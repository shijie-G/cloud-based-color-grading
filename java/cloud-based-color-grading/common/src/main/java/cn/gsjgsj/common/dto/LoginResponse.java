package cn.gsjgsj.common.dto;

import lombok.Data;

import java.util.List;

/**
 * 登录响应DTO
 */
@Data
public class LoginResponse {
    
    /**
     * JWT令牌
     */
    private String token;
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 昵称
     */
    private String nickname;
    
    /**
     * 角色列表
     */
    private List<String> roles;
    
    /**
     * 权限列表
     */
    private List<String> permissions;
    
    /**
     * 菜单树
     */
    private List<MenuTreeNode> menus;
}
