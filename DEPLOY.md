# 部署指南 (Railway + Vercel)

本指南将帮助你把读书笔记应用部署到 Railway（后端）和 Vercel（前端）。

---

## 第一步：推送代码到 GitHub

### 1.1 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 **+** → **New repository**
3. 填写仓库名称：`reading-notes-app`
4. 选择 **Private**（私有）或 **Public**（公开）
5. 点击 **Create repository**

### 1.2 初始化本地 Git 并推送

在项目目录打开终端，执行：

```bash
cd reading-notes-app

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Reading Notes App"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/reading-notes-app.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 第二步：部署后端到 Railway

### 2.1 创建 Railway 项目

1. 访问 [Railway](https://railway.app) 并登录（可用 GitHub 账号）
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的 `reading-notes-app` 仓库
4. Railway 会自动检测到 **server** 目录（通过 railway.json）

### 2.2 配置环境变量

在 Railway 项目设置中，添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `3001` | 后端端口 |
| `JWT_SECRET` | `reading-notes-secret-key-2024` | JWT 密钥（可自定义） |

### 2.3 等待部署完成

Railway 会自动：
- 安装依赖 (`npm install`)
- 构建并启动服务
- 分配一个 URL，格式如：`https://reading-notes-api.up.railway.app`

**记录下这个 URL，后面会用到。**

### 2.4 验证后端部署

访问 `https://你的后端URL.up.railway.app/api/health`，应该返回：
```json
{"status":"ok","message":"Reading Notes API is running"}
```

---

## 第三步：部署前端到 Vercel

### 3.1 创建 Vercel 项目

1. 访问 [Vercel](https://vercel.com) 并登录（可用 GitHub 账号）
2. 点击 **Add New...** → **Project**
3. 导入你的 `reading-notes-app` 仓库
4. 在 **Root Directory** 输入框中填写：`client`

### 3.2 配置环境变量

点击 **Environment Variables**，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://你的后端URL.up.railway.app` |

> ⚠️ 将 `https://你的后端URL.up.railway.app` 替换为第二步中 Railway 分配的真实 URL

### 3.3 部署

1. 点击 **Deploy**
2. Vercel 会自动：
   - 安装依赖
   - 构建生产版本 (`npm run build`)
   - 部署到 CDN

### 3.4 获取访问 URL

部署完成后，Vercel 会分配一个 URL，格式如：
`https://reading-notes-app.vercel.app`

---

## 第四步：测试完整功能

现在访问你的 Vercel URL，使用测试账号登录：

| 项目 | 值 |
|------|-----|
| 手机号 | `13800138000` |
| 邮箱 | `test@example.com` |
| 密码 | `123456` |

---

## 常见问题

### Q1: 前端无法连接到后端？
- 检查 Vercel 的 `VITE_API_BASE_URL` 环境变量是否正确设置
- 确保后端 URL 以 `https://` 开头，不带尾部斜杠

### Q2: Railway 部署失败？
- 检查 `server/package.json` 的 `engines` 字段
- 查看 Railway 部署日志定位问题

### Q3: 数据库数据丢失？
- 当前使用 SQLite，Railway 免费计划重启后会清空数据
- 如需持久化，可升级到付费计划或迁移到云数据库（如 Turso）

### Q4: 如何自定义域名？
- **Railway**: Project Settings → Domains
- **Vercel**: Project Settings → Domains

---

## 更新部署

每次推送到 GitHub 主分支，Railway 和 Vercel 都会自动重新部署。

```bash
# 修改代码后
git add .
git commit -m "Update: 你的修改内容"
git push
```

---

## 架构图

```
用户浏览器
    │
    ├──► Vercel (前端静态资源 + API 代理)
    │         │
    │         └──► Railway (后端 API)
    │                   │
    │                   └──► SQLite (数据存储)
```

---

**祝你部署顺利！** 🚀
