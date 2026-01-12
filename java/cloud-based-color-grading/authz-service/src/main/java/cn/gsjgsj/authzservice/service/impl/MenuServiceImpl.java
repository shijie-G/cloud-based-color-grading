package cn.gsjgsj.authzservice.service.impl;

import cn.gsjgsj.authzservice.mapper.MenuMapper;
import cn.gsjgsj.authzservice.mapper.MenuPermissionMapper;
import cn.gsjgsj.authzservice.service.MenuService;
import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.entity.Menu;
import cn.gsjgsj.common.entity.MenuPermission;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 菜单服务实现类
 * 实现菜单管理和菜单树构建功能
 */
@Service
public class MenuServiceImpl implements MenuService {
    
    private final MenuMapper menuMapper;
    private final MenuPermissionMapper menuPermissionMapper;
    
    public MenuServiceImpl(MenuMapper menuMapper, MenuPermissionMapper menuPermissionMapper) {
        this.menuMapper = menuMapper;
        this.menuPermissionMapper = menuPermissionMapper;
    }
    
    /**
     * 获取用户菜单树
     * 根据用户权限查询可访问的菜单，并构建树形结构
     * @param userId 用户ID
     * @return 菜单树
     */
    @Override
    public List<MenuTreeNode> getUserMenuTree(Long userId) {
        // 查询用户可访问的菜单（已按sortOrder排序）
        List<Menu> menus = menuMapper.selectMenusByUserId(userId);
        
        // 构建菜单树
        return buildMenuTree(menus);
    }
    
    /**
     * 构建菜单树
     * 将菜单列表转换为树形结构
     * @param menus 菜单列表
     * @return 菜单树
     */
    @Override
    public List<MenuTreeNode> buildMenuTree(List<Menu> menus) {
        if (menus == null || menus.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 将Menu转换为MenuTreeNode
        List<MenuTreeNode> nodes = menus.stream()
                .map(this::convertToTreeNode)
                .collect(Collectors.toList());
        
        // 创建ID到节点的映射
        Map<Long, MenuTreeNode> nodeMap = new HashMap<>();
        for (MenuTreeNode node : nodes) {
            nodeMap.put(node.getId(), node);
        }
        
        // 构建树形结构
        List<MenuTreeNode> rootNodes = new ArrayList<>();
        for (MenuTreeNode node : nodes) {
            if (node.getParentId() == null || node.getParentId() == 0) {
                // 顶级菜单
                rootNodes.add(node);
            } else {
                // 子菜单，添加到父菜单的children中
                MenuTreeNode parent = nodeMap.get(node.getParentId());
                if (parent != null) {
                    parent.getChildren().add(node);
                }
            }
        }
        
        // 对每个节点的子节点按sortOrder排序
        sortChildren(rootNodes);
        
        return rootNodes;
    }
    
    /**
     * 递归排序子节点
     * @param nodes 节点列表
     */
    private void sortChildren(List<MenuTreeNode> nodes) {
        if (nodes == null || nodes.isEmpty()) {
            return;
        }
        
        // 按sortOrder排序
        nodes.sort((n1, n2) -> {
            if (n1.getSortOrder() == null) return 1;
            if (n2.getSortOrder() == null) return -1;
            return n1.getSortOrder().compareTo(n2.getSortOrder());
        });
        
        // 递归排序子节点
        for (MenuTreeNode node : nodes) {
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                sortChildren(node.getChildren());
            }
        }
    }
    
    /**
     * 将Menu转换为MenuTreeNode
     * @param menu 菜单对象
     * @return 菜单树节点
     */
    private MenuTreeNode convertToTreeNode(Menu menu) {
        MenuTreeNode node = new MenuTreeNode();
        node.setId(menu.getId());
        node.setParentId(menu.getParentId());
        node.setMenuName(menu.getMenuName());
        node.setMenuPath(menu.getMenuPath());
        node.setComponent(menu.getComponent());
        node.setIcon(menu.getIcon());
        node.setSortOrder(menu.getSortOrder());
        node.setChildren(new ArrayList<>());
        return node;
    }
    
    /**
     * 创建菜单
     * @param menu 菜单对象
     * @return 是否成功
     */
    @Override
    public boolean createMenu(Menu menu) {
        return menuMapper.insert(menu) > 0;
    }
    
    /**
     * 更新菜单
     * @param menu 菜单对象
     * @return 是否成功
     */
    @Override
    public boolean updateMenu(Menu menu) {
        return menuMapper.updateById(menu) > 0;
    }
    
    /**
     * 删除菜单
     * @param menuId 菜单ID
     * @return 是否成功
     */
    @Override
    public boolean deleteMenu(Long menuId) {
        return menuMapper.deleteById(menuId) > 0;
    }
    
    /**
     * 根据ID查询菜单
     * @param menuId 菜单ID
     * @return 菜单对象
     */
    @Override
    public Menu getMenuById(Long menuId) {
        return menuMapper.selectById(menuId);
    }
    
    /**
     * 查询所有菜单
     * @return 菜单列表
     */
    @Override
    public List<Menu> getAllMenus() {
        return menuMapper.selectList(null);
    }
    
    /**
     * 关联菜单和权限
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 是否成功
     */
    @Override
    public boolean associateMenuPermission(Long menuId, Long permissionId) {
        MenuPermission menuPermission = new MenuPermission();
        menuPermission.setMenuId(menuId);
        menuPermission.setPermissionId(permissionId);
        return menuPermissionMapper.insert(menuPermission) > 0;
    }
    
    /**
     * 取消菜单和权限的关联
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 是否成功
     */
    @Override
    public boolean disassociateMenuPermission(Long menuId, Long permissionId) {
        QueryWrapper<MenuPermission> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("menu_id", menuId)
                   .eq("permission_id", permissionId);
        return menuPermissionMapper.delete(queryWrapper) > 0;
    }
}
