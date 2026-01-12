package cn.gsjgsj.authzservice.mapper;

import cn.gsjgsj.common.entity.Menu;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 菜单Mapper接口
 * 提供菜单的CRUD操作和菜单查询
 */
@Mapper
public interface MenuMapper extends BaseMapper<Menu> {
    
    /**
     * 根据用户ID查询可访问的菜单
     * 通过用户角色、角色权限、菜单权限关联查询
     * @param userId 用户ID
     * @return 菜单列表
     */
    @Select("SELECT DISTINCT m.* FROM sys_menu m " +
            "INNER JOIN sys_menu_permission mp ON m.id = mp.menu_id " +
            "INNER JOIN sys_role_permission rp ON mp.permission_id = rp.permission_id " +
            "INNER JOIN sys_user_role ur ON rp.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND m.status = 0 AND m.visible = 0 " +
            "ORDER BY m.sort_order ASC")
    List<Menu> selectMenusByUserId(@Param("userId") Long userId);
}
