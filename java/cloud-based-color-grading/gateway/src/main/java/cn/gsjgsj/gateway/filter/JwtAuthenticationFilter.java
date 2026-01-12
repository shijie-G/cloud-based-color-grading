package cn.gsjgsj.gateway.filter;

import cn.gsjgsj.common.constant.SecurityConstants;
import cn.gsjgsj.common.service.RedisService;
import cn.gsjgsj.common.util.JwtTokenProvider;
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
 * JWT认证过滤器
 * 负责验证JWT令牌、检查令牌有效性、刷新令牌、添加用户信息到请求头
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisService redisService;
    private final SecurityAuditLogger securityAuditLogger;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${gateway.whitelist}")
    private List<String> whitelist;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, 
                                  RedisService redisService,
                                  SecurityAuditLogger securityAuditLogger) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.redisService = redisService;
        this.securityAuditLogger = securityAuditLogger;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String ipAddress = getClientIp(request);

        // 1. 检查是否在白名单中
        if (isWhitelisted(path)) {
            logger.debug("Path {} is whitelisted, skipping authentication", path);
            securityAuditLogger.logWhitelistAccess(path, ipAddress);
            return chain.filter(exchange);
        }

        // 2. 提取Authorization头
        String authHeader = request.getHeaders().getFirst(SecurityConstants.TOKEN_HEADER);
        if (authHeader == null || !authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            logger.warn("Missing or invalid Authorization header for path: {}", path);
            securityAuditLogger.logAuthenticationFailure("Missing or invalid Authorization header", path, ipAddress);
            return unauthorized(exchange.getResponse());
        }

        // 3. 提取JWT令牌
        String token = authHeader.substring(SecurityConstants.TOKEN_PREFIX.length());

        // 4. 验证JWT令牌格式和签名
        if (!jwtTokenProvider.validateToken(token)) {
            logger.warn("Invalid or expired JWT token for path: {}", path);
            securityAuditLogger.logInvalidToken(token, path, ipAddress);
            return unauthorized(exchange.getResponse());
        }

        // 5. 从令牌中提取用户信息
        Long userId;
        String username;
        List<String> roles;
        try {
            userId = jwtTokenProvider.getUserIdFromToken(token);
            username = jwtTokenProvider.getUsernameFromToken(token);
            roles = jwtTokenProvider.getRolesFromToken(token);
        } catch (Exception e) {
            logger.error("Failed to extract user info from token", e);
            securityAuditLogger.logSecurityException("Token parsing failed", e.getMessage(), ipAddress);
            return unauthorized(exchange.getResponse());
        }

        // 6. 从Redis验证令牌是否存在
        String storedToken = redisService.getToken(userId);
        if (storedToken == null || !storedToken.equals(token)) {
            logger.warn("Token not found in Redis or mismatch for userId: {}", userId);
            securityAuditLogger.logAuthenticationFailure("Token not found or mismatch", path, ipAddress);
            return unauthorized(exchange.getResponse());
        }

        // 7. 检查令牌是否需要刷新（剩余时间<30分钟）
        long remainingValidity = jwtTokenProvider.getRemainingValidity(token);
        long refreshThreshold = SecurityConstants.TOKEN_REFRESH_THRESHOLD_MINUTES * 60 * 1000L;
        
        if (remainingValidity > 0 && remainingValidity < refreshThreshold) {
            // 生成新令牌
            String newToken = jwtTokenProvider.generateToken(userId, username, roles);
            // 更新Redis中的令牌
            redisService.saveToken(userId, newToken);
            // 在响应头中返回新令牌
            exchange.getResponse().getHeaders().add(SecurityConstants.TOKEN_HEADER, 
                SecurityConstants.TOKEN_PREFIX + newToken);
            logger.info("Token refreshed for userId: {}", userId);
            securityAuditLogger.logTokenAutoRefresh(userId, username, ipAddress);
        }

        // 8. 记录认证成功
        securityAuditLogger.logAuthenticationSuccess(userId, username, path, ipAddress);

        // 9. 将用户信息添加到请求头
        ServerHttpRequest modifiedRequest = request.mutate()
                .header(SecurityConstants.USER_ID_HEADER, userId.toString())
                .header(SecurityConstants.USER_NAME_HEADER, username)
                .header(SecurityConstants.USER_ROLES_HEADER, String.join(",", roles))
                .build();

        // 10. 继续过滤器链
        return chain.filter(exchange.mutate().request(modifiedRequest).build());
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
     * 返回401未授权响应
     */
    private Mono<Void> unauthorized(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return response.setComplete();
    }

    @Override
    public int getOrder() {
        return -100; // 优先级高，先执行
    }
}
