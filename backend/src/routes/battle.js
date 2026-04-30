const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBattleStats, createRoom, joinRoom, getRoom, submitCards } = require('../controllers/battleController');

router.get('/stats', auth, getBattleStats);
router.post('/room', auth, createRoom);
router.post('/room/join', auth, joinRoom);
router.get('/room/:id', auth, getRoom);
router.post('/cards/submit', auth, submitCards);

module.exports = router;
