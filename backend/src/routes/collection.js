// collection.js
const express = require('express');
const router = express.Router();
const { getCollection, addCard, updateCard, removeCard, getStats } = require('../controllers/collectionController');
const auth = require('../middleware/auth');

router.get('/', auth, getCollection);
router.get('/stats', auth, getStats);
router.post('/', auth, addCard);
router.put('/:id', auth, updateCard);
router.delete('/:id', auth, removeCard);

module.exports = router;
