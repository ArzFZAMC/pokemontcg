const db = require('../config/database');

// Paket coin yang tersedia
const COIN_PACKAGES = [
  { id: 'pack_10', name: 'Starter Pack', coins: 10, price: 1000, bonus: 0, icon: '🪙', popular: false },
  { id: 'pack_50', name: 'Trainer Pack', coins: 50, price: 5000, bonus: 5, icon: '💰', popular: false },
  { id: 'pack_100', name: 'Master Pack', coins: 100, price: 10000, bonus: 15, icon: '💎', popular: true },
  { id: 'pack_500', name: 'Legend Pack', coins: 500, price: 45000, bonus: 100, icon: '👑', popular: false },
];

// Streak reward tiers
const STREAK_REWARDS = [
  { streak: 1, coins: 10 },
  { streak: 2, coins: 12 },
  { streak: 3, coins: 15 },
  { streak: 4, coins: 18 },
  { streak: 5, coins: 20 },
  { streak: 6, coins: 25 },
  { streak: 7, coins: 35 }, // bonus hari ke-7
];

function getStreakReward(streak) {
  const tier = STREAK_REWARDS.find(r => r.streak === Math.min(streak, 7));
  return tier ? tier.coins : 10;
}

// GET status daily reward (sudah claim hari ini atau belum)
const getDailyStatus = async (req, res) => {
  try {
    const uid = req.user.id;

    // Ambil claim terakhir
    const [lastClaim] = await db.query(
      'SELECT * FROM daily_rewards WHERE user_id=? ORDER BY claimed_at DESC LIMIT 1',
      [uid]
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let canClaim = true;
    let currentStreak = 1;
    let nextReward = 10;
    let lastClaimedAt = null;
    let hoursUntilNext = 0;

    if (lastClaim.length > 0) {
      const last = lastClaim[0];
      const lastDate = new Date(last.claimed_at);
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      // Sudah claim hari ini?
      if (lastDayStart.getTime() === todayStart.getTime()) {
        canClaim = false;
        currentStreak = last.streak;
        // Hitung jam sampai bisa claim lagi (besok jam 00:00)
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        hoursUntilNext = Math.ceil((tomorrow - now) / (1000 * 60 * 60));
      } else {
        // Cek apakah streak masih berlanjut (claim kemarin)
        const yesterday = new Date(todayStart);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDayStart.getTime() === yesterday.getTime()) {
          currentStreak = last.streak + 1; // lanjut streak
        } else {
          currentStreak = 1; // streak reset
        }
      }
      lastClaimedAt = last.claimed_at;
    }

    nextReward = getStreakReward(currentStreak);

    // Ambil coins user
    const [[user]] = await db.query('SELECT coins FROM users WHERE id=?', [uid]);

    res.json({
      success: true,
      canClaim,
      currentStreak,
      nextReward,
      lastClaimedAt,
      hoursUntilNext,
      coins: user.coins,
      streakRewards: STREAK_REWARDS,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST claim daily reward
const claimDailyReward = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const uid = req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Cek sudah claim hari ini
    const [lastClaim] = await conn.query(
      'SELECT * FROM daily_rewards WHERE user_id=? ORDER BY claimed_at DESC LIMIT 1',
      [uid]
    );

    let currentStreak = 1;

    if (lastClaim.length > 0) {
      const last = lastClaim[0];
      const lastDate = new Date(last.claimed_at);
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      // Sudah claim hari ini
      if (lastDayStart.getTime() === todayStart.getTime()) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Already claimed today!' });
      }

      // Cek streak
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDayStart.getTime() === yesterday.getTime()) {
        currentStreak = last.streak + 1;
      } else {
        currentStreak = 1; // reset
      }
    }

    const coinsToGive = getStreakReward(currentStreak);
    const isWeeklyBonus = currentStreak % 7 === 0;

    // Tambah coins ke user
    await conn.query('UPDATE users SET coins = coins + ? WHERE id=?', [coinsToGive, uid]);

    // Catat claim
    await conn.query(
      'INSERT INTO daily_rewards (user_id, coins_given, streak) VALUES (?,?,?)',
      [uid, coinsToGive, currentStreak]
    );

    // Achievement: login 7 hari berturut
    if (currentStreak >= 7) {
      await conn.query(
        `INSERT IGNORE INTO achievements (user_id, achievement_key, achievement_name, achievement_desc, achievement_icon)
         VALUES (?, 'weekly_streak', 'Dedicated Trainer', 'Logged in 7 days in a row', '🔥')`,
        [uid]
      );
    }

    // Ambil coins terbaru
    const [[user]] = await conn.query('SELECT coins FROM users WHERE id=?', [uid]);

    await conn.commit();
    res.json({
      success: true,
      message: `Daily reward claimed! +${coinsToGive} coins${isWeeklyBonus ? ' 🎉 Weekly Bonus!' : ''}`,
      coinsGiven: coinsToGive,
      currentStreak,
      isWeeklyBonus,
      totalCoins: user.coins,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// GET daftar paket coin
const getPackages = async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT coins FROM users WHERE id=?', [req.user.id]);
    res.json({ success: true, packages: COIN_PACKAGES, currentCoins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST beli coin (dummy simulasi)
const purchaseCoins = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { package_id } = req.body;
    const pkg = COIN_PACKAGES.find(p => p.id === package_id);

    if (!pkg) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Invalid package' });
    }

    const totalCoins = pkg.coins + pkg.bonus;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Catat transaksi
    await conn.query(
      `INSERT INTO coin_purchases (user_id, package_id, package_name, coins_amount, price_idr, status, transaction_id)
       VALUES (?,?,?,?,?,'success',?)`,
      [req.user.id, pkg.id, pkg.name, totalCoins, pkg.price, transactionId]
    );

    // Tambah coins
    await conn.query('UPDATE users SET coins = coins + ? WHERE id=?', [totalCoins, req.user.id]);

    // Ambil coins terbaru
    const [[user]] = await conn.query('SELECT coins FROM users WHERE id=?', [req.user.id]);

    // Achievement: beli coin pertama kali
    await conn.query(
      `INSERT IGNORE INTO achievements (user_id, achievement_key, achievement_name, achievement_desc, achievement_icon)
       VALUES (?, 'first_purchase', 'Big Spender', 'Made your first coin purchase', '💳')`,
      [req.user.id]
    );

    await conn.commit();
    res.json({
      success: true,
      message: `Purchase successful! +${totalCoins} coins added`,
      transaction_id: transactionId,
      coinsAdded: totalCoins,
      totalCoins: user.coins,
      package: pkg,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// GET riwayat pembelian
const getPurchaseHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM coin_purchases WHERE user_id=? ORDER BY purchased_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET riwayat daily reward
const getDailyHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM daily_rewards WHERE user_id=? ORDER BY claimed_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDailyStatus, claimDailyReward,
  getPackages, purchaseCoins,
  getPurchaseHistory, getDailyHistory,
};
