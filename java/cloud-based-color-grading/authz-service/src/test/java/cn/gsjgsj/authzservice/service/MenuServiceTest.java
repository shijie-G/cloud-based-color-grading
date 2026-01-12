package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.authzservice.mapper.MenuMapper;
import cn.gsjgsj.authzservice.mapper.MenuPermissionMapper;
import cn.gsjgsj.authzservice.service.impl.MenuServiceImpl;
import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.entity.Menu;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * 菜单服务单元测试
 * 验证需求：5.2, 5.3
 */
class MenuServiceTest {
    
    private MenuMapper menuMapper;
    private MenuPermissionMapper menuPermissionMapper;
    private MenuService menuService;
    
    @BeforeEach
    void setUp() {
        menuMapper = Mockito.mock(MenuMapper.class);
        menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
    }
    
    /**
     * 测试用户只能看到有权限的菜单
     * 验证需求：5.2
     */
    @Test
    void testGetUserMenuTree_OnlyReturnsAuthorizedMenus() {
        // Given - 用户ID
        Long userId = 1L;
        
        // 创建用户有权限的菜单列表
        List<Menu> authorizedMenus = Arrays.asList(
                createMenu(1L, 0L, "系统管理", "/system", 1),
                createMenu(2L, 1L, "用户管理", "/system/user", 2),
                createMenu(3L, 1L, "角色管理", "/system/role", 3)
        );
        
        // Mock mapper返回用户有权限的菜单
        when(menuMapper.selectMenusByUserId(userId)).thenReturn(authorizedMenus);
        
        // When - 获取用户菜单树
        List<MenuTreeNode> menuTree = menuService.getUserMenuTree(userId);
        
        // Then - 验证返回的菜单树只包含有权限的菜单
        assertThat(menuTree).isNotNull();
        assertThat(menuTree).hasSize(1); // 只有一个根菜单
        
        MenuTreeNode rootMenu = menuTree.get(0);
        assertThat(rootMenu.getId()).isEqualTo(1L);
        assertThat(rootMenu.getMenuName()).isEqualTo("系统管理");
        assertThat(rootMenu.getChildren()).hasSize(2); // 两个子菜单
        
        // 验证子菜单
        assertThat(rootMenu.getChildren())
                .extracting(MenuTreeNode::getId)
                .containsExactly(2L, 3L);
    }
    
    /**
     * 测试用户没有权限时返回空菜单树
     * 验证需求：5.2
     */
    @Test
    void testGetUserMenuTree_NoPermissions_ReturnsEmptyTree() {
        // Given - 用户ID
        Long userId = 999L;
        
        // Mock mapper返回空列表（用户没有任何权限）
        when(menuMapper.selectMenusByUserId(userId)).thenReturn(new ArrayList<>());
        
        // When - 获取用户菜单树
        List<MenuTreeNode> menuTree = menuService.getUserMenuTree(userId);
        
        // Then - 验证返回空树
        assertThat(menuTree).isNotNull();
        assertThat(menuTree).isEmpty();
    }
    
