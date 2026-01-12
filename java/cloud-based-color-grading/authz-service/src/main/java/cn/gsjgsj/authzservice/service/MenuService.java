package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.entity.Menu;

import java.util.List;

/**
 * 菜单服务接口
 * 提供菜单管理和菜单树构建功能
 */
public interface MenuService {
    
    /**
     * 获取用户菜单树
     * 根据用户权限查询可访问的菜单，并构建树形结构
     * @param userId 用户ID
     * @return 菜单树
     */
    List<MenuTreeNode> getUserMenuTree(Long userId);
    
    /**
     * 构建菜单树
     * 将菜单列表转换为树形结构
     * @param menus 菜单列表
     * @return 菜单树
     */
    List<MenuTreeNode> buildMenuTree(List<Menu> menus);
    
    /**
     * 创建菜单
     * @param menu 菜单对象
     * @return 是否成功
     */
    boolean createMenu(Menu menu);
    
    /**
     * 更新菜单
     * @param menu 菜单对象
     * @return 是否成功
     */
    boolean updateMenu(Menu menu);
    
    /**
     * 删除菜单
     * @param menuId 菜单ID
     * @return 是否成功
     */
    boolean deleteMenu(Long menuId);
    
    /**
     * 根据ID查询菜单
     * @param menuId 菜单ID
     * @return 菜单对象
     */
    Menu getMenuById(Long menuId);
    
    /**
     * 查询所有菜单
     * @return 菜单列表
     */
    List<Menu> getAllMenus();
    
    /**
     * 关联菜单和权限
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 是否成功
     */
    boolean associateMenuPermission(Long menuId, Long permissionId);
    
    /**
     * 取消菜单和权限的关联
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 是否成功
     */
    boolean disassociateMenuPermission(Long menuId, Long permissionId);
}
