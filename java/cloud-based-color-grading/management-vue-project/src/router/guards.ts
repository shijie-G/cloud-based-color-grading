import type { Router } from 'vue-router';
import { useUserStore } from '../stores/userStore';

/**
 * 设置路由守卫
 * 
 * 功能：
 * 1. 未登录访问受保护路由时重定向到登录页
 * 2. 已登录访问登录页时重定向到首页
 * 3. 保存原始目标路由到 query.redirect
 * 4. 登录成功后导航到原始路由或默认首页
 * 
 * 需求: 6.1, 6.2, 6.3, 6.4
 * 
 * @param router - Vue Router 实例
 */
export function setupRouterGuards(router: Router): void {
  router.beforeEach((to, from, next) => {
    console.log('=== 路由守卫触发 ===');
    console.log('从:', from.path, '到:', to.path);
    console.log('目标路由 query:', to.query);
    
    const userStore = useUserStore();
    const isLoggedIn = userStore.isLoggedIn;
    const requiresAuth = to.meta.requiresAuth;
    
    console.log('登录状态:', isLoggedIn);
    console.log('需要认证:', requiresAuth);
    console.log('当前 token:', userStore.token ? '存在' : '不存在');
    console.log('用户信息:', {
      userId: userStore.userId,
      username: userStore.username
    });

    // 需求 6.2: 已登录用户访问登录页时，重定向到工作台
    if (to.path === '/login' && isLoggedIn) {
      console.log('✅ 已登录用户访问登录页，重定向到工作台');
      next('/workstation');
      return;
    }

    // 需求 6.1: 未登录用户访问受保护路由时，重定向到登录页
    // 需求 6.3: 保存原始目标路由到 query.redirect
    if (requiresAuth && !isLoggedIn) {
      console.log('❌ 未登录用户访问受保护路由，重定向到登录页');
      console.log('保存重定向路径:', to.fullPath);
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
      return;
    }

    // 允许访问
    console.log('✅ 允许访问路由:', to.path);
    console.log('=== 路由守卫结束 ===');
    next();
  });
}
