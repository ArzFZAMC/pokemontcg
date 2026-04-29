const express = require('express');
const router = express.Router();
const { searchCards, getCardById, getSets, getTypes, getRarities } = require('../controllers/cardsController');
const auth = require('../middleware/auth');

router.get('/', auth, searchCards);
router.get('/sets', auth, getSets);
router.get('/types', auth, getTypes);
router.get('/rarities', auth, getRarities);
router.get('/:id', auth, getCardById);

module.exports = router;
