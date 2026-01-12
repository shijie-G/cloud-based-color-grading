package cn.gsjgsj.authzservice.mapper;

import cn.gsjgsj.common.entity.Role;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 角色Mapper接口
 * 提供角色的CRUD操作
 */
@Mapper
public interface RoleMapper extends BaseMapper<Role> {
}
