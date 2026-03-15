package cn.gsjgsj.gateway.filter;

import cn.gsjgsj.common.constant.SecurityConstants;
import cn.gsjgsj.gateway.client.PermissionClient;
import cn.gsjgsj.gateway.security.SecurityAuditLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * 权限授权过滤器
 * 负责检查用户是否有权限访问请求的资源
 * 在JWT认证过滤器之后执行
 */
@Component
public class PermissionAuthorizationFilter implements GlobalFilter, Ordered {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionAuthorizationFilter.class);
    
    private final PermissionClient permissionClient;
    private final SecurityAuditLogger securityAuditLogger;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    
    @Value("${gateway.whitelist}")
    private List<String> whitelist;
    
    public PermissionAuthorizationFilter(PermissionClient permissionClient,
                                        SecurityAuditLogger securityAuditLogger) {
        this.permissionClient = permissionClient;
        this.securityAuditLogger = securityAuditLogger;
    }
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String method = request.getMethod().name();
        String ipAddress = getClientIp(request);
        
        // 1. 对于OPTIONS请求（CORS预检），直接放行
        if ("OPTIONS".equals(method)) {
            logger.debug("OPTIONS request for path {}, skipping authorization for CORS preflight", path);
            return chain.filter(exchange);
        }
        
        // 2. 检查是否在白名单中（白名单路径已经在认证过滤器中处理，这里再次检查以确保安全）
        if (isWhitelisted(path)) {
            logger.debug("Path {} is whitelisted, skipping authorization", path);
            return chain.filter(exchange);
        }
        
        // 2. 从请求头提取用户ID和用户名（由认证过滤器添加）
        String userIdHeader = request.getHeaders().getFirst(SecurityConstants.USER_ID_HEADER);
        String username = request.getHeaders().getFirst(SecurityConstants.USER_NAME_HEADER);
        
        if (userIdHeader == null) {
            logger.warn("Missing user ID header for path: {}", path);
            securityAuditLogger.logAuthorizationFailure(null, "unknown", path, method, ipAddress);
            return forbidden(exchange.getResponse());
        }
        
        Long userId;
        try {
            userId = Long.parseLong(userIdHeader);
        } catch (NumberFormatException e) {
            logger.error("Invalid user ID format: {}", userIdHeader);
            securityAuditLogger.logSecurityException("Invalid user ID format", userIdHeader, ipAddress);
            return forbidden(exchange.getResponse());
        }
        
        // 3. 调用权限服务检查权限
        return permissionClient.hasPermission(userId, path, method)
                .flatMap(hasPermission -> {
                    if (hasPermission) {
                        logger.debug("User {} has permission to access {} {}", userId, method, path);
                        securityAuditLogger.logAuthorizationSuccess(userId, username, path, method, ipAddress);
                        return chain.filter(exchange);
                    } else {
                        logger.warn("User {} does not have permission to access {} {}", userId, method, path);
                        securityAuditLogger.logAuthorizationFailure(userId, username, path, method, ipAddress);
                        return forbidden(exchange.getResponse());
                    }
                });
    }
    
    /**
     * 检查路径是否在白名单中
     */
    private boolean isWhitelisted(String path) {
        if (whitelist == null) {
            return false;
        }
        return whitelist.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIp(ServerHttpRequest request) {
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeaders().getFirst("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddress() != null ? 
                  request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
        }
        return ip;
    }
    
    /**
     * 返回403禁止访问响应
     */
    private Mono<Void> forbidden(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.FORBIDDEN);
        return response.setComplete();
    }
    
    @Override
    public int getOrder() {
        return -90; // 在认证过滤器（-100）之后执行
    }
}
