const db = require('../config/database');

const getWishlist = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wishlist WHERE user_id=? ORDER BY added_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { card_id, card_name, card_image, card_rarity, card_set_name, card_data, priority, notes } = req.body;
    await db.query(
      `INSERT INTO wishlist (user_id,card_id,card_name,card_image,card_rarity,card_set_name,card_data,priority,notes)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE priority=VALUES(priority), notes=VALUES(notes)`,
      [req.user.id, card_id, card_name, card_image, card_rarity, card_set_name, JSON.stringify(card_data), priority || 'medium', notes]
    );
    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePriority = async (req, res) => {
  try {
    await db.query('UPDATE wishlist SET priority=? WHERE id=? AND user_id=?', [req.body.priority, req.params.id, req.user.id]);
    res.json({ success: true, message: 'Priority updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, updatePriority };