    /**
     * 测试菜单树的父子关系正确性
     * 验证需求：5.3
     */
    @Test
    void testBuildMenuTree_CorrectParentChildRelationship() {
        // Given - 创建多层级菜单
        List<Menu> menus = Arrays.asList(
                createMenu(1L, 0L, "系统管理", "/system", 1),
                createMenu(2L, 1L, "用户管理", "/system/user", 2),
                createMenu(3L, 1L, "角色管理", "/system/role", 3),
                createMenu(4L, 2L, "用户列表", "/system/user/list", 4),
                createMenu(5L, 2L, "用户添加", "/system/user/add", 5),
                createMenu(6L, 0L, "内容管理", "/content", 6),
                createMenu(7L, 6L, "文章管理", "/content/article", 7)
        );
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证树结构
        assertThat(menuTree).hasSize(2); // 两个根菜单
        
        // 验证第一个根菜单（系统管理）
        MenuTreeNode systemMenu = menuTree.get(0);
        assertThat(systemMenu.getId()).isEqualTo(1L);
        assertThat(systemMenu.getParentId()).isEqualTo(0L);
        assertThat(systemMenu.getChildren()).hasSize(2); // 两个子菜单
        
        // 验证用户管理子菜单
        MenuTreeNode userMenu = systemMenu.getChildren().get(0);
        assertThat(userMenu.getId()).isEqualTo(2L);
        assertThat(userMenu.getParentId()).isEqualTo(1L);
        assertThat(userMenu.getChildren()).hasSize(2); // 两个孙菜单
        
        // 验证用户列表孙菜单
        MenuTreeNode userListMenu = userMenu.getChildren().get(0);
        assertThat(userListMenu.getId()).isEqualTo(4L);
        assertThat(userListMenu.getParentId()).isEqualTo(2L);
        assertThat(userListMenu.getChildren()).isEmpty(); // 叶子节点
        
        // 验证角色管理子菜单
        MenuTreeNode roleMenu = systemMenu.getChildren().get(1);
        assertThat(roleMenu.getId()).isEqualTo(3L);
        assertThat(roleMenu.getParentId()).isEqualTo(1L);
        assertThat(roleMenu.getChildren()).isEmpty(); // 叶子节点
        
        // 验证第二个根菜单（内容管理）
        MenuTreeNode contentMenu = menuTree.get(1);
        assertThat(contentMenu.getId()).isEqualTo(6L);
        assertThat(contentMenu.getParentId()).isEqualTo(0L);
        assertThat(contentMenu.getChildren()).hasSize(1); // 一个子菜单
        
        // 验证文章管理子菜单
        MenuTreeNode articleMenu = contentMenu.getChildren().get(0);
        assertThat(articleMenu.getId()).isEqualTo(7L);
        assertThat(articleMenu.getParentId()).isEqualTo(6L);
        assertThat(articleMenu.getChildren()).isEmpty(); // 叶子节点
    }
    
    /**
     * 测试菜单按sortOrder排序
     * 验证需求：5.5
     */
    @Test
    void testBuildMenuTree_MenusSortedBySortOrder() {
        // Given - 创建乱序的菜单列表
        List<Menu> menus = Arrays.asList(
                createMenu(3L, 1L, "角色管理", "/system/role", 30),
                createMenu(1L, 0L, "系统管理", "/system", 10),
                createMenu(5L, 2L, "用户添加", "/system/user/add", 52),
                createMenu(2L, 1L, "用户管理", "/system/user", 20),
                createMenu(4L, 2L, "用户列表", "/system/user/list", 51)
        );
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证排序
        assertThat(menuTree).hasSize(1);
        
        MenuTreeNode rootMenu = menuTree.get(0);
        assertThat(rootMenu.getSortOrder()).isEqualTo(10);
        
        // 验证子菜单按sortOrder排序
        List<MenuTreeNode> children = rootMenu.getChildren();
        assertThat(children).hasSize(2);
        assertThat(children.get(0).getSortOrder()).isEqualTo(20); // 用户管理
        assertThat(children.get(1).getSortOrder()).isEqualTo(30); // 角色管理
        
        // 验证孙菜单按sortOrder排序
        List<MenuTreeNode> grandChildren = children.get(0).getChildren();
        assertThat(grandChildren).hasSize(2);
        assertThat(grandChildren.get(0).getSortOrder()).isEqualTo(51); // 用户列表
        assertThat(grandChildren.get(1).getSortOrder()).isEqualTo(52); // 用户添加
    }
    
    /**
     * 测试空菜单列表返回空树
     * 验证需求：5.3
     */
    @Test
    void testBuildMenuTree_EmptyList_ReturnsEmptyTree() {
        // Given - 空菜单列表
        List<Menu> menus = new ArrayList<>();
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证返回空树
        assertThat(menuTree).isNotNull();
        assertThat(menuTree).isEmpty();
    }
    
