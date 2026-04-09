#!/bin/bash

# 读书笔记应用启动脚本

echo "📚 读书笔记应用启动中..."

# 启动后端
echo "🚀 启动后端服务 (端口 3001)..."
cd "$(dirname "$0")/server"
node src/index.js &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口 5173)..."
cd "$(dirname "$0")/client"
npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ 服务已启动！"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
