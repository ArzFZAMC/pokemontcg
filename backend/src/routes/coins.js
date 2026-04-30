const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDailyStatus, claimDailyReward,
  getPackages, purchaseCoins,
  getPurchaseHistory, getDailyHistory,
} = require('../controllers/coinController');

router.get('/daily', auth, getDailyStatus);
router.post('/daily/claim', auth, claimDailyReward);
router.get('/packages', auth, getPackages);
router.post('/purchase', auth, purchaseCoins);
router.get('/history/purchases', auth, getPurchaseHistory);
router.get('/history/daily', auth, getDailyHistory);

module.exports = router;
