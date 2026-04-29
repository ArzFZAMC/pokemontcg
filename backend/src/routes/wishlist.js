const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, updatePriority } = require('../controllers/wishlistController');
const auth = require('../middleware/auth');

router.get('/', auth, getWishlist);
router.post('/', auth, addToWishlist);
router.put('/:id', auth, updatePriority);
router.delete('/:id', auth, removeFromWishlist);

module.exports = router;
