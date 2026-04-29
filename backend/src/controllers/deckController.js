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

const getDecks = async (req, res) => {
  try {
    const [decks] = await db.query(
      'SELECT * FROM decks WHERE user_id=? ORDER BY updated_at DESC',
      [req.user.id]
    );
    for (const deck of decks) {
      const [cards] = await db.query('SELECT * FROM deck_cards WHERE deck_id=?', [deck.id]);
      deck.cards = cards;
      deck.total_cards = cards.reduce((sum, c) => sum + c.quantity, 0);
    }
    res.json({ success: true, data: decks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDeck = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO decks (user_id, name, description) VALUES (?,?,?)',
      [req.user.id, name, description]
    );
    res.status(201).json({ success: true, message: 'Deck created', deck_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDeck = async (req, res) => {
  try {
    const { name, description } = req.body;
    await db.query(
      'UPDATE decks SET name=?, description=?, updated_at=NOW() WHERE id=? AND user_id=?',
      [name, description, req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Deck updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDeck = async (req, res) => {
  try {
    await db.query('DELETE FROM decks WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Deck deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addCardToDeck = async (req, res) => {
  try {
    const { card_id, card_name, card_image, card_type, card_rarity, card_data, quantity } = req.body;

    const [deck] = await db.query(
      'SELECT * FROM decks WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!deck.length) return res.status(404).json({ success: false, message: 'Deck not found' });

    await db.query(
      `INSERT INTO deck_cards (deck_id, card_id, card_name, card_image, card_type, card_rarity, card_data, quantity)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)`,
      [
        req.params.id, card_id, card_name, card_image, card_type, card_rarity,
        safeJsonStringify(card_data),
        quantity || 1
      ]
    );

    if (!deck[0].cover_card_image && card_image) {
      await db.query(
        'UPDATE decks SET cover_card_image=?, cover_card_name=?, updated_at=NOW() WHERE id=?',
        [card_image, card_name, req.params.id]
      );
    } else {
      await db.query('UPDATE decks SET updated_at=NOW() WHERE id=?', [req.params.id]);
    }

    res.json({ success: true, message: 'Card added to deck' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeCardFromDeck = async (req, res) => {
  try {
    const [deck] = await db.query(
      'SELECT * FROM decks WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!deck.length) return res.status(404).json({ success: false, message: 'Deck not found' });

    const [cardRow] = await db.query(
      'SELECT * FROM deck_cards WHERE id=? AND deck_id=?',
      [req.params.cardId, req.params.id]
    );

    await db.query(
      'DELETE FROM deck_cards WHERE id=? AND deck_id=?',
      [req.params.cardId, req.params.id]
    );

    if (cardRow.length && deck[0].cover_card_image === cardRow[0].card_image) {
      const [remaining] = await db.query(
        'SELECT * FROM deck_cards WHERE deck_id=? AND card_image IS NOT NULL LIMIT 1',
        [req.params.id]
      );
      if (remaining.length) {
        await db.query(
          'UPDATE decks SET cover_card_image=?, cover_card_name=? WHERE id=?',
          [remaining[0].card_image, remaining[0].card_name, req.params.id]
        );
      } else {
        await db.query(
          'UPDATE decks SET cover_card_image=NULL, cover_card_name=NULL WHERE id=?',
          [req.params.id]
        );
      }
    }

    res.json({ success: true, message: 'Card removed from deck' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDecks, createDeck, updateDeck, deleteDeck, addCardToDeck, removeCardFromDeck };