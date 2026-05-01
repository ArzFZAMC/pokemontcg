const db = require('../config/database');

// Calculate damage
function calculateDamage(attack, attackerType, defenderWeaknesses) {
  let damage = parseInt(attack.damage) || 30;
  if (!damage || isNaN(damage)) damage = 30;

  let weaknesses = [];
  try {
    weaknesses = typeof defenderWeaknesses === 'string'
      ? JSON.parse(defenderWeaknesses) : (defenderWeaknesses || []);
  } catch { weaknesses = []; }

  for (const w of weaknesses) {
    if (w.type && attackerType && w.type.toLowerCase() === attackerType.toLowerCase()) {
      damage = Math.floor(damage * 2);
      break;
    }
  }

  return Math.max(10, Math.min(damage, 300));
}

// Get active card for a player in a room
async function getActiveCard(roomId, userId) {
  const [cards] = await db.query(
    'SELECT * FROM battle_cards WHERE room_id=? AND user_id=? AND is_active=1 AND is_ko=0',
    [roomId, userId]
  );
  return cards[0] || null;
}

// Get all cards for a player
async function getPlayerCards(roomId, userId) {
  const [cards] = await db.query(
    'SELECT * FROM battle_cards WHERE room_id=? AND user_id=? ORDER BY slot_order',
    [roomId, userId]
  );
  return cards;
}

// Get full room state to broadcast
async function getRoomState(roomId) {
  const [[room]] = await db.query(
    `SELECT br.*, 
      u1.username as player1_name, u1.avatar_url as player1_avatar,
      u2.username as player2_name, u2.avatar_url as player2_avatar
     FROM battle_rooms br
     JOIN users u1 ON br.player1_id = u1.id
     LEFT JOIN users u2 ON br.player2_id = u2.id
     WHERE br.id=?`,
    [roomId]
  );

  const [cards] = await db.query(
    'SELECT * FROM battle_cards WHERE room_id=? ORDER BY user_id, slot_order',
    [roomId]
  );

  const [logs] = await db.query(
    'SELECT * FROM battle_logs WHERE room_id=? ORDER BY id DESC LIMIT 10',
    [roomId]
  );

  // Parse JSON fields
  const parsedCards = cards.map(c => ({
    ...c,
    attacks: (() => { try { return typeof c.attacks === 'string' ? JSON.parse(c.attacks) : (c.attacks || []); } catch { return []; } })(),
    weaknesses: (() => { try { return typeof c.weaknesses === 'string' ? JSON.parse(c.weaknesses) : (c.weaknesses || []); } catch { return []; } })(),
  }));

  return { room, cards: parsedCards, logs };
}

