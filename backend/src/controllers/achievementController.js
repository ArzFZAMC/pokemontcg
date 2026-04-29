const db = require('../config/database');

const getAchievements = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM achievements WHERE user_id=? ORDER BY unlocked_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAchievements };
