package cn.gsjgsj.authzservice.mapper;

import cn.gsjgsj.common.entity.MenuPermission;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 菜单权限关联Mapper接口
 * 提供菜单权限关联的CRUD操作
 */
@Mapper
public interface MenuPermissionMapper extends BaseMapper<MenuPermission> {
}
