const express = require('express');
const router = express.Router();
const { getDecks, createDeck, updateDeck, deleteDeck, addCardToDeck, removeCardFromDeck } = require('../controllers/deckController');
const auth = require('../middleware/auth');

router.get('/', auth, getDecks);
router.post('/', auth, createDeck);
router.put('/:id', auth, updateDeck);
router.delete('/:id', auth, deleteDeck);
router.post('/:id/cards', auth, addCardToDeck);
router.delete('/:id/cards/:cardId', auth, removeCardFromDeck);

module.exports = router;
