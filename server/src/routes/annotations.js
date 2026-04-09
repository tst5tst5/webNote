const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// 获取文档的所有标注
router.get('/document/:docId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const docId = req.params.docId;
  const userId = req.user.id;

  // 检查文档是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM documents WHERE id = ${docId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '文档不存在' });
  }

  const result = db.exec(`
    SELECT id, document_id, user_id, selected_text, annotation_content, start_offset, end_offset, created_at
    FROM annotations
    WHERE document_id = ${docId} AND user_id = ${userId}
    ORDER BY start_offset ASC
  `);

  if (result.length === 0) {
    return res.json([]);
  }

  const annotations = result[0].values.map(row => ({
    id: row[0],
    documentId: row[1],
    userId: row[2],
    selectedText: row[3],
    annotationContent: row[4],
    startOffset: row[5],
    endOffset: row[6],
    createdAt: row[7]
  }));

  res.json(annotations);
});

// 创建标注
router.post('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  const userId = req.user.id;
  const { documentId, selectedText, annotationContent, startOffset, endOffset } = req.body;

  if (!documentId || !selectedText) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 检查文档是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM documents WHERE id = ${documentId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '文档不存在' });
  }

  db.run(`
    INSERT INTO annotations (document_id, user_id, selected_text, annotation_content, start_offset, end_offset)
    VALUES (
      ${documentId},
      ${userId},
      '${selectedText.replace(/'/g, "''")}',
      '${annotationContent ? annotationContent.replace(/'/g, "''") : ''}',
      ${startOffset || 0},
      ${endOffset || 0}
    )
  `);

  saveDatabase();

  // 获取刚插入的标注
  const result = db.exec(`SELECT last_insert_rowid()`);
  const annotationId = result[0].values[0][0];

  res.json({
    success: true,
    annotation: {
      id: annotationId,
      documentId,
      userId,
      selectedText,
      annotationContent,
      startOffset,
      endOffset
    }
  });
});

// 更新标注
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const annotationId = req.params.id;
  const userId = req.user.id;
  const { annotationContent } = req.body;

  // 检查标注是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM annotations WHERE id = ${annotationId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '标注不存在' });
  }

  db.run(`
    UPDATE annotations
    SET annotation_content = '${annotationContent ? annotationContent.replace(/'/g, "''") : ''}'
    WHERE id = ${annotationId}
  `);

  saveDatabase();

  res.json({ success: true });
});

// 删除标注
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const annotationId = req.params.id;
  const userId = req.user.id;

  // 检查标注是否存在且属于当前用户
  const checkResult = db.exec(`SELECT id FROM annotations WHERE id = ${annotationId} AND user_id = ${userId}`);
  if (checkResult.length === 0 || checkResult[0].values.length === 0) {
    return res.status(404).json({ error: '标注不存在' });
  }

  db.run(`DELETE FROM annotations WHERE id = ${annotationId}`);

  saveDatabase();

  res.json({ success: true });
});

module.exports = router;
