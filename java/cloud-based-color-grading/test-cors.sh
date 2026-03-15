#!/bin/bash

echo "=== CORS配置测试脚本 ==="
echo ""

# 检查网关是否运行
echo "1. 检查网关服务状态..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ 网关服务正在运行"
else
    echo "❌ 网关服务未运行，请先启动网关服务"
    echo "启动命令: cd gateway && mvn spring-boot:run"
    exit 1
fi

echo ""
echo "2. 测试CORS预检请求..."

# 测试OPTIONS请求
echo "测试 /auth/login 的OPTIONS请求:"
response=$(curl -s -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:8080/auth/login)

echo "$response"

if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS预检请求成功"
else
    echo "❌ CORS预检请求失败"
fi

echo ""
echo "3. 测试实际POST请求..."

# 测试实际的POST请求
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  http://localhost:8080/auth/login)

echo "$response"

if echo "$response" | grep -q "HTTP_CODE:401\|HTTP_CODE:200"; then
    echo "✅ 实际请求可以到达后端（返回401是正常的，因为凭证可能无效）"
else
    echo "❌ 实际请求被阻止"
fi

echo ""
echo "=== 测试完成 ==="