    /**
     * 测试只有根菜单的情况
     * 验证需求：5.3
     */
    @Test
    void testBuildMenuTree_OnlyRootMenus() {
        // Given - 只有根菜单
        List<Menu> menus = Arrays.asList(
                createMenu(1L, 0L, "系统管理", "/system", 1),
                createMenu(2L, 0L, "内容管理", "/content", 2),
                createMenu(3L, 0L, "报表管理", "/report", 3)
        );
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证树结构
        assertThat(menuTree).hasSize(3);
        
        // 验证每个根菜单都没有子菜单
        for (MenuTreeNode node : menuTree) {
            assertThat(node.getParentId()).isEqualTo(0L);
            assertThat(node.getChildren()).isEmpty();
        }
    }
    
    /**
     * 测试孤儿菜单（父菜单不存在）的处理
     * 验证需求：5.3
     */
    @Test
    void testBuildMenuTree_OrphanMenus_NotIncludedInTree() {
        // Given - 包含孤儿菜单（parentId指向不存在的菜单）
        List<Menu> menus = Arrays.asList(
                createMenu(1L, 0L, "系统管理", "/system", 1),
                createMenu(2L, 1L, "用户管理", "/system/user", 2),
                createMenu(3L, 999L, "孤儿菜单", "/orphan", 3) // 父菜单999不存在
        );
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证孤儿菜单不在树中
        assertThat(menuTree).hasSize(1);
        
        MenuTreeNode rootMenu = menuTree.get(0);
        assertThat(rootMenu.getId()).isEqualTo(1L);
        assertThat(rootMenu.getChildren()).hasSize(1);
        assertThat(rootMenu.getChildren().get(0).getId()).isEqualTo(2L);
        
        // 验证孤儿菜单不在树的任何位置
        List<Long> allIds = collectAllIds(menuTree);
        assertThat(allIds).doesNotContain(3L);
    }
    
    /**
     * 测试菜单树节点包含所有必要字段
     * 验证需求：5.5
     */
    @Test
    void testBuildMenuTree_NodeContainsAllFields() {
        // Given - 创建完整的菜单
        Menu menu = new Menu();
        menu.setId(1L);
        menu.setParentId(0L);
        menu.setMenuName("系统管理");
        menu.setMenuPath("/system");
        menu.setComponent("SystemComponent");
        menu.setIcon("system-icon");
        menu.setSortOrder(10);
        menu.setVisible(0);
        menu.setStatus(0);
        
        List<Menu> menus = Arrays.asList(menu);
        
        // When - 构建菜单树
        List<MenuTreeNode> menuTree = menuService.buildMenuTree(menus);
        
        // Then - 验证节点包含所有字段
        assertThat(menuTree).hasSize(1);
        
        MenuTreeNode node = menuTree.get(0);
        assertThat(node.getId()).isEqualTo(1L);
        assertThat(node.getParentId()).isEqualTo(0L);
        assertThat(node.getMenuName()).isEqualTo("系统管理");
        assertThat(node.getMenuPath()).isEqualTo("/system");
        assertThat(node.getComponent()).isEqualTo("SystemComponent");
        assertThat(node.getIcon()).isEqualTo("system-icon");
        assertThat(node.getSortOrder()).isEqualTo(10);
        assertThat(node.getChildren()).isNotNull();
    }
    
    // ========== 辅助方法 ==========
    
    /**
     * 创建菜单对象
     */
    private Menu createMenu(Long id, Long parentId, String name, String path, int sortOrder) {
        Menu menu = new Menu();
        menu.setId(id);
        menu.setParentId(parentId);
        menu.setMenuName(name);
        menu.setMenuPath(path);
        menu.setComponent("Component" + id);
        menu.setIcon("icon-" + id);
        menu.setSortOrder(sortOrder);
        menu.setVisible(0);
        menu.setStatus(0);
        return menu;
    }
    
    /**
     * 收集树中所有节点的ID
     */
    private List<Long> collectAllIds(List<MenuTreeNode> nodes) {
        List<Long> ids = new ArrayList<>();
        for (MenuTreeNode node : nodes) {
            ids.add(node.getId());
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                ids.addAll(collectAllIds(node.getChildren()));
            }
        }
        return ids;
    }
}
