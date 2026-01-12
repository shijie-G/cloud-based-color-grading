package cn.gsjgsj.gateway.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * 权限服务客户端
 * 用于网关调用授权服务检查权限
 */
@Component
public class PermissionClient {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionClient.class);
    
    private final WebClient webClient;
    
    @Value("${authz-service.url:http://localhost:8082}")
    private String authzServiceUrl;
    
    public PermissionClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }
    
    /**
     * 检查用户是否有权限访问资源
     * @param userId 用户ID
     * @param resourcePath 资源路径
     * @param method HTTP方法
     * @return 是否有权限
     */
    public Mono<Boolean> hasPermission(Long userId, String resourcePath, String method) {
        String url = String.format("%s/api/permissions/check?userId=%d&resourcePath=%s&method=%s",
                authzServiceUrl, userId, resourcePath, method);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(Boolean.class)
                .doOnError(error -> logger.error("Failed to check permission for userId: {}, path: {}, method: {}", 
                        userId, resourcePath, method, error))
                .onErrorReturn(false); // 如果调用失败，默认返回无权限
    }
}
