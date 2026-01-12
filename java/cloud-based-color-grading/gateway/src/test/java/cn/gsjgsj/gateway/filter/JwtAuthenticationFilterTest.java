package cn.gsjgsj.gateway.filter;

import cn.gsjgsj.common.constant.SecurityConstants;
import cn.gsjgsj.common.service.RedisService;
import cn.gsjgsj.common.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * JWT认证过滤器单元测试
 * 测试需求：2.2, 2.3, 6.3, 6.4
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RedisService redisService;

    @Mock
    private GatewayFilterChain chain;

    private JwtAuthenticationFilter filter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String INVALID_TOKEN = "invalid.jwt.token";
    private static final String EXPIRED_TOKEN = "expired.jwt.token";
    private static final Long USER_ID = 1L;
    private static final String USERNAME = "testuser";
    private static final List<String> ROLES = Arrays.asList("ROLE_USER", "ROLE_ADMIN");

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtTokenProvider, redisService);
        
        // 设置白名单
        List<String> whitelist = Arrays.asList("/auth/login", "/auth/register", "/actuator/**");
        ReflectionTestUtils.setField(filter, "whitelist", whitelist);
    }
    
    private void setupChainMock() {
        // 设置chain的默认行为（仅在需要时调用）
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    @DisplayName("测试有效令牌通过认证")
    void testValidTokenPassesAuthentication() {
        setupChainMock();
        
        // 准备：设置有效令牌的mock行为
        when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(VALID_TOKEN)).thenReturn(USER_ID);
        when(jwtTokenProvider.getUsernameFromToken(VALID_TOKEN)).thenReturn(USERNAME);
        when(jwtTokenProvider.getRolesFromToken(VALID_TOKEN)).thenReturn(ROLES);
        when(redisService.getToken(USER_ID)).thenReturn(VALID_TOKEN);
        when(jwtTokenProvider.getRemainingValidity(VALID_TOKEN)).thenReturn(60 * 60 * 1000L); // 1小时

        // 创建带有有效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：JWT验证方法被调用
        verify(jwtTokenProvider).validateToken(VALID_TOKEN);
        verify(redisService).getToken(USER_ID);
        
        // 验证：响应状态不是401
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试无效令牌返回401")
    void testInvalidTokenReturns401() {
        // 准备：设置无效令牌的mock行为
        when(jwtTokenProvider.validateToken(INVALID_TOKEN)).thenReturn(false);

        // 创建带有无效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + INVALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试过期令牌返回401")
    void testExpiredTokenReturns401() {
        // 准备：设置过期令牌的mock行为
        when(jwtTokenProvider.validateToken(EXPIRED_TOKEN)).thenReturn(false);

        // 创建带有过期令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + EXPIRED_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试白名单路径跳过认证")
    void testWhitelistPathSkipsAuthentication() {
        setupChainMock();
        
        // 创建白名单路径的请求（没有Authorization头）
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/auth/login")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：JWT验证方法没有被调用
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(redisService, never()).getToken(anyLong());
        
        // 验证：响应状态不是401
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试缺少Authorization头返回401")
    void testMissingAuthorizationHeaderReturns401() {
        // 创建没有Authorization头的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试Authorization头格式错误返回401")
    void testInvalidAuthorizationHeaderFormatReturns401() {
        // 创建Authorization头格式错误的请求（缺少Bearer前缀）
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试Redis中令牌不存在返回401")
    void testTokenNotInRedisReturns401() {
        // 准备：令牌验证通过，但Redis中不存在
        when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(VALID_TOKEN)).thenReturn(USER_ID);
        when(redisService.getToken(USER_ID)).thenReturn(null);

        // 创建带有有效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试Redis中令牌不匹配返回401")
    void testTokenMismatchInRedisReturns401() {
        // 准备：令牌验证通过，但Redis中的令牌不匹配
        when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(VALID_TOKEN)).thenReturn(USER_ID);
        when(redisService.getToken(USER_ID)).thenReturn("different.token");

        // 创建带有有效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("测试令牌即将过期时自动刷新")
    void testTokenRefreshWhenExpiringSoon() {
        setupChainMock();
        
        // 准备：令牌剩余有效期少于30分钟
        String newToken = "new.refreshed.token";
        long remainingValidity = 20 * 60 * 1000L; // 20分钟
        
        when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(VALID_TOKEN)).thenReturn(USER_ID);
        when(jwtTokenProvider.getUsernameFromToken(VALID_TOKEN)).thenReturn(USERNAME);
        when(jwtTokenProvider.getRolesFromToken(VALID_TOKEN)).thenReturn(ROLES);
        when(redisService.getToken(USER_ID)).thenReturn(VALID_TOKEN);
        when(jwtTokenProvider.getRemainingValidity(VALID_TOKEN)).thenReturn(remainingValidity);
        when(jwtTokenProvider.generateToken(USER_ID, USERNAME, ROLES)).thenReturn(newToken);

        // 创建带有有效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：生成了新令牌
        verify(jwtTokenProvider).generateToken(USER_ID, USERNAME, ROLES);
        
        // 验证：新令牌被保存到Redis
        verify(redisService).saveToken(USER_ID, newToken);
        
        // 验证：新令牌被添加到响应头
        String responseToken = exchange.getResponse().getHeaders().getFirst(SecurityConstants.TOKEN_HEADER);
        assertThat(responseToken).isEqualTo(SecurityConstants.TOKEN_PREFIX + newToken);
    }

    @Test
    @DisplayName("测试用户信息被添加到请求头")
    void testUserInfoAddedToRequestHeaders() {
        setupChainMock();
        
        // 准备：设置有效令牌的mock行为
        when(jwtTokenProvider.validateToken(VALID_TOKEN)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(VALID_TOKEN)).thenReturn(USER_ID);
        when(jwtTokenProvider.getUsernameFromToken(VALID_TOKEN)).thenReturn(USERNAME);
        when(jwtTokenProvider.getRolesFromToken(VALID_TOKEN)).thenReturn(ROLES);
        when(redisService.getToken(USER_ID)).thenReturn(VALID_TOKEN);
        when(jwtTokenProvider.getRemainingValidity(VALID_TOKEN)).thenReturn(60 * 60 * 1000L);

        // 创建带有有效令牌的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/users")
                .header(SecurityConstants.TOKEN_HEADER, SecurityConstants.TOKEN_PREFIX + VALID_TOKEN)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链被调用，并且请求被修改
        verify(chain).filter(argThat(modifiedExchange -> {
            ServerHttpRequest modifiedRequest = modifiedExchange.getRequest();
            
            // 检查用户信息是否被添加到请求头
            String userId = modifiedRequest.getHeaders().getFirst(SecurityConstants.USER_ID_HEADER);
            String username = modifiedRequest.getHeaders().getFirst(SecurityConstants.USER_NAME_HEADER);
            String roles = modifiedRequest.getHeaders().getFirst(SecurityConstants.USER_ROLES_HEADER);
            
            return USER_ID.toString().equals(userId) &&
                   USERNAME.equals(username) &&
                   "ROLE_USER,ROLE_ADMIN".equals(roles);
        }));
    }

    @Test
    @DisplayName("测试通配符白名单路径跳过认证")
    void testWildcardWhitelistPathSkipsAuthentication() {
        setupChainMock();
        
        // 创建匹配通配符的白名单路径请求（没有Authorization头）
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/actuator/health")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：JWT验证方法没有被调用
        verify(jwtTokenProvider, never()).validateToken(anyString());
        
        // 验证：响应状态不是401
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
