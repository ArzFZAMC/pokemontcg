const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const [existing] = await db.query('SELECT id FROM users WHERE email=? OR username=?', [email, username]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Username or email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?,?,?)',
      [username, email, hash]
    );

    const token = jwt.sign({ id: result.insertId, username, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ success: true, message: 'Registered successfully', token, user: { id: result.insertId, username, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, favorite_type: user.favorite_type } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,username,email,avatar_url,favorite_type,created_at FROM users WHERE id=?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { avatar_url, favorite_type } = req.body;
    await db.query('UPDATE users SET avatar_url=?, favorite_type=? WHERE id=?', [avatar_url, favorite_type, req.user.id]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
