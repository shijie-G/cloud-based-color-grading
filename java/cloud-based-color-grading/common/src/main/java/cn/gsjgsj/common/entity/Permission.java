package cn.gsjgsj.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 权限实体类
 */
@Data
@TableName("sys_permission")
public class Permission {
    
    /**
     * 权限ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 权限名称
     */
    private String permissionName;
    
    /**
     * 权限标识（如system:user:add）
     */
    private String permissionKey;
    
    /**
     * 资源类型：menu/button/api
     */
    private String resourceType;
    
    /**
     * 资源路径
     */
    private String resourcePath;
    
    /**
     * HTTP方法：GET/POST/PUT/DELETE
     */
    private String method;
    
    /**
     * 描述
     */
    private String description;
}
