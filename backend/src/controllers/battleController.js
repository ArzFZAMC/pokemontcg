const db = require('../config/database');

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Calculate damage with weakness/resistance
function calculateDamage(attack, defenderCard) {
  let damage = parseInt(attack.damage) || 30;

  // Parse weaknesses
  let weaknesses = [];
  try {
    weaknesses = typeof defenderCard.weaknesses === 'string'
      ? JSON.parse(defenderCard.weaknesses)
      : (defenderCard.weaknesses || []);
  } catch { weaknesses = []; }

  // Check weakness (biasanya x2)
  for (const w of weaknesses) {
    if (w.type && attack.attackerType && w.type.toLowerCase() === attack.attackerType.toLowerCase()) {
      if (w.value && w.value.includes('×')) {
        const mult = parseFloat(w.value.replace('×', '')) || 2;
        damage = Math.floor(damage * mult);
      } else {
        damage = Math.floor(damage * 2);
      }
      break;
    }
  }

  return Math.max(10, damage); // minimum 10 damage
}

// GET battle stats user
const getBattleStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const [[wins]] = await db.query('SELECT COUNT(*) as count FROM battle_history WHERE winner_id=?', [uid]);
    const [[losses]] = await db.query('SELECT COUNT(*) as count FROM battle_history WHERE loser_id=?', [uid]);
    const [recent] = await db.query(
      `SELECT bh.*, u1.username as winner_name, u2.username as loser_name
       FROM battle_history bh
       JOIN users u1 ON bh.winner_id = u1.id
       JOIN users u2 ON bh.loser_id = u2.id
       WHERE bh.winner_id=? OR bh.loser_id=?
       ORDER BY bh.played_at DESC LIMIT 10`,
      [uid, uid]
    );
    const [[user]] = await db.query('SELECT coins FROM users WHERE id=?', [uid]);

    res.json({
      success: true,
      stats: { wins: wins.count, losses: losses.count, coins: user.coins },
      recent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create battle room
const createRoom = async (req, res) => {
  try {
    let roomCode;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      const [existing] = await db.query("SELECT id FROM battle_rooms WHERE room_code=? AND status != 'finished'", [roomCode]);
      if (!existing.length) break;
      attempts++;
    } while (attempts < 10);

    const [result] = await db.query(
      'INSERT INTO battle_rooms (room_code, player1_id) VALUES (?,?)',
      [roomCode, req.user.id]
    );

    res.status(201).json({
      success: true,
      room_code: roomCode,
      room_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST join room by code
const joinRoom = async (req, res) => {
  try {
    const { room_code } = req.body;
    const [rooms] = await db.query(
      "SELECT * FROM battle_rooms WHERE room_code=? AND status='waiting'",
      [room_code.toUpperCase()]
    );

    if (!rooms.length) {
      return res.status(404).json({ success: false, message: 'Room not found or already started' });
    }

    const room = rooms[0];
    if (room.player1_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot join your own room' });
    }

    await db.query(
      "UPDATE battle_rooms SET player2_id=?, status='selecting' WHERE id=?",
      [req.user.id, room.id]
    );

    res.json({ success: true, room_id: room.id, room_code: room.room_code });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET room info
const getRoom = async (req, res) => {
  try {
    const [rooms] = await db.query(
      `SELECT br.*, 
        u1.username as player1_name, u1.avatar_url as player1_avatar,
        u2.username as player2_name, u2.avatar_url as player2_avatar
       FROM battle_rooms br
       JOIN users u1 ON br.player1_id = u1.id
       LEFT JOIN users u2 ON br.player2_id = u2.id
       WHERE br.id=?`,
      [req.params.id]
    );

    if (!rooms.length) return res.status(404).json({ success: false, message: 'Room not found' });

    const room = rooms[0];

    // Get battle cards
    const [cards] = await db.query(
      'SELECT * FROM battle_cards WHERE room_id=? ORDER BY user_id, slot_order',
      [room.id]
    );

    // Get battle logs
    const [logs] = await db.query(
      'SELECT * FROM battle_logs WHERE room_id=? ORDER BY id DESC LIMIT 20',
      [room.id]
    );

    res.json({ success: true, room, cards, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST submit selected cards
const submitCards = async (req, res) => {
  try {
    const { room_id, cards } = req.body;

    if (!cards || cards.length !== 6) {
      return res.status(400).json({ success: false, message: 'Select exactly 6 cards' });
    }

    const [room] = await db.query(
      "SELECT * FROM battle_rooms WHERE id=? AND status='selecting'",
      [room_id]
    );
    if (!room.length) return res.status(404).json({ success: false, message: 'Room not found' });

    // Cek apakah user sudah submit
    const [existing] = await db.query(
      'SELECT id FROM battle_cards WHERE room_id=? AND user_id=?',
      [room_id, req.user.id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Cards already submitted' });
    }

    // Insert cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const hp = parseInt(card.card_hp) || parseInt(card.hp) || 100;

      // Parse attacks dari card_data
      let attacks = [];
      try {
        const data = card.card_data ? (typeof card.card_data === 'string' ? JSON.parse(card.card_data) : card.card_data) : null;
        attacks = data?.attacks || card.attacks || [];
      } catch { attacks = []; }

      let weaknesses = [];
      try {
        const data = card.card_data ? (typeof card.card_data === 'string' ? JSON.parse(card.card_data) : card.card_data) : null;
        weaknesses = data?.weaknesses || card.weaknesses || [];
      } catch { weaknesses = []; }

      await db.query(
        `INSERT INTO battle_cards (room_id, user_id, card_id, card_name, card_image, card_type, card_rarity, max_hp, current_hp, attacks, weaknesses, slot_order, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          room_id, req.user.id,
          card.card_id || card.id,
          card.card_name || card.name,
          card.card_image || card.images?.large || card.images?.small,
          card.card_type || card.types?.[0],
          card.card_rarity || card.rarity,
          hp, hp,
          JSON.stringify(attacks),
          JSON.stringify(weaknesses),
          i,
          i === 0 ? 1 : 0 // kartu pertama jadi active
        ]
      );
    }

    // Cek apakah kedua player sudah submit
        const [submitted] = await db.query(
      'SELECT DISTINCT user_id FROM battle_cards WHERE room_id=?',
      [room_id]
    );

    let battleStarted = false;
    if (submitted.length === 2) {
      // Pastikan active card slot 0 (bukan slot 1)
      await db.query(
        "UPDATE battle_cards SET is_active=0 WHERE room_id=?",
        [room_id]
      );
      await db.query(
        `UPDATE battle_cards SET is_active=1 
        WHERE room_id=? AND slot_order=0`,
        [room_id]
      );
      await db.query(
        "UPDATE battle_rooms SET status='battle', current_turn=player1_id WHERE id=?",
        [room_id]
      );
      battleStarted = true;
    }

    res.json({ success: true, message: 'Cards submitted', battleStarted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBattleStats, createRoom, joinRoom, getRoom, submitCards };