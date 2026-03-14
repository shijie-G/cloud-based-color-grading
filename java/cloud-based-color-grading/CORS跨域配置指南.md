# CORS跨域配置指南

## 问题描述

前端访问后端API时出现CORS（跨域资源共享）错误，这是因为：
- 前端运行在 `http://localhost:3000` (Vite开发服务器)
- 后端运行在 `http://localhost:8080` (网关)
- 浏览器的同源策略阻止了跨域请求

## 解决方案

有两种解决方案可以选择：

### 方案一：后端配置CORS（推荐用于生产环境）

在后端Spring Boot服务中配置CORS，允许前端域名访问。

#### 1. 在网关服务中配置全局CORS

创建或修改网关的CORS配置类：

**文件路径**: `gateway-service/src/main/java/cn/gsjgsj/gateway/config/CorsConfig.java`

```java
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
        
        return new CorsWebFilter(source);
    }
}
```

#### 2. 在各个微服务中配置CORS（备选方案）

如果网关没有配置CORS，需要在每个微服务中配置：

**Auth Service**: `auth-service/src/main/java/cn/gsjgsj/authservice/config/CorsConfig.java`
**Authz Service**: `authz-service/src/main/java/cn/gsjgsj/authzservice/config/CorsConfig.java`

```java
package cn.gsjgsj.authservice.config; // 或 authzservice.config

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // 允许的源
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://127.0.0.1:5173");
        
        // 允许的HTTP方法
        config.addAllowedMethod("*");
        
        // 允许的请求头
        config.addAllowedHeader("*");
        
        // 允许携带认证信息
        config.setAllowCredentials(true);
        
        // 预检请求的有效期
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
```

#### 3. 使用注解方式（针对特定Controller）

如果只需要在特定Controller上启用CORS：

```java
@RestController
@RequestMapping("/api/roles")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:3000"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE},
    allowCredentials = "true",
    maxAge = 3600
)
public class RoleController {
    // Controller methods
}
```

---

### 方案二：前端配置代理（推荐用于开发环境）

在Vite开发服务器中配置代理，将API请求转发到后端。

**文件路径**: `management-vue-project/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 代理所有 /api 开头的请求
      '/api': {
        target: 'http://localhost:8080',  // 后端网关地址
        changeOrigin: true,                // 改变请求源
        secure: false,                     // 如果是https接口，需要配置这个参数
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果需要重写路径
      }
    }
  }
})
```

配置代理后，前端请求会自动转发：
- 前端请求: `http://localhost:3000/api/roles`
- 实际请求: `http://localhost:8080/api/roles`

**注意**: 使用代理方案时，需要修改 `src/utils/request.ts` 中的 baseURL：

```typescript
const service: AxiosInstance = axios.create({
  baseURL: '/api',  // 改为相对路径，让Vite代理处理
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

---

## 推荐配置方案

### 开发环境
使用 **方案二（Vite代理）**，优点：
- 配置简单，只需修改前端配置
- 不需要修改后端代码
- 开发体验更好

### 生产环境
使用 **方案一（后端CORS配置）**，优点：
- 前后端完全分离部署
- 支持多个前端域名
- 更符合生产环境的架构

### 最佳实践
同时配置两种方案：
1. 后端配置CORS（用于生产环境）
2. 前端配置代理（用于开发环境）
3. 使用环境变量控制baseURL：
   ```typescript
   baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
   ```

---

## 配置步骤

### 快速解决（开发环境）

1. 修改 `management-vue-project/vite.config.ts`，添加proxy配置
2. 修改 `management-vue-project/src/utils/request.ts`，将baseURL改为 `'/api'`
3. 重启Vite开发服务器: `npm run dev`

### 完整解决（生产环境）

1. 在网关或各微服务中添加CORS配置类
2. 重新编译并启动后端服务
3. 前端保持使用完整URL: `http://localhost:8080`

---

## 验证配置

配置完成后，打开浏览器开发者工具（F12），查看Network标签：

1. **成功的请求**应该显示：
   - Status: 200 OK
   - Response Headers中包含CORS相关头：
     ```
     Access-Control-Allow-Origin: http://localhost:5173
     Access-Control-Allow-Credentials: true
     ```

2. **OPTIONS预检请求**（针对POST/PUT/DELETE）应该返回：
   - Status: 200 OK
   - 包含允许的方法和头信息

---

## 常见问题

### 1. 配置了CORS但仍然报错
- 检查是否重启了后端服务
- 检查CORS配置中的allowedOrigins是否包含前端地址
- 检查是否有多个CORS配置冲突

### 2. OPTIONS请求失败
- 确保后端允许OPTIONS方法
- 检查Spring Security配置是否拦截了OPTIONS请求

### 3. 携带Cookie或Token失败
- 确保设置了 `allowCredentials = true`
- 前端axios配置中设置 `withCredentials: true`

### 4. 生产环境CORS错误
- 更新allowedOrigins为生产环境的实际域名
- 不要使用通配符 `*` 配合 `allowCredentials = true`
