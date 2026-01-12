package cn.gsjgsj.authzservice.service;

import cn.gsjgsj.authzservice.mapper.MenuMapper;
import cn.gsjgsj.authzservice.mapper.MenuPermissionMapper;
import cn.gsjgsj.authzservice.service.impl.MenuServiceImpl;
import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.entity.Menu;
import net.jqwik.api.*;
import org.mockito.Mockito;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 菜单树结构完整性属性测试
 * Feature: user-authentication-authorization, Property 5: 菜单树结构完整性
 * 
 * 属性：对于任何菜单列表，构建的菜单树应该包含所有菜单项，且每个菜单项只出现一次，父子关系正确
 * 验证需求：5.3
 */
class MenuTreeStructurePropertyTest {
    
    /**
     * 属性测试：菜单树包含所有菜单项
     * 对于任何菜单列表，构建的菜单树应该包含所有菜单项
     */
    @Property(tries = 100)
    void menuTreeContainsAllMenus(
            @ForAll("validMenuList") List<Menu> menus) {
        
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 执行：构建菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(menus);
        
        // 收集树中所有节点
        Set<Long> treeMenuIds = collectAllNodeIds(tree);
        
        // 收集原始菜单ID
        Set<Long> originalMenuIds = menus.stream()
                .map(Menu::getId)
                .collect(Collectors.toSet());
        
        // 验证：树中应该包含所有原始菜单
        assertThat(treeMenuIds)
                .as("菜单树应该包含所有原始菜单项")
                .containsExactlyInAnyOrderElementsOf(originalMenuIds);
    }
    
    /**
     * 属性测试：每个菜单项只出现一次
     * 对于任何菜单列表，构建的菜单树中每个菜单项应该只出现一次
     */
    @Property(tries = 100)
    void eachMenuAppearsOnlyOnce(
            @ForAll("validMenuList") List<Menu> menus) {
        
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 执行：构建菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(menus);
        
        // 收集树中所有节点ID
        List<Long> treeMenuIds = collectAllNodeIdsList(tree);
        
        // 验证：没有重复的菜单ID
        Set<Long> uniqueIds = new HashSet<>(treeMenuIds);
        assertThat(treeMenuIds)
                .as("菜单树中每个菜单项应该只出现一次")
                .hasSize(uniqueIds.size());
    }
    
    /**
     * 属性测试：父子关系正确
     * 对于任何菜单列表，构建的菜单树中父子关系应该正确
     */
    @Property(tries = 100)
    void parentChildRelationshipIsCorrect(
            @ForAll("validMenuList") List<Menu> menus) {
        
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 创建原始菜单的父子关系映射
        Map<Long, Long> originalParentMap = menus.stream()
                .collect(Collectors.toMap(Menu::getId, Menu::getParentId));
        
        // 执行：构建菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(menus);
        
        // 验证：树中的父子关系与原始数据一致
        verifyParentChildRelationship(tree, originalParentMap, 0L);
    }
    
    /**
     * 属性测试：菜单按sortOrder排序
     * 对于任何菜单列表，构建的菜单树应该按sortOrder排序
     */
    @Property(tries = 100)
    void menusAreSortedBySortOrder(
            @ForAll("validMenuList") List<Menu> menus) {
        
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 执行：构建菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(menus);
        
        // 验证：所有层级的菜单都按sortOrder排序
        verifySortOrder(tree);
    }
    
    /**
     * 属性测试：空菜单列表返回空树
     * 对于空菜单列表，应该返回空的菜单树
     */
    @Property(tries = 100)
    void emptyMenuListReturnsEmptyTree() {
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 执行：构建空菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(new ArrayList<>());
        
        // 验证：应该返回空列表
        assertThat(tree)
                .as("空菜单列表应该返回空树")
                .isEmpty();
    }
    
    /**
     * 属性测试：单个菜单构建正确
     * 对于只有一个菜单的列表，应该正确构建包含该菜单的树
     */
    @Property(tries = 100)
    void singleMenuBuildsCorrectly(
            @ForAll("menuIds") long menuId,
            @ForAll("menuNames") String menuName,
            @ForAll("sortOrders") int sortOrder) {
        
        // 创建mocks
        MenuMapper menuMapper = Mockito.mock(MenuMapper.class);
        MenuPermissionMapper menuPermissionMapper = Mockito.mock(MenuPermissionMapper.class);
        MenuService menuService = new MenuServiceImpl(menuMapper, menuPermissionMapper);
        
        // 创建单个菜单
        Menu menu = createMenu(menuId, 0L, menuName, sortOrder);
        List<Menu> menus = Collections.singletonList(menu);
        
        // 执行：构建菜单树
        List<MenuTreeNode> tree = menuService.buildMenuTree(menus);
        
        // 验证：应该有一个根节点
        assertThat(tree)
                .as("单个顶级菜单应该构建为包含一个根节点的树")
                .hasSize(1);
        
        MenuTreeNode node = tree.get(0);
        assertThat(node.getId()).isEqualTo(menuId);
        assertThat(node.getMenuName()).isEqualTo(menuName);
        assertThat(node.getSortOrder()).isEqualTo(sortOrder);
        assertThat(node.getChildren()).isEmpty();
    }
    
