@echo off
chcp 65001 >nul
echo ========================================
echo         读书笔记应用启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动后端服务 (端口 3001)...
start "ReadingNotes-Server" cmd /k "cd server && node src/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] 启动前端开发服务器 (端口 5173)...
start "ReadingNotes-Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo  ✅ 服务已启动！
echo     前端: http://localhost:5173
echo     后端: http://localhost:3001
echo ========================================
echo.
echo 请访问 http://localhost:5173 开始使用
echo.
echo 测试账号: 13800138000 或 test@example.com
echo 测试密码: 123456
echo.
pause
