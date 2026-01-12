package cn.gsjgsj.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 菜单实体类
 */
@Data
@TableName("sys_menu")
public class Menu {
    
    /**
     * 菜单ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 父菜单ID，0表示顶级菜单
     */
    private Long parentId;
    
    /**
     * 菜单名称
     */
    private String menuName;
    
    /**
     * 路由路径
     */
    private String menuPath;
    
    /**
     * 组件路径
     */
    private String component;
    
    /**
     * 图标
     */
    private String icon;
    
    /**
     * 排序
     */
    private Integer sortOrder;
    
    /**
     * 是否可见：0-显示 1-隐藏
     */
    private Integer visible;
    
    /**
     * 状态：0-正常 1-禁用
     */
    private Integer status;
}
