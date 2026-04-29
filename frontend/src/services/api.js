import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pdex_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('pdex_token');
      localStorage.removeItem('pdex_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Cards (Pokemon TCG API via backend proxy)
export const cardsAPI = {
  search: (params) => API.get('/cards', { params }),
  getById: (id) => API.get(`/cards/${id}`),
  getSets: () => API.get('/cards/sets'),
  getTypes: () => API.get('/cards/types'),
  getRarities: () => API.get('/cards/rarities'),
};

// Collection
export const collectionAPI = {
  getAll: (params) => API.get('/collection', { params }),
  getStats: () => API.get('/collection/stats'),
  add: (data) => API.post('/collection', data),
  update: (id, data) => API.put(`/collection/${id}`, data),
  remove: (id) => API.delete(`/collection/${id}`),
};

// Wishlist
export const wishlistAPI = {
  getAll: () => API.get('/wishlist'),
  add: (data) => API.post('/wishlist', data),
  updatePriority: (id, priority) => API.put(`/wishlist/${id}`, { priority }),
  remove: (id) => API.delete(`/wishlist/${id}`),
};

// Decks
export const deckAPI = {
  getAll: () => API.get('/decks'),
  create: (data) => API.post('/decks', data),
  update: (id, data) => API.put(`/decks/${id}`, data),
  delete: (id) => API.delete(`/decks/${id}`),
  addCard: (deckId, data) => API.post(`/decks/${deckId}/cards`, data),
  removeCard: (deckId, cardId) => API.delete(`/decks/${deckId}/cards/${cardId}`),
};

// Achievements
export const achievementsAPI = {
  getAll: () => API.get('/achievements'),
};

export default API;
