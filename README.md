# 📚 读书笔记应用

一款专注于文本标注和笔记整理的 Web 阅读工具，帮助用户对导入的文档进行高效标注和笔记管理。

## ✨ 功能特性

- **用户登录** - 支持手机号、邮箱登录，密码固定为 123456
- **文档管理** - 导入 .txt 文档，文档列表管理，支持删除、编辑
- **文档标注** - 选中文本弹出浮动标注框，集成 Quill 富文本编辑器
- **笔记整理** - 右侧边栏展示所有标注笔记

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 样式 | Tailwind CSS |
| 富文本编辑器 | Quill |
| 后端框架 | Express.js |
| 数据库 | SQLite (sql.js) |
| 认证 | JWT Token |
| 路由 | React Router v6 |

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 2. 启动服务

**Windows 用户**：双击运行 `start.bat`

**Mac/Linux 用户**：
```bash
chmod +x start.sh
./start.sh
```

或者手动启动：

```bash
# 终端1: 启动后端
cd server
node src/index.js

# 终端2: 启动前端
cd client
npm run dev
```

### 3. 访问应用

打开浏览器访问: **http://localhost:5173**

### 4. 测试账号

- 手机号: `13800138000`
- 邮箱: `test@example.com`
- 密码: `123456`

## 📁 项目结构

```
reading-notes-app/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/       # API 服务层
│   │   ├── context/        # React Context
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── types/          # TypeScript 类型定义
│   └── tailwind.config.js
├── server/                 # Node.js 后端
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件
│   │   ├── db/            # 数据库
│   │   └── index.js       # 入口文件
│   └── package.json
└── start.bat               # Windows 启动脚本
```

## 🔌 API 接口

### 认证

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 文档

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/documents | 获取文档列表 |
| GET | /api/documents/:id | 获取单个文档 |
| POST | /api/documents | 导入文档 |
| PUT | /api/documents/:id | 更新文档 |
| DELETE | /api/documents/:id | 删除文档 |

### 标注

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/annotations/document/:docId | 获取文档所有标注 |
| POST | /api/annotations | 创建标注 |
| PUT | /api/annotations/:id | 更新标注 |
| DELETE | /api/annotations/:id | 删除标注 |

## 🎨 界面预览

### 登录页
- 简洁现代的居中卡片式设计
- 支持手机号/邮箱输入
- 密码显示/隐藏切换

### 文档列表页
- 卡片式网格布局
- 文档概要、导入时间展示
- 悬浮操作按钮（编辑、删除）

### 文档阅读页
- 左侧文档内容区（可滚动）
- 右侧标注列表（可折叠）
- 选中文字弹出标注浮动框

## 📝 待完成功能

- [ ] PDF 文档导入支持
- [ ] 笔记整理功能
- [ ] 设置功能
- [ ] 多端数据同步

## 📄 License

MIT
