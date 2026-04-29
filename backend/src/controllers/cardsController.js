const axios = require('axios');

const POKEMON_API = 'https://api.pokemontcg.io/v2';
const headers = process.env.POKEMON_TCG_API_KEY ? { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY } : {};

const searchCards = async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20, orderBy } = req.query;
    const params = { page, pageSize };
    if (q) params.q = q;
    if (orderBy) params.orderBy = orderBy;

    const response = await axios.get(`${POKEMON_API}/cards`, { params, headers });
    res.json({ success: true, ...response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cards', error: err.message });
  }
};

const getCardById = async (req, res) => {
  try {
    const response = await axios.get(`${POKEMON_API}/cards/${req.params.id}`, { headers });
    res.json({ success: true, data: response.data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Card not found', error: err.message });
  }
};

const getSets = async (req, res) => {
  try {
    const response = await axios.get(`${POKEMON_API}/sets`, { headers, params: { orderBy: '-releaseDate', pageSize: 250 } });
    res.json({ success: true, data: response.data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sets', error: err.message });
  }
};

const getTypes = async (req, res) => {
  try {
    const response = await axios.get(`${POKEMON_API}/types`, { headers });
    res.json({ success: true, data: response.data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch types', error: err.message });
  }
};

const getRarities = async (req, res) => {
  try {
    const response = await axios.get(`${POKEMON_API}/rarities`, { headers });
    res.json({ success: true, data: response.data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch rarities', error: err.message });
  }
};

module.exports = { searchCards, getCardById, getSets, getTypes, getRarities };