    // ========== 辅助方法 ==========
    
    /**
     * 收集树中所有节点的ID（Set）
     */
    private Set<Long> collectAllNodeIds(List<MenuTreeNode> nodes) {
        Set<Long> ids = new HashSet<>();
        for (MenuTreeNode node : nodes) {
            ids.add(node.getId());
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                ids.addAll(collectAllNodeIds(node.getChildren()));
            }
        }
        return ids;
    }
    
    /**
     * 收集树中所有节点的ID（List）
     */
    private List<Long> collectAllNodeIdsList(List<MenuTreeNode> nodes) {
        List<Long> ids = new ArrayList<>();
        for (MenuTreeNode node : nodes) {
            ids.add(node.getId());
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                ids.addAll(collectAllNodeIdsList(node.getChildren()));
            }
        }
        return ids;
    }
    
    /**
     * 验证父子关系
     */
    private void verifyParentChildRelationship(
            List<MenuTreeNode> nodes, 
            Map<Long, Long> originalParentMap, 
            Long expectedParentId) {
        
        for (MenuTreeNode node : nodes) {
            // 验证当前节点的父ID与预期一致
            Long originalParentId = originalParentMap.get(node.getId());
            if (expectedParentId == 0L) {
                // 根节点的parentId应该是0或null
                assertThat(originalParentId == null || originalParentId == 0L)
                        .as("根节点的parentId应该是0或null")
                        .isTrue();
            } else {
                assertThat(originalParentId)
                        .as("节点 " + node.getId() + " 的父ID应该是 " + expectedParentId)
                        .isEqualTo(expectedParentId);
            }
            
            // 递归验证子节点
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                verifyParentChildRelationship(node.getChildren(), originalParentMap, node.getId());
            }
        }
    }
    
    /**
     * 验证排序顺序
     */
    private void verifySortOrder(List<MenuTreeNode> nodes) {
        if (nodes == null || nodes.size() <= 1) {
            return;
        }
        
        // 验证当前层级是否按sortOrder排序
        for (int i = 0; i < nodes.size() - 1; i++) {
            MenuTreeNode current = nodes.get(i);
            MenuTreeNode next = nodes.get(i + 1);
            
            if (current.getSortOrder() != null && next.getSortOrder() != null) {
                assertThat(current.getSortOrder())
                        .as("菜单应该按sortOrder升序排列")
                        .isLessThanOrEqualTo(next.getSortOrder());
            }
        }
        
        // 递归验证子节点的排序
        for (MenuTreeNode node : nodes) {
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                verifySortOrder(node.getChildren());
            }
        }
    }
    
    /**
     * 创建菜单对象
     */
    private Menu createMenu(Long id, Long parentId, String name, int sortOrder) {
        Menu menu = new Menu();
        menu.setId(id);
        menu.setParentId(parentId);
        menu.setMenuName(name);
        menu.setMenuPath("/path/" + id);
        menu.setComponent("Component" + id);
        menu.setIcon("icon-" + id);
        menu.setSortOrder(sortOrder);
        menu.setVisible(0);
        menu.setStatus(0);
        return menu;
    }
    
    // ========== 数据生成器 ==========
    
    /**
     * 生成有效的菜单列表
     * 包含根菜单和子菜单，确保父子关系有效
     */
    @Provide
    Arbitrary<List<Menu>> validMenuList() {
        return Arbitraries.integers().between(1, 10).flatMap(size -> {
            List<Menu> menus = new ArrayList<>();
            
            // 生成根菜单（parentId = 0）
            int rootCount = Math.max(1, size / 3);
            for (int i = 1; i <= rootCount; i++) {
                Menu menu = createMenu(
                        (long) i,
                        0L,
                        "RootMenu" + i,
                        i * 10
                );
                menus.add(menu);
            }
            
            // 生成子菜单
            int childCount = size - rootCount;
            for (int i = 1; i <= childCount; i++) {
                // 随机选择一个根菜单作为父菜单
                long parentId = (long) (1 + (i % rootCount));
                Menu menu = createMenu(
                        (long) (rootCount + i),
                        parentId,
                        "ChildMenu" + i,
                        i * 10
                );
                menus.add(menu);
            }
            
            return Arbitraries.just(menus);
        });
    }
    
    /**
     * 生成菜单ID (1-1000)
     */
    @Provide
    Arbitrary<Long> menuIds() {
        return Arbitraries.longs().between(1L, 1000L);
    }
    
    /**
     * 生成菜单名称
     */
    @Provide
    Arbitrary<String> menuNames() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(3)
                .ofMaxLength(20);
    }
    
    /**
     * 生成排序顺序 (0-100)
     */
    @Provide
    Arbitrary<Integer> sortOrders() {
        return Arbitraries.integers().between(0, 100);
    }
}
