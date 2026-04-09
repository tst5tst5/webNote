const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/database');

// 导入路由
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const annotationRoutes = require('./routes/annotations');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/annotations', annotationRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Reading Notes API is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

// 启动服务器
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  POST /api/auth/login - User login');
      console.log('  GET  /api/auth/me - Get current user');
      console.log('  GET  /api/documents - List documents');
      console.log('  GET  /api/documents/:id - Get document');
      console.log('  POST /api/documents - Import document');
      console.log('  PUT  /api/documents/:id - Update document');
      console.log('  DELETE /api/documents/:id - Delete document');
      console.log('  GET  /api/annotations/document/:docId - Get annotations');
      console.log('  POST /api/annotations - Create annotation');
      console.log('  PUT  /api/annotations/:id - Update annotation');
      console.log('  DELETE /api/annotations/:id - Delete annotation');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
