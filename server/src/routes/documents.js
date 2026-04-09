const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase, saveDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('只支持 .txt 格式文件'));
    }
  }
});

// 获取文档列表
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;

  const result = db.exec(`
    SELECT id, user_id, title, content, summary, file_type, created_at, updated_at
    FROM documents
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `);

  if (result.length === 0) {
    return res.json([]);
  }

  const documents = result[0].values.map(row => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    summary: row[4],
    fileType: row[5],
    createdAt: row[6],
    updatedAt: row[7]
  }));

  res.json(documents);
});

// 获取单个文档
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const docId = req.params.id;
  const userId = req.user.id;

  const result = db.exec(`
    SELECT id, user_id, title, content, summary, file_type, created_at, updated_at
    FROM documents
    WHERE id = ${docId} AND user_id = ${userId}
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: '文档不存在' });
  }

  const row = result[0].values[0];
  res.json({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    summary: row[4],
    fileType: row[5],
    createdAt: row[6],
    updatedAt: row[7]
  });
});

// 导入文档
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const title = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const summary = content.substring(0, 200) + (content.length > 200 ? '...' : '');

    db.run(`
      INSERT INTO documents (user_id, title, content, summary, file_type)
      VALUES (${userId}, '${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}', '${summary.replace(/'/g, "''")}', 'txt')
    `);

    saveDatabase();

    // 获取刚插入的文档
    const result = db.exec(`SELECT last_insert_rowid()`);
    const docId = result[0].values[0][0];

    res.json({
      success: true,
      document: {
        id: docId,
        userId,
        title,
        content,
        summary,
        fileType: 'txt'
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: '导入失败' });
  } finally {
    // 清理上传的文件
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// 更新文档
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const docId = req.params.id;
  const userId = req.user.id;
  const { title, content } = req.body;

  // 检查文档是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM documents WHERE id = ${docId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '文档不存在' });
  }

  const summary = content ? content.substring(0, 200) + (content.length > 200 ? '...' : '') : '';

  db.run(`
    UPDATE documents
    SET title = '${title ? title.replace(/'/g, "''") : ''}',
        content = '${content ? content.replace(/'/g, "''") : ''}',
        summary = '${summary}',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${docId}
  `);

  saveDatabase();

  res.json({ success: true });
});

// 删除文档
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const docId = req.params.id;
  const userId = req.user.id;

  // 检查文档是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM documents WHERE id = ${docId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '文档不存在' });
  }

  // 删除文档的标注
  db.run(`DELETE FROM annotations WHERE document_id = ${docId}`);

  // 删除文档
  db.run(`DELETE FROM documents WHERE id = ${docId}`);

  saveDatabase();

  res.json({ success: true });
});

module.exports = router;