module.exports = (io) => {
  // Map: roomId → Set of socket ids
  const roomSockets = new Map();
  // Map: socketId → { userId, username, roomId }
  const socketUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── AUTH ──────────────────────────────────────
    socket.on('auth', ({ userId, username }) => {
      socketUsers.set(socket.id, { userId: parseInt(userId), username, roomId: null });
      socket.emit('auth_ok', { userId, username });
    });

    // ── JOIN ROOM ─────────────────────────────────
          socket.on('join_room', async ({ roomId }) => {
        try {
          const user = socketUsers.get(socket.id);
          if (!user) return socket.emit('error', { message: 'Not authenticated' });

          socket.join(`room_${roomId}`);
          user.roomId = parseInt(roomId);
          socketUsers.set(socket.id, user);

          if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
          roomSockets.get(roomId).add(socket.id);

          const state = await getRoomState(roomId);

          // Broadcast room_state ke semua di room
          io.to(`room_${roomId}`).emit('room_state', state);

          // Kalau status sudah selecting, broadcast ke semua biar player 1 langsung pindah fase
          if (state.room?.status === 'selecting') {
            io.to(`room_${roomId}`).emit('battle_phase_change', { phase: 'selecting' });
          }

          // Notify player lain bahwa ada yang join
          socket.to(`room_${roomId}`).emit('player_joined', {
            userId: user.userId,
            username: user.username,
          });

          console.log(`👤 ${user.username} joined room ${roomId}`);
        } catch (err) {
          socket.emit('error', { message: err.message });
        }
      });

    // ── CARDS READY (both players selected) ──────
    socket.on('cards_ready', async ({ roomId }) => {
      try {
        const state = await getRoomState(roomId);
        io.to(`room_${roomId}`).emit('room_state', state);

        if (state.room?.status === 'battle') {
          io.to(`room_${roomId}`).emit('battle_start', {
            message: 'Battle Start! 🔥',
            currentTurn: state.room.current_turn,
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── ATTACK ────────────────────────────────────
    socket.on('attack', async ({ roomId, attackIndex }) => {
      try {
        const user = socketUsers.get(socket.id);
        if (!user) return socket.emit('error', { message: 'Not authenticated' });

        // Verify it's this player's turn
        const [[room]] = await db.query('SELECT * FROM battle_rooms WHERE id=?', [roomId]);
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.status !== 'battle') return socket.emit('error', { message: 'Battle not active' });
        if (room.current_turn !== user.userId) {
          return socket.emit('error', { message: "It's not your turn!" });
        }

        // Get attacker's active card
        const attackerCard = await getActiveCard(roomId, user.userId);
        if (!attackerCard) return socket.emit('error', { message: 'No active card' });

        // Parse attacks
        let attacks = [];
        try {
          attacks = typeof attackerCard.attacks === 'string'
            ? JSON.parse(attackerCard.attacks) : (attackerCard.attacks || []);
        } catch { attacks = []; }

        if (!attacks.length) {
          // Default attack if no attacks found
          attacks = [{ name: 'Tackle', damage: '30' }];
        }

        const attack = attacks[Math.min(attackIndex, attacks.length - 1)];
        if (!attack) return socket.emit('error', { message: 'Invalid attack' });

        // Get defender id
        const defenderId = room.player1_id === user.userId ? room.player2_id : room.player1_id;

        // Get defender's active card
        const defenderCard = await getActiveCard(roomId, defenderId);
        if (!defenderCard) return socket.emit('error', { message: 'Defender has no active card' });

        // Calculate damage
        const damage = calculateDamage(attack, attackerCard.card_type, defenderCard.weaknesses);
        const newHp = Math.max(0, defenderCard.current_hp - damage);
        const isKo = newHp <= 0;

        // Update defender HP
        await db.query(
          'UPDATE battle_cards SET current_hp=?, is_ko=?, is_active=? WHERE id=?',
          [newHp, isKo ? 1 : 0, isKo ? 0 : 1, defenderCard.id]
        );

        // Count KOs
        let p1Ko = room.player1_ko;
        let p2Ko = room.player2_ko;
        let nextActiveCard = null;

        if (isKo) {
          if (defenderId === room.player1_id) p1Ko++;
          else p2Ko++;

          await db.query(
            'UPDATE battle_rooms SET player1_ko=?, player2_ko=? WHERE id=?',
            [p1Ko, p2Ko, roomId]
          );

          // Try to set next active card for defender
          const [remaining] = await db.query(
            'SELECT * FROM battle_cards WHERE room_id=? AND user_id=? AND is_ko=0 AND is_active=0 ORDER BY slot_order LIMIT 1',
            [roomId, defenderId]
          );

          if (remaining.length) {
            await db.query('UPDATE battle_cards SET is_active=1 WHERE id=?', [remaining[0].id]);
            nextActiveCard = remaining[0].card_name;
          }
        }

        // Log the attack
        const logText = isKo
          ? `${user.username}'s ${attackerCard.card_name} used ${attack.name} for ${damage} damage! ${defenderCard.card_name} is KO'd! 💥`
          : `${user.username}'s ${attackerCard.card_name} used ${attack.name} for ${damage} damage! (${newHp} HP remaining)`;

        const [[lastLog]] = await db.query(
          'SELECT MAX(turn) as maxTurn FROM battle_logs WHERE room_id=?', [roomId]
        );
        const turn = (lastLog.maxTurn || 0) + 1;

        await db.query(
          `INSERT INTO battle_logs (room_id, turn, attacker_id, defender_id, attacker_card, defender_card, attack_name, damage, is_ko, log_text)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [roomId, turn, user.userId, defenderId, attackerCard.card_name, defenderCard.card_name, attack.name, damage, isKo ? 1 : 0, logText]
        );

        // Check win condition (3 KOs)
        const winnerKo = Math.max(p1Ko, p2Ko);
        let winnerId = null;
        if (winnerKo >= 3) {
          winnerId = p1Ko >= 3 ? room.player1_id : room.player2_id;
          const loserId = winnerId === room.player1_id ? room.player2_id : room.player1_id;
          const [[totalTurns]] = await db.query('SELECT COUNT(*) as c FROM battle_logs WHERE room_id=?', [roomId]);
          const coinReward = room.coin_reward || 50;

          await db.query(
            "UPDATE battle_rooms SET status='finished', winner_id=? WHERE id=?",
            [winnerId, roomId]
          );

          // Award coins to winner
          await db.query('UPDATE users SET coins = coins + ? WHERE id=?', [coinReward, winnerId]);

          // Save history
          await db.query(
            `INSERT INTO battle_history (room_id, winner_id, loser_id, winner_ko, loser_ko, total_turns, coins_awarded)
             VALUES (?,?,?,?,?,?,?)`,
            [roomId, winnerId, loserId, Math.max(p1Ko, p2Ko), Math.min(p1Ko, p2Ko), totalTurns.c, coinReward]
          );

          // Achievement
          await db.query(
            `INSERT IGNORE INTO achievements (user_id, achievement_key, achievement_name, achievement_desc, achievement_icon)
             VALUES (?, 'first_battle_win', 'Battle Champion', 'Won your first PvP battle', '⚔️')`,
            [winnerId]
          );

          const state = await getRoomState(roomId);
          io.to(`room_${roomId}`).emit('room_state', state);
          io.to(`room_${roomId}`).emit('battle_end', {
            winnerId,
            winnerKo: Math.max(p1Ko, p2Ko),
            loserKo: Math.min(p1Ko, p2Ko),
            coinReward,
            logText: `🏆 Battle Over! ${winnerId === room.player1_id ? state.room?.player1_name : state.room?.player2_name} wins! +${coinReward} coins`,
          });
          return;
        }

        // Switch turn
        const nextTurn = defenderId;
        await db.query('UPDATE battle_rooms SET current_turn=? WHERE id=?', [nextTurn, roomId]);

        // Broadcast state
        const state = await getRoomState(roomId);
        io.to(`room_${roomId}`).emit('room_state', state);
        io.to(`room_${roomId}`).emit('attack_result', {
          attackerId: user.userId,
          attackerName: user.username,
          attackerCard: attackerCard.card_name,
          defenderCard: defenderCard.card_name,
          attackName: attack.name,
          damage,
          newHp,
          isKo,
          nextActiveCard,
          nextTurn,
          logText,
          koScore: { player1: p1Ko, player2: p2Ko },
        });
      } catch (err) {
        console.error('Attack error:', err);
        socket.emit('error', { message: err.message });
      }
    });

    // ── RETREAT (switch active card) ──────────────
    socket.on('retreat', async ({ roomId, cardId }) => {
      try {
        const user = socketUsers.get(socket.id);
        if (!user) return socket.emit('error', { message: 'Not authenticated' });

        const [[room]] = await db.query('SELECT * FROM battle_rooms WHERE id=?', [roomId]);
        if (room.current_turn !== user.userId) {
          return socket.emit('error', { message: "Can only retreat on your turn" });
        }

        // Deactivate current active card
        await db.query(
          'UPDATE battle_cards SET is_active=0 WHERE room_id=? AND user_id=? AND is_active=1',
          [roomId, user.userId]
        );

        // Activate selected card
        await db.query(
          'UPDATE battle_cards SET is_active=1 WHERE id=? AND user_id=? AND is_ko=0',
          [cardId, user.userId]
        );

        const state = await getRoomState(roomId);
        io.to(`room_${roomId}`).emit('room_state', state);
        io.to(`room_${roomId}`).emit('retreat_done', {
          userId: user.userId,
          username: user.username,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── FORFEIT ───────────────────────────────────
    socket.on('forfeit', async ({ roomId }) => {
      try {
        const user = socketUsers.get(socket.id);
        if (!user) return;

        const [[room]] = await db.query('SELECT * FROM battle_rooms WHERE id=?', [roomId]);
        if (!room || room.status === 'finished') return;

        const winnerId = room.player1_id === user.userId ? room.player2_id : room.player1_id;
        const coinReward = room.coin_reward || 50;

        await db.query(
          "UPDATE battle_rooms SET status='finished', winner_id=? WHERE id=?",
          [winnerId, roomId]
        );
        await db.query('UPDATE users SET coins = coins + ? WHERE id=?', [coinReward, winnerId]);

        io.to(`room_${roomId}`).emit('battle_end', {
          winnerId,
          coinReward,
          forfeit: true,
          logText: `${user.username} forfeited the battle. Opponent wins! +${coinReward} coins`,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── CHAT ──────────────────────────────────────
    socket.on('chat', ({ roomId, message }) => {
      const user = socketUsers.get(socket.id);
      if (!user || !message?.trim()) return;
      io.to(`room_${roomId}`).emit('chat_message', {
        userId: user.userId,
        username: user.username,
        message: message.trim().substring(0, 100),
        timestamp: new Date().toISOString(),
      });
    });

    // ── DISCONNECT ────────────────────────────────
    socket.on('disconnect', () => {
      const user = socketUsers.get(socket.id);
      if (user?.roomId) {
        socket.to(`room_${user.roomId}`).emit('player_disconnected', {
          userId: user.userId,
          username: user.username,
        });
        const sockets = roomSockets.get(user.roomId);
        if (sockets) sockets.delete(socket.id);
      }
      socketUsers.delete(socket.id);
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
