package cn.gsjgsj.authservice.mapper;

import cn.gsjgsj.common.entity.User;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户Mapper接口
 * 提供用户数据访问功能
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
