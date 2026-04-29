const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/collection', require('./routes/collection'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/decks', require('./routes/decks'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/trade', require('./routes/trade'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', version: '1.0.0', app: 'PocketDex TCG' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 PocketDex API running on port ${PORT}`));
