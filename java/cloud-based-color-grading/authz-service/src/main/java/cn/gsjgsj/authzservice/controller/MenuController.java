package cn.gsjgsj.authzservice.controller;

import cn.gsjgsj.authzservice.service.MenuService;
import cn.gsjgsj.common.dto.MenuTreeNode;
import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.Menu;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 菜单控制器
 * 提供菜单管理接口
 */
@RestController
@RequestMapping("/api/menus")
public class MenuController {
    
    private final MenuService menuService;
    
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }
    
    /**
     * 创建菜单
     * @param menu 菜单对象
     * @return 操作结果
     */
    @PostMapping
    public Result<Void> createMenu(@RequestBody Menu menu) {
        boolean success = menuService.createMenu(menu);
        if (success) {
            return Result.success();
        }
        return Result.error("创建菜单失败");
    }
    
    /**
     * 更新菜单
     * @param id 菜单ID
     * @param menu 菜单对象
     * @return 操作结果
     */
    @PutMapping("/{id}")
    public Result<Void> updateMenu(@PathVariable Long id, @RequestBody Menu menu) {
        menu.setId(id);
        boolean success = menuService.updateMenu(menu);
        if (success) {
            return Result.success();
        }
        return Result.error("更新菜单失败");
    }
    
    /**
     * 删除菜单
     * @param id 菜单ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteMenu(@PathVariable Long id) {
        boolean success = menuService.deleteMenu(id);
        if (success) {
            return Result.success();
        }
        return Result.error("删除菜单失败");
    }
    
    /**
     * 根据ID查询菜单
     * @param id 菜单ID
     * @return 菜单对象
     */
    @GetMapping("/{id}")
    public Result<Menu> getMenuById(@PathVariable Long id) {
        Menu menu = menuService.getMenuById(id);
        if (menu != null) {
            return Result.success(menu);
        }
        return Result.error("菜单不存在");
    }
    
    /**
     * 查询所有菜单
     * @return 菜单列表
     */
    @GetMapping
    public Result<List<Menu>> getAllMenus() {
        List<Menu> menus = menuService.getAllMenus();
        return Result.success(menus);
    }
    
    /**
     * 获取用户菜单树
     * @param userId 用户ID
     * @return 菜单树
     */
    @GetMapping("/user/{userId}/tree")
    public Result<List<MenuTreeNode>> getUserMenuTree(@PathVariable Long userId) {
        List<MenuTreeNode> menuTree = menuService.getUserMenuTree(userId);
        return Result.success(menuTree);
    }
    
    /**
     * 关联菜单和权限
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 操作结果
     */
    @PostMapping("/{menuId}/permissions/{permissionId}")
    public Result<Void> associateMenuPermission(
            @PathVariable Long menuId,
            @PathVariable Long permissionId) {
        boolean success = menuService.associateMenuPermission(menuId, permissionId);
        if (success) {
            return Result.success();
        }
        return Result.error("关联菜单权限失败");
    }
    
    /**
     * 取消菜单和权限的关联
     * @param menuId 菜单ID
     * @param permissionId 权限ID
     * @return 操作结果
     */
    @DeleteMapping("/{menuId}/permissions/{permissionId}")
    public Result<Void> disassociateMenuPermission(
            @PathVariable Long menuId,
            @PathVariable Long permissionId) {
        boolean success = menuService.disassociateMenuPermission(menuId, permissionId);
        if (success) {
            return Result.success();
        }
        return Result.error("取消菜单权限关联失败");
    }
}
