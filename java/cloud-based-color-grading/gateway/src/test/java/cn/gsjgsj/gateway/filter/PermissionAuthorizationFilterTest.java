package cn.gsjgsj.gateway.filter;

import cn.gsjgsj.common.constant.SecurityConstants;
import cn.gsjgsj.gateway.client.PermissionClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * 权限授权过滤器单元测试
 * 测试需求：4.4
 */
@ExtendWith(MockitoExtension.class)
class PermissionAuthorizationFilterTest {

    @Mock
    private PermissionClient permissionClient;

    @Mock
    private GatewayFilterChain chain;

    private PermissionAuthorizationFilter filter;

    private static final Long USER_ID = 1L;
    private static final String RESOURCE_PATH = "/api/users";
    private static final String HTTP_METHOD = "GET";

    @BeforeEach
    void setUp() {
        filter = new PermissionAuthorizationFilter(permissionClient);
        
        // 设置白名单
        List<String> whitelist = Arrays.asList("/auth/login", "/auth/register", "/actuator/**");
        ReflectionTestUtils.setField(filter, "whitelist", whitelist);
    }
    
    private void setupChainMock() {
        when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    @DisplayName("测试有权限的请求通过")
    void testRequestWithPermissionPasses() {
        setupChainMock();
        
        // 准备：用户有权限
        when(permissionClient.hasPermission(USER_ID, RESOURCE_PATH, HTTP_METHOD))
                .thenReturn(Mono.just(true));

        // 创建带有用户ID的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get(RESOURCE_PATH)
                .header(SecurityConstants.USER_ID_HEADER, USER_ID.toString())
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查被调用
        verify(permissionClient).hasPermission(USER_ID, RESOURCE_PATH, HTTP_METHOD);
        
        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态不是403
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试无权限的请求返回403")
    void testRequestWithoutPermissionReturns403() {
        // 准备：用户没有权限
        when(permissionClient.hasPermission(USER_ID, RESOURCE_PATH, HTTP_METHOD))
                .thenReturn(Mono.just(false));

        // 创建带有用户ID的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get(RESOURCE_PATH)
                .header(SecurityConstants.USER_ID_HEADER, USER_ID.toString())
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查被调用
        verify(permissionClient).hasPermission(USER_ID, RESOURCE_PATH, HTTP_METHOD);
        
        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是403
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试缺少用户ID头返回403")
    void testMissingUserIdHeaderReturns403() {
        // 创建没有用户ID头的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get(RESOURCE_PATH)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查没有被调用
        verify(permissionClient, never()).hasPermission(anyLong(), anyString(), anyString());
        
        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是403
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试无效的用户ID格式返回403")
    void testInvalidUserIdFormatReturns403() {
        // 创建带有无效用户ID格式的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get(RESOURCE_PATH)
                .header(SecurityConstants.USER_ID_HEADER, "invalid")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查没有被调用
        verify(permissionClient, never()).hasPermission(anyLong(), anyString(), anyString());
        
        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是403
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试白名单路径跳过权限检查")
    void testWhitelistPathSkipsAuthorization() {
        setupChainMock();
        
        // 创建白名单路径的请求（没有用户ID头）
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/auth/login")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查没有被调用
        verify(permissionClient, never()).hasPermission(anyLong(), anyString(), anyString());
        
        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态不是403
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试通配符白名单路径跳过权限检查")
    void testWildcardWhitelistPathSkipsAuthorization() {
        setupChainMock();
        
        // 创建匹配通配符的白名单路径请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/actuator/health")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：权限检查没有被调用
        verify(permissionClient, never()).hasPermission(anyLong(), anyString(), anyString());
        
        // 验证：过滤器链被调用
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态不是403
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试不同HTTP方法的权限检查")
    void testPermissionCheckForDifferentHttpMethods() {
        setupChainMock();
        
        // 测试POST请求
        when(permissionClient.hasPermission(USER_ID, RESOURCE_PATH, "POST"))
                .thenReturn(Mono.just(true));

        MockServerHttpRequest postRequest = MockServerHttpRequest
                .post(RESOURCE_PATH)
                .header(SecurityConstants.USER_ID_HEADER, USER_ID.toString())
                .build();
        MockServerWebExchange postExchange = MockServerWebExchange.from(postRequest);

        filter.filter(postExchange, chain).block();

        // 验证：POST方法的权限检查被调用
        verify(permissionClient).hasPermission(USER_ID, RESOURCE_PATH, "POST");
        verify(chain, times(1)).filter(any(ServerWebExchange.class));
    }

    @Test
    @DisplayName("测试权限服务调用失败时返回403")
    void testPermissionServiceFailureReturns403() {
        // 准备：权限服务调用失败（返回false）
        when(permissionClient.hasPermission(USER_ID, RESOURCE_PATH, HTTP_METHOD))
                .thenReturn(Mono.just(false));

        // 创建带有用户ID的请求
        MockServerHttpRequest request = MockServerHttpRequest
                .get(RESOURCE_PATH)
                .header(SecurityConstants.USER_ID_HEADER, USER_ID.toString())
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // 执行过滤器
        filter.filter(exchange, chain).block();

        // 验证：过滤器链没有被调用
        verify(chain, never()).filter(any(ServerWebExchange.class));
        
        // 验证：响应状态是403
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("测试过滤器执行顺序")
    void testFilterOrder() {
        // 验证：权限过滤器的顺序是-90（在认证过滤器-100之后）
        assertThat(filter.getOrder()).isEqualTo(-90);
    }
}
