const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getListings, getMyListings, createListing, cancelListing,
  getIncomingOffers, getSentOffers, sendOffer, acceptOffer, rejectOffer, cancelOffer,
  getCoins, getTradeHistory
} = require('../controllers/tradeController');

// Marketplace
router.get('/listings', auth, getListings);
router.get('/listings/mine', auth, getMyListings);
router.post('/listings', auth, createListing);
router.delete('/listings/:id', auth, cancelListing);

// Offers
router.get('/offers/incoming', auth, getIncomingOffers);
router.get('/offers/sent', auth, getSentOffers);
router.post('/offers', auth, sendOffer);
router.put('/offers/:id/accept', auth, acceptOffer);
router.put('/offers/:id/reject', auth, rejectOffer);
router.delete('/offers/:id', auth, cancelOffer);

// Coins & History
router.get('/coins', auth, getCoins);
router.get('/history', auth, getTradeHistory);

module.exports = router;
