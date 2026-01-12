package cn.gsjgsj.common.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 菜单权限关联实体类
 */
@Data
@TableName("sys_menu_permission")
public class MenuPermission {
    
    /**
     * 菜单ID
     */
    private Long menuId;
    
    /**
     * 权限ID
     */
    private Long permissionId;
}
