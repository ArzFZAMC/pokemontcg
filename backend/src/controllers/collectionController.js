const db = require('../config/database');

const getCollection = async (req, res) => {
  try {
    const { search, rarity, type, sort } = req.query;
    let query = 'SELECT * FROM collections WHERE user_id=?';
    const params = [req.user.id];

    if (search) { query += ' AND card_name LIKE ?'; params.push(`%${search}%`); }
    if (rarity) { query += ' AND card_rarity=?'; params.push(rarity); }
    if (type) { query += ' AND card_type=?'; params.push(type); }

    if (sort === 'alphabet') query += ' ORDER BY card_name ASC';
    else if (sort === 'rarity') query += ' ORDER BY FIELD(card_rarity,"Gold","Secret Rare","Full Art","EX","Rare","Common") ASC';
    else query += ' ORDER BY added_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: pastikan card_data selalu jadi valid JSON string atau null
function safeJsonStringify(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === 'string') {
    // Kalau sudah string, cek apakah valid JSON
    try {
      JSON.parse(data);
      return data; // sudah valid JSON string, langsung return
    } catch {
      return null; // string tapi bukan JSON valid, buang
    }
  }
  if (typeof data === 'object') {
    try {
      return JSON.stringify(data);
    } catch {
      return null;
    }
  }
  return null;
}

const addCard = async (req, res) => {
  try {
    const {
      card_id, card_name, card_image, card_type, card_rarity,
      card_hp, card_set_name, card_set_logo, card_artist,
      card_data, quantity, condition_status, is_favorite
    } = req.body;

    const cardDataJson = safeJsonStringify(card_data);

    await db.query(
      `INSERT INTO collections 
        (user_id,card_id,card_name,card_image,card_type,card_rarity,card_hp,card_set_name,card_set_logo,card_artist,card_data,quantity,condition_status,is_favorite)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE 
        quantity=VALUES(quantity), 
        condition_status=VALUES(condition_status), 
        is_favorite=VALUES(is_favorite), 
        updated_at=NOW()`,
      [
        req.user.id, card_id, card_name, card_image, card_type, card_rarity,
        card_hp || null, card_set_name || null, card_set_logo || null, card_artist || null,
        cardDataJson,
        quantity || 1,
        condition_status || 'near_mint',
        is_favorite || 0
      ]
    );

    await checkAchievements(req.user.id);
    res.status(201).json({ success: true, message: 'Card added to collection' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, condition_status, is_favorite, is_owned } = req.body;
    await db.query(
      'UPDATE collections SET quantity=?,condition_status=?,is_favorite=?,is_owned=?,updated_at=NOW() WHERE id=? AND user_id=?',
      [quantity, condition_status, is_favorite, is_owned, id, req.user.id]
    );
    res.json({ success: true, message: 'Card updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeCard = async (req, res) => {
  try {
    await db.query('DELETE FROM collections WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Card removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM collections WHERE user_id=?', [uid]);
    const [[{ favorites }]] = await db.query('SELECT COUNT(*) as favorites FROM collections WHERE user_id=? AND is_favorite=1', [uid]);
    const [rarityStats] = await db.query('SELECT card_rarity, COUNT(*) as count FROM collections WHERE user_id=? GROUP BY card_rarity ORDER BY count DESC', [uid]);
    const [typeStats] = await db.query('SELECT card_type, COUNT(*) as count FROM collections WHERE user_id=? AND card_type IS NOT NULL GROUP BY card_type ORDER BY count DESC', [uid]);
    const [recent] = await db.query('SELECT * FROM collections WHERE user_id=? ORDER BY added_at DESC LIMIT 6', [uid]);
    const [favoriteCards] = await db.query('SELECT * FROM collections WHERE user_id=? AND is_favorite=1 LIMIT 3', [uid]);

    res.json({ success: true, stats: { total, favorites, rarityStats, typeStats }, recent, favoriteCards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function checkAchievements(userId) {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM collections WHERE user_id=?', [userId]);
    const [[{ exCount }]] = await db.query("SELECT COUNT(*) as exCount FROM collections WHERE user_id=? AND card_rarity LIKE '%EX%'", [userId]);
    const [[{ deckCount }]] = await db.query('SELECT COUNT(*) as deckCount FROM decks WHERE user_id=?', [userId]);

    const achievements = [];
    if (total >= 1) achievements.push({ key: 'first_catch', name: 'First Catch!', desc: 'Added your first card', icon: '🎴' });
    if (total >= 10) achievements.push({ key: 'collector', name: 'Collector', desc: 'Collected 10 cards', icon: '📦' });
    if (total >= 50) achievements.push({ key: 'ghost_collector', name: 'Ghost Collector', desc: 'Collected 50 cards', icon: '👻' });
    if (total >= 100) achievements.push({ key: 'legendary_owner', name: 'Legendary Owner', desc: 'Collected 100 cards', icon: '🏆' });
    if (exCount >= 1) achievements.push({ key: 'ex_hunter', name: 'EX Hunter', desc: 'Obtained an EX card', icon: '⚡' });
    if (deckCount >= 1) achievements.push({ key: 'deck_master', name: 'Deck Master', desc: 'Created your first deck', icon: '🃏' });

    for (const ach of achievements) {
      await db.query(
        'INSERT IGNORE INTO achievements (user_id,achievement_key,achievement_name,achievement_desc,achievement_icon) VALUES (?,?,?,?,?)',
        [userId, ach.key, ach.name, ach.desc, ach.icon]
      );
    }
  } catch (_) {}
}

module.exports = { getCollection, addCard, updateCard, removeCard, getStats };