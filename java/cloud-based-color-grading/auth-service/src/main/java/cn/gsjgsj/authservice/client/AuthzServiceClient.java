package cn.gsjgsj.authservice.client;

import cn.gsjgsj.common.dto.Result;
import cn.gsjgsj.common.entity.Permission;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Authz Service 客户端
 * 用于调用授权服务的接口
 */
@Component
public class AuthzServiceClient {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthzServiceClient.class);
    
    private final RestTemplate restTemplate;
    private final String authzServiceUrl;
    
    public AuthzServiceClient(RestTemplate restTemplate,
                             @Value("${authz-service.url}") String authzServiceUrl) {
        this.restTemplate = restTemplate;
        this.authzServiceUrl = authzServiceUrl;
    }
    
    /**
     * 获取用户权限列表
     * @param userId 用户ID
     * @return 权限标识列表（如：system:user:query）
     */
    public List<String> getUserPermissions(Long userId) {
        try {
            String url = authzServiceUrl + "/permissions/user/" + userId;
            logger.info("Calling authz-service to get user permissions: {}", url);
            
            // 调用 Authz Service 获取权限
            ResponseEntity<Result> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Result>() {}
            );
            
            Result result = response.getBody();
            if (result != null && result.getCode() == 200 && result.getData() != null) {
                // 将 data 转换为 Permission 列表
                ObjectMapper mapper = new ObjectMapper();
                List<Permission> permissions = mapper.convertValue(
                    result.getData(),
                    new TypeReference<List<Permission>>() {}
                );
                
                // 提取权限标识
                return permissions.stream()
                    .map(Permission::getPermissionKey)
                    .collect(Collectors.toList());
            }
            
            logger.warn("Failed to get user permissions, result: {}", result);
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error calling authz-service to get user permissions for userId: {}", userId, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 获取用户菜单树
     * @param userId 用户ID
     * @return 菜单树（JSON格式）
     */1
    public Object getUserMenuTree(Long userId) {
        try {
            String url = authzServiceUrl + "/menus/user/" + userId + "/tree";
            logger.info("Calling authz-service to get user menu tree: {}", url);
            
            ResponseEntity<Result> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Result>() {}
            );
            
            Result result = response.getBody();
            if (result != null && result.getCode() == 200) {
                return result.getData();
            }
            
            logger.warn("Failed to get user menu tree, result: {}", result);
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error calling authz-service to get user menu tree for userId: {}", userId, e);
            return new ArrayList<>();
        }
    }
}
