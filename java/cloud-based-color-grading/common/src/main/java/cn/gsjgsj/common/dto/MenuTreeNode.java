package cn.gsjgsj.common.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 菜单树节点DTO
 */
@Data
public class MenuTreeNode {
    
    /**
     * 菜单ID
     */
    private Long id;
    
    /**
     * 父菜单ID
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
     * 子菜单列表
     */
    private List<MenuTreeNode> children = new ArrayList<>();
}
