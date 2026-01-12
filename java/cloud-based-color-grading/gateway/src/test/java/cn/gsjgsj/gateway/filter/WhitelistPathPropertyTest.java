package cn.gsjgsj.gateway.filter;

import cn.gsjgsj.common.service.RedisService;
import cn.gsjgsj.common.util.JwtTokenProvider;
import net.jqwik.api.*;
import net.jqwik.api.lifecycle.BeforeProperty;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * 白名单路径属性测试
 * Feature: user-authentication-authorization, Property 8: 白名单路径跳过认证
 * 验证需求：6.3
 */
class WhitelistPathPropertyTest {

    private JwtTokenProvider jwtTokenProvider;
    private RedisService redisService;
    private JwtAuthenticationFilter filter;
    private GatewayFilterChain chain;

    @BeforeProperty
    void setup() {
        jwtTokenProvider = mock(JwtTokenProvider.class);
        redisService = mock(RedisService.class);
        filter = new JwtAuthenticationFilter(jwtTokenProvider, redisService);
        
        // 设置白名单
        List<String> whitelist = Arrays.asList("/auth/login", "/auth/register", "/actuator/**");
        ReflectionTestUtils.setField(filter, "whitelist", whitelist);
        
        // 创建mock的过滤器链
        chain = mock(GatewayFilterChain.class);
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    /**
     * 属性 8：白名单路径跳过认证
     * 对于任何在白名单中的请求路径，认证过滤器应该直接放行，不进行令牌验证
     */
    @Property(tries = 100)
    @Label("白名单路径跳过认证 - 精确匹配路径")
    void whitelistedExactPathsShouldSkipAuthentication(@ForAll("exactWhitelistPaths") String path) {
        // 重置mocks
        reset(jwtTokenProvider, redisService, chain);
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
        
        // 创建没有Authorization头的请求
        MockServerHttpRequest request = MockServerHttpRequest.get(path).build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        
        // 执行过滤器
        filter.filter(exchange, chain).block();
        
        // 验证：过滤器链被调用（说明请求被放行）
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：JWT验证方法没有被调用
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(redisService, never()).getToken(anyLong());
        
        // 验证：响应状态不是401（未授权）
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Property(tries = 100)
    @Label("白名单路径跳过认证 - 通配符匹配路径")
    void whitelistedWildcardPathsShouldSkipAuthentication(@ForAll("wildcardWhitelistPaths") String path) {
        // 重置mocks
        reset(jwtTokenProvider, redisService, chain);
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
        
        // 创建没有Authorization头的请求
        MockServerHttpRequest request = MockServerHttpRequest.get(path).build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        
        // 执行过滤器
        filter.filter(exchange, chain).block();
        
        // 验证：过滤器链被调用（说明请求被放行）
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：JWT验证方法没有被调用
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(redisService, never()).getToken(anyLong());
        
        // 验证：响应状态不是401（未授权）
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Property(tries = 100)
    @Label("白名单路径跳过认证 - 非白名单路径需要认证")
    void nonWhitelistedPathsShouldRequireAuthentication(@ForAll("nonWhitelistPaths") String path) {
        // 重置mocks
        reset(jwtTokenProvider, redisService, chain);
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
        
        // 创建没有Authorization头的请求
        MockServerHttpRequest request = MockServerHttpRequest.get(path).build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        
        // 执行过滤器
        filter.filter(exchange, chain).block();
        
        // 验证：过滤器链没有被调用（请求被拦截）
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是401（未授权）
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * 生成精确匹配的白名单路径
     */
    @Provide
    Arbitrary<String> exactWhitelistPaths() {
        return Arbitraries.of("/auth/login", "/auth/register");
    }

    /**
     * 生成通配符匹配的白名单路径
     */
    @Provide
    Arbitrary<String> wildcardWhitelistPaths() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(1)
                .ofMaxLength(20)
                .map(suffix -> "/actuator/" + suffix);
    }

    /**
     * 生成非白名单路径
     */
    @Provide
    Arbitrary<String> nonWhitelistPaths() {
        return Arbitraries.of(
                "/api/users",
                "/api/roles",
                "/api/permissions",
                "/api/menus",
                "/business/data",
                "/admin/settings"
        );
    }
}
