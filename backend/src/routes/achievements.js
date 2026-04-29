const express = require('express');
const router = express.Router();
const { getAchievements } = require('../controllers/achievementController');
const auth = require('../middleware/auth');

router.get('/', auth, getAchievements);

module.exports = router;
