package cn.gsjgsj.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 允许的源（开发环境）
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://127.0.0.1:3000");
        config.addAllowedOrigin("http://127.0.0.1:5173");
        
        // 添加更多可能的本地开发源
        config.addAllowedOrigin("http://0.0.0.0:3000");
        config.addAllowedOrigin("http://0.0.0.0:5173");

        // 生产环境需要修改为实际的前端域名
        // config.addAllowedOrigin("https://your-production-domain.com");

        // 允许的HTTP方法
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        // 允许的请求头
        config.addAllowedHeader("*");

        // 允许携带认证信息（如Cookie、Authorization header）
        config.setAllowCredentials(true);

        // 预检请求的有效期（秒）
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        CorsWebFilter corsFilter = new CorsWebFilter(source);
        // 设置最高优先级，确保CORS过滤器最先执行
        corsFilter.setOrder(-200);
        return corsFilter;
    }
}
