const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');
const { generateToken } = require('../middleware/auth');

// 登录
router.post('/login', (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ error: '请输入账号和密码' });
  }

  const db = getDatabase();

  // 验证手机号或邮箱格式
  const isEmail = account.includes('@');
  let query;

  if (isEmail) {
    query = `SELECT * FROM users WHERE email = '${account}'`;
  } else {
    query = `SELECT * FROM users WHERE phone = '${account}'`;
  }

  const result = db.exec(query);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: '账号不存在' });
  }

  const user = result[0].values[0];
  const userData = {
    id: user[0],
    phone: user[1],
    email: user[2],
    password: user[3],
    created_at: user[4]
  };

  // 密码验证（当前固定为 123456）
  if (password !== userData.password) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = generateToken(userData);

  res.json({
    success: true,
    token,
    user: {
      id: userData.id,
      phone: userData.phone,
      email: userData.email
    }
  });
});

// 获取当前用户信息
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const db = getDatabase();
  const result = db.exec(`SELECT id, phone, email, created_at FROM users WHERE id = ${req.user.id}`);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const user = result[0].values[0];
  res.json({
    id: user[0],
    phone: user[1],
    email: user[2],
    created_at: user[3]
  });
});

module.exports = router;
