const db = require('../config/database');

// Helper: pastikan selalu valid JSON string atau null
function safeJsonStringify(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === 'string') {
    try { JSON.parse(data); return data; }
    catch { return null; }
  }
  if (typeof data === 'object') {
    try { return JSON.stringify(data); }
    catch { return null; }
  }
  return null;
}

// ─── MARKETPLACE LISTINGS ───────────────────────────────────────

const getListings = async (req, res) => {
  try {
    const { search, rarity, trade_type } = req.query;
    let query = `
      SELECT tl.*, u.username as seller_name 
      FROM trade_listings tl
      JOIN users u ON tl.seller_id = u.id
      WHERE tl.status = 'open' AND tl.seller_id != ?
    `;
    const params = [req.user.id];

    if (search) { query += ' AND tl.card_name LIKE ?'; params.push(`%${search}%`); }
    if (rarity) { query += ' AND tl.card_rarity = ?'; params.push(rarity); }
    if (trade_type) { query += ' AND (tl.trade_type = ? OR tl.trade_type = "both")'; params.push(trade_type); }
    query += ' ORDER BY tl.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyListings = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM trade_listings WHERE seller_id=? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createListing = async (req, res) => {
  try {
    const {
      card_id, card_name, card_image, card_rarity, card_set_name, card_data,
      trade_type, coin_price, want_card_name, want_card_rarity
    } = req.body;

    if (!card_id || !card_name) {
      return res.status(400).json({ success: false, message: 'Card info required' });
    }

    const [owned] = await db.query(
      'SELECT * FROM collections WHERE user_id=? AND card_id=? AND is_owned=1',
      [req.user.id, card_id]
    );
    if (!owned.length) {
      return res.status(400).json({ success: false, message: 'You do not own this card' });
    }

    const [existing] = await db.query(
      "SELECT id FROM trade_listings WHERE seller_id=? AND card_id=? AND status='open'",
      [req.user.id, card_id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'You already have an active listing for this card' });
    }

    const [result] = await db.query(
      `INSERT INTO trade_listings 
        (seller_id, card_id, card_name, card_image, card_rarity, card_set_name, card_data, trade_type, coin_price, want_card_name, want_card_rarity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id, card_id, card_name, card_image, card_rarity, card_set_name,
        safeJsonStringify(card_data),
        trade_type || 'both', coin_price || null,
        want_card_name || null, want_card_rarity || null
      ]
    );

    res.status(201).json({ success: true, message: 'Listing created', listing_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelListing = async (req, res) => {
  try {
    await db.query(
      "UPDATE trade_listings SET status='cancelled' WHERE id=? AND seller_id=?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Listing cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── TRADE OFFERS ───────────────────────────────────────────────

const getIncomingOffers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT to2.*, u.username as sender_name, tl.card_name as listing_card_name, tl.card_image as listing_card_image
       FROM trade_offers to2
       JOIN users u ON to2.sender_id = u.id
       LEFT JOIN trade_listings tl ON to2.listing_id = tl.id
       WHERE to2.receiver_id=? AND to2.status='pending'
       ORDER BY to2.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSentOffers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT to2.*, u.username as receiver_name, tl.card_name as listing_card_name
       FROM trade_offers to2
       JOIN users u ON to2.receiver_id = u.id
       LEFT JOIN trade_listings tl ON to2.listing_id = tl.id
       WHERE to2.sender_id=?
       ORDER BY to2.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendOffer = async (req, res) => {
  try {
    const {
      listing_id, receiver_username,
      offer_type, coin_amount,
      offer_card_id, offer_card_name, offer_card_image, offer_card_data,
      message
    } = req.body;

    let receiverId;
    if (listing_id) {
      const [listing] = await db.query('SELECT * FROM trade_listings WHERE id=?', [listing_id]);
      if (!listing.length) return res.status(404).json({ success: false, message: 'Listing not found' });
      if (listing[0].status !== 'open') return res.status(400).json({ success: false, message: 'Listing is no longer open' });
      receiverId = listing[0].seller_id;
    } else if (receiver_username) {
      const [user] = await db.query('SELECT id FROM users WHERE username=?', [receiver_username]);
      if (!user.length) return res.status(404).json({ success: false, message: 'User not found' });
      receiverId = user[0].id;
    } else {
      return res.status(400).json({ success: false, message: 'Provide listing_id or receiver_username' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot trade with yourself' });
    }

    if ((offer_type === 'coin' || offer_type === 'both') && coin_amount > 0) {
      const [[user]] = await db.query('SELECT coins FROM users WHERE id=?', [req.user.id]);
      if (user.coins < coin_amount) {
        return res.status(400).json({ success: false, message: 'Insufficient coins' });
      }
    }

    if ((offer_type === 'barter' || offer_type === 'both') && offer_card_id) {
      const [owned] = await db.query(
        'SELECT id FROM collections WHERE user_id=? AND card_id=? AND is_owned=1',
        [req.user.id, offer_card_id]
      );
      if (!owned.length) {
        return res.status(400).json({ success: false, message: 'You do not own the offered card' });
      }
    }

    await db.query(
      `INSERT INTO trade_offers 
        (listing_id, sender_id, receiver_id, offer_type, coin_amount, offer_card_id, offer_card_name, offer_card_image, offer_card_data, message)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        listing_id || null, req.user.id, receiverId,
        offer_type || 'coin', coin_amount || 0,
        offer_card_id || null, offer_card_name || null, offer_card_image || null,
        safeJsonStringify(offer_card_data),
        message || null
      ]
    );

    res.status(201).json({ success: true, message: 'Offer sent!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const acceptOffer = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[offer]] = await conn.query(
      'SELECT * FROM trade_offers WHERE id=? AND receiver_id=? AND status="pending"',
      [req.params.id, req.user.id]
    );
    if (!offer) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    let listing = null;
    if (offer.listing_id) {
      const [[l]] = await conn.query('SELECT * FROM trade_listings WHERE id=?', [offer.listing_id]);
      listing = l;
    }

    const sellerId = req.user.id;
    const buyerId = offer.sender_id;

    // ─── COIN TRANSFER ───
    if ((offer.offer_type === 'coin' || offer.offer_type === 'both') && offer.coin_amount > 0) {
      const [[buyer]] = await conn.query('SELECT coins FROM users WHERE id=?', [buyerId]);
      if (buyer.coins < offer.coin_amount) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Buyer no longer has enough coins' });
      }
      await conn.query('UPDATE users SET coins = coins - ? WHERE id=?', [offer.coin_amount, buyerId]);
      await conn.query('UPDATE users SET coins = coins + ? WHERE id=?', [offer.coin_amount, sellerId]);
    }

    // ─── CARD TRANSFER: listing card seller → buyer ───
    if (listing) {
      const [[sellerCard]] = await conn.query(
        'SELECT * FROM collections WHERE user_id=? AND card_id=? AND is_owned=1',
        [sellerId, listing.card_id]
      );
      if (!sellerCard) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Seller no longer owns the card' });
      }

      if (sellerCard.quantity > 1) {
        await conn.query('UPDATE collections SET quantity=quantity-1 WHERE id=?', [sellerCard.id]);
      } else {
        await conn.query('DELETE FROM collections WHERE id=?', [sellerCard.id]);
      }

      // listing.card_data dari DB sudah string, pakai safeJsonStringify untuk validasi
      await conn.query(
        `INSERT INTO collections (user_id, card_id, card_name, card_image, card_rarity, card_set_name, card_data, quantity)
         VALUES (?,?,?,?,?,?,?,1)
         ON DUPLICATE KEY UPDATE quantity=quantity+1`,
        [
          buyerId, listing.card_id, listing.card_name, listing.card_image,
          listing.card_rarity, listing.card_set_name,
          safeJsonStringify(listing.card_data)
        ]
      );

      await conn.query("UPDATE trade_listings SET status='completed' WHERE id=?", [listing.id]);
    }

    // ─── BARTER CARD TRANSFER: offer card buyer → seller ───
    if ((offer.offer_type === 'barter' || offer.offer_type === 'both') && offer.offer_card_id) {
      const [[buyerCard]] = await conn.query(
        'SELECT * FROM collections WHERE user_id=? AND card_id=? AND is_owned=1',
        [buyerId, offer.offer_card_id]
      );
      if (!buyerCard) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Buyer no longer owns the offered card' });
      }

      if (buyerCard.quantity > 1) {
        await conn.query('UPDATE collections SET quantity=quantity-1 WHERE id=?', [buyerCard.id]);
      } else {
        await conn.query('DELETE FROM collections WHERE id=?', [buyerCard.id]);
      }

      // ✅ pakai offer.offer_card_* bukan listing.*
      await conn.query(
        `INSERT INTO collections (user_id, card_id, card_name, card_image, card_rarity, card_set_name, card_data, quantity)
         VALUES (?,?,?,?,?,?,?,1)
         ON DUPLICATE KEY UPDATE quantity=quantity+1`,
        [
          sellerId,
          offer.offer_card_id,
          offer.offer_card_name,
          offer.offer_card_image,
          offer.offer_card_rarity ?? null,
          null,
          safeJsonStringify(offer.offer_card_data)
        ]
      );
    }

    // ─── UPDATE STATUS ───
    await conn.query(
      "UPDATE trade_offers SET status='accepted', updated_at=NOW() WHERE id=?",
      [offer.id]
    );

    if (offer.listing_id) {
      await conn.query(
        "UPDATE trade_offers SET status='rejected' WHERE listing_id=? AND id!=? AND status='pending'",
        [offer.listing_id, offer.id]
      );
    }

    // ─── LOG HISTORY ───
    await conn.query(
      `INSERT INTO trade_history (seller_id, buyer_id, card_given_name, card_received_name, coins_exchanged, trade_type)
       VALUES (?,?,?,?,?,?)`,
      [
        sellerId, buyerId,
        listing?.card_name ?? null,
        offer.offer_card_name ?? null,
        offer.coin_amount || 0,
        offer.offer_type
      ]
    );

    // ─── ACHIEVEMENTS ───
    await conn.query(
      `INSERT IGNORE INTO achievements (user_id, achievement_key, achievement_name, achievement_desc, achievement_icon)
       VALUES (?, 'first_trade', 'First Trade!', 'Completed your first trade', '🤝')`,
      [sellerId]
    );
    await conn.query(
      `INSERT IGNORE INTO achievements (user_id, achievement_key, achievement_name, achievement_desc, achievement_icon)
       VALUES (?, 'first_trade', 'First Trade!', 'Completed your first trade', '🤝')`,
      [buyerId]
    );

    await conn.commit();
    res.json({ success: true, message: 'Trade completed! 🎉' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

const rejectOffer = async (req, res) => {
  try {
    await db.query(
      "UPDATE trade_offers SET status='rejected', updated_at=NOW() WHERE id=? AND receiver_id=?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Offer rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOffer = async (req, res) => {
  try {
    await db.query(
      "UPDATE trade_offers SET status='cancelled' WHERE id=? AND sender_id=? AND status='pending'",
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Offer cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCoins = async (req, res) => {
  try {
    const [[user]] = await db.query('SELECT coins FROM users WHERE id=?', [req.user.id]);
    res.json({ success: true, coins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTradeHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT th.*, 
        u1.username as seller_name, 
        u2.username as buyer_name
       FROM trade_history th
       JOIN users u1 ON th.seller_id = u1.id
       JOIN users u2 ON th.buyer_id = u2.id
       WHERE th.seller_id=? OR th.buyer_id=?
       ORDER BY th.completed_at DESC LIMIT 20`,
      [req.user.id, req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getListings, getMyListings, createListing, cancelListing,
  getIncomingOffers, getSentOffers, sendOffer, acceptOffer, rejectOffer, cancelOffer,
  getCoins, getTradeHistory
};
