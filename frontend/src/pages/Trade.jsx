import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collectionAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  MdAdd, MdClose, MdSwapHoriz, MdMonetizationOn,
  MdCheck, MdBlock, MdInbox, MdSend, MdStorefront,
  MdHistory, MdSearch, MdPerson
} from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';
import EmptyState from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/ui/Skeleton';
import axios from 'axios';

// Axios instance with auth
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pdex_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const tradeAPI = {
  getListings: (params) => API.get('/trade/listings', { params }),
  getMyListings: () => API.get('/trade/listings/mine'),
  createListing: (data) => API.post('/trade/listings', data),
  cancelListing: (id) => API.delete(`/trade/listings/${id}`),
  getIncoming: () => API.get('/trade/offers/incoming'),
  getSent: () => API.get('/trade/offers/sent'),
  sendOffer: (data) => API.post('/trade/offers', data),
  acceptOffer: (id) => API.put(`/trade/offers/${id}/accept`),
  rejectOffer: (id) => API.put(`/trade/offers/${id}/reject`),
  cancelOffer: (id) => API.delete(`/trade/offers/${id}`),
  getCoins: () => API.get('/trade/coins'),
  getHistory: () => API.get('/trade/history'),
};

const RARITY_COLOR = {
  'Common': '#9ca3af', 'Uncommon': '#4ade80', 'Rare': '#60a5fa',
  'Rare Holo': '#a855f7', 'Rare Holo EX': '#4d9fff', 'Rare Ultra': '#e879f9',
  'Rare Rainbow': '#ff4dce', 'Rare Secret': '#ffd700',
};

// ── Create Listing Modal ────────────────────────────────────────
function CreateListingModal({ onClose, onCreated }) {
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [tradeType, setTradeType] = useState('both');
  const [coinPrice, setCoinPrice] = useState('');
  const [wantCardName, setWantCardName] = useState('');
  const [wantCardRarity, setWantCardRarity] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    collectionAPI.getAll().then(r => setCollection(r.data.data || []));
  }, []);

  const handleCreate = async () => {
    if (!selectedCard) return toast.error('Select a card to list');
    setLoading(true);
    try {
      await tradeAPI.createListing({
        card_id: selectedCard.card_id,
        card_name: selectedCard.card_name,
        card_image: selectedCard.card_image,
        card_rarity: selectedCard.card_rarity,
        card_set_name: selectedCard.card_set_name,
        card_data: selectedCard.card_data,
        trade_type: tradeType,
        coin_price: coinPrice ? parseInt(coinPrice) : null,
        want_card_name: wantCardName || null,
        want_card_rarity: wantCardRarity || null,
      });
      toast.success('Listing created! 📋');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card neon-border w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Create Trade Listing</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><MdClose /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Step 1: Pick card */}
          <div>
            <p className="text-sm font-semibold text-white/60 mb-3">1. Select card to trade</p>
            {collection.length === 0 ? (
              <p className="text-white/30 text-sm">No cards in collection</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {collection.map(card => (
                  <button key={card.id} onClick={() => setSelectedCard(card)}
                    className={`glass-card p-2 text-left border transition-all rounded-xl overflow-hidden
                      ${selectedCard?.id === card.id ? 'border-neon-purple/60 bg-neon-purple/10' : 'border-white/5 hover:border-white/20'}`}>
                    {card.card_image
                      ? <img src={card.card_image} alt={card.card_name} className="w-full aspect-[3/4] object-cover rounded-lg mb-1" />
                      : <div className="w-full aspect-[3/4] bg-navy-700 rounded-lg mb-1 flex items-center justify-center text-2xl">🃏</div>
                    }
                    <p className="text-[9px] text-white/60 truncate">{card.card_name}</p>
                    <p className="text-[9px]" style={{ color: RARITY_COLOR[card.card_rarity] || '#9ca3af' }}>
                      {card.card_rarity}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCard && (
            <>
              {/* Step 2: Trade type */}
              <div>
                <p className="text-sm font-semibold text-white/60 mb-3">2. Trade type</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'coin', label: 'Coins Only', icon: <MdMonetizationOn /> },
                    { val: 'barter', label: 'Card Barter', icon: <MdSwapHoriz /> },
                    { val: 'both', label: 'Both', icon: <GiCardPickup /> },
                  ].map(t => (
                    <button key={t.val} onClick={() => setTradeType(t.val)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all
                        ${tradeType === t.val ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple' : 'bg-navy-700 border-white/10 text-white/50 hover:text-white'}`}>
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin price */}
              {(tradeType === 'coin' || tradeType === 'both') && (
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Coin Price (optional)</label>
                  <div className="relative">
                    <MdMonetizationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-gold text-xl" />
                    <input type="number" placeholder="e.g. 50" value={coinPrice}
                      onChange={e => setCoinPrice(e.target.value)} className="input-glass pl-10 text-sm" min="1" />
                  </div>
                </div>
              )}

              {/* Want card */}
              {(tradeType === 'barter' || tradeType === 'both') && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Wanted card name (optional)</label>
                    <input type="text" placeholder="e.g. Charizard EX" value={wantCardName}
                      onChange={e => setWantCardName(e.target.value)} className="input-glass text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Wanted rarity (optional)</label>
                    <input type="text" placeholder="e.g. Rare Holo EX" value={wantCardRarity}
                      onChange={e => setWantCardRarity(e.target.value)} className="input-glass text-sm" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-white/10">
          <button onClick={handleCreate} disabled={!selectedCard || loading}
            className="neon-btn w-full text-sm disabled:opacity-40">
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Send Offer Modal ───────────────────────────────────────────
function SendOfferModal({ listing, receiverUsername, onClose, onSent }) {
  const [collection, setCollection] = useState([]);
  const [offerType, setOfferType] = useState('coin');
  const [coinAmount, setCoinAmount] = useState('');
  const [offerCard, setOfferCard] = useState(null);
  const [message, setMessage] = useState('');
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    collectionAPI.getAll().then(r => setCollection(r.data.data || []));
    tradeAPI.getCoins().then(r => setCoins(r.data.coins));
  }, []);

  const handleSend = async () => {
    setLoading(true);
    try {
      await tradeAPI.sendOffer({
        listing_id: listing?.id || null,
        receiver_username: receiverUsername || null,
        offer_type: offerType,
        coin_amount: coinAmount ? parseInt(coinAmount) : 0,
        offer_card_id: offerCard?.card_id || null,
        offer_card_name: offerCard?.card_name || null,
        offer_card_image: offerCard?.card_image || null,
        offer_card_data: offerCard?.card_data || null,
        message,
      });
      toast.success('Offer sent! 📨');
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card neon-border w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Send Offer</h3>
            {listing && <p className="text-xs text-white/40 mt-0.5">For: {listing.card_name}</p>}
            {receiverUsername && <p className="text-xs text-white/40 mt-0.5">To: @{receiverUsername}</p>}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><MdClose /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Coins balance */}
          <div className="flex items-center gap-2 p-3 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
            <MdMonetizationOn className="text-neon-gold text-xl" />
            <span className="text-sm text-white/70">Your balance:</span>
            <span className="text-sm font-bold text-neon-gold">{coins} coins</span>
          </div>

          {/* Offer type */}
          <div>
            <p className="text-xs text-white/50 mb-2">Offer type</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'coin', label: 'Coins', icon: <MdMonetizationOn /> },
                { val: 'barter', label: 'Barter', icon: <MdSwapHoriz /> },
                { val: 'both', label: 'Both', icon: <GiCardPickup /> },
              ].map(t => (
                <button key={t.val} onClick={() => setOfferType(t.val)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all
                    ${offerType === t.val ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple' : 'bg-navy-700 border-white/10 text-white/50 hover:text-white'}`}>
                  <span className="text-xl">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coin input */}
          {(offerType === 'coin' || offerType === 'both') && (
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Coins to offer</label>
              <div className="relative">
                <MdMonetizationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-gold text-xl" />
                <input type="number" placeholder="Amount" value={coinAmount}
                  onChange={e => setCoinAmount(e.target.value)}
                  className="input-glass pl-10 text-sm" min="1" max={coins} />
              </div>
            </div>
          )}

          {/* Card barter */}
          {(offerType === 'barter' || offerType === 'both') && (
            <div>
              <label className="text-xs text-white/50 mb-2 block">Select card to offer</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {collection.map(card => (
                  <button key={card.id} onClick={() => setOfferCard(card)}
                    className={`glass-card p-1.5 border rounded-xl transition-all
                      ${offerCard?.id === card.id ? 'border-neon-purple/60 bg-neon-purple/10' : 'border-white/5 hover:border-white/20'}`}>
                    {card.card_image
                      ? <img src={card.card_image} alt={card.card_name} className="w-full aspect-[3/4] object-cover rounded-lg mb-1" />
                      : <div className="w-full aspect-[3/4] bg-navy-700 rounded-lg mb-1 flex items-center justify-center text-xl">🃏</div>
                    }
                    <p className="text-[9px] text-white/60 truncate">{card.card_name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Message (optional)</label>
            <textarea placeholder="Say something to the seller..." value={message}
              onChange={e => setMessage(e.target.value)}
              className="input-glass h-16 resize-none text-sm" />
          </div>
        </div>

        <div className="p-5 border-t border-white/10">
          <button onClick={handleSend} disabled={loading}
            className="neon-btn w-full text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            <MdSend /> {loading ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Trade Page ────────────────────────────────────────────
const TABS = [
  { key: 'marketplace', label: 'Marketplace', icon: MdStorefront },
  { key: 'incoming', label: 'Incoming', icon: MdInbox },
  { key: 'sent', label: 'Sent', icon: MdSend },
  { key: 'my_listings', label: 'My Listings', icon: MdPerson },
  { key: 'history', label: 'History', icon: MdHistory },
];

export default function Trade() {
  const [tab, setTab] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [history, setHistory] = useState([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [offerModal, setOfferModal] = useState(null); // { listing } or { username }
  const [directUser, setDirectUser] = useState('');
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [l, ml, inc, snt, hist, c] = await Promise.all([
        tradeAPI.getListings({ search }),
        tradeAPI.getMyListings(),
        tradeAPI.getIncoming(),
        tradeAPI.getSent(),
        tradeAPI.getHistory(),
        tradeAPI.getCoins(),
      ]);
      setListings(l.data.data || []);
      setMyListings(ml.data.data || []);
      setIncoming(inc.data.data || []);
      setSent(snt.data.data || []);
      setHistory(hist.data.data || []);
      setCoins(c.data.coins);
    } catch { toast.error('Failed to load trade data'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAccept = async (id) => {
    try {
      await tradeAPI.acceptOffer(id);
      toast.success('Trade completed! 🎉');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    await tradeAPI.rejectOffer(id);
    toast.success('Offer rejected');
    fetchAll();
  };

  const handleCancelOffer = async (id) => {
    await tradeAPI.cancelOffer(id);
    toast.success('Offer cancelled');
    fetchAll();
  };

  const handleCancelListing = async (id) => {
    await tradeAPI.cancelListing(id);
    toast.success('Listing cancelled');
    fetchAll();
  };

  const incomingCount = incoming.length;

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins">Trade Center</h1>
          <p className="text-white/40 text-sm mt-1">Trade cards with other trainers</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Coin balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-gold/10 border border-neon-gold/20">
            <MdMonetizationOn className="text-neon-gold text-lg" />
            <span className="text-sm font-bold text-neon-gold">{coins}</span>
            <span className="text-xs text-white/40">coins</span>
          </div>
          <button onClick={() => setCreateModal(true)} className="neon-btn text-sm flex items-center gap-2">
            <MdAdd /> New Listing
          </button>
        </div>
      </div>

      {/* Direct trade by username */}
      <div className="glass-card p-4 flex items-center gap-3">
        <MdPerson className="text-neon-purple text-xl flex-shrink-0" />
        <input type="text" placeholder="Trade directly with a player (enter username)..."
          value={directUser} onChange={e => setDirectUser(e.target.value)}
          className="input-glass flex-1 text-sm py-2" />
        <button
          onClick={() => { if (directUser.trim()) setOfferModal({ username: directUser.trim() }); }}
          disabled={!directUser.trim()}
          className="neon-btn text-sm px-4 py-2 disabled:opacity-40">
          Offer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 relative
              ${tab === t.key ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'text-white/40 hover:text-white bg-navy-800/50'}`}>
            <t.icon className="text-base" />
            {t.label}
            {t.key === 'incoming' && incomingCount > 0 && (
              <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
                {incomingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? <ListSkeleton rows={4} /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* ── MARKETPLACE ── */}
            {tab === 'marketplace' && (
              <div className="space-y-4">
                <div className="relative">
                  <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
                  <input type="text" placeholder="Search listings..." value={search}
                    onChange={e => setSearch(e.target.value)} className="input-glass pl-11" />
                </div>
                {listings.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass-card border border-white/5 hover:border-neon-purple/20 transition-all overflow-hidden">
                        {/* Card image */}
                        <div className="relative h-36 bg-navy-700 overflow-hidden">
                          {item.card_image
                            ? <img src={item.card_image} alt={item.card_name} className="w-full h-full object-contain p-2" />
                            : <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-navy-800 to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <p className="text-xs font-bold text-white">{item.card_name}</p>
                            <p className="text-[10px]" style={{ color: RARITY_COLOR[item.card_rarity] || '#9ca3af' }}>
                              {item.card_rarity}
                            </p>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">by</span>
                            <span className="text-xs font-semibold text-neon-blue">@{item.seller_name}</span>
                          </div>
                          {/* Trade terms */}
                          <div className="space-y-1">
                            {item.coin_price && (
                              <div className="flex items-center gap-1.5 text-xs text-neon-gold">
                                <MdMonetizationOn /> {item.coin_price} coins
                              </div>
                            )}
                            {item.want_card_name && (
                              <div className="flex items-center gap-1.5 text-xs text-neon-purple">
                                <MdSwapHoriz /> Wants: {item.want_card_name}
                                {item.want_card_rarity && <span className="text-white/30">({item.want_card_rarity})</span>}
                              </div>
                            )}
                            {!item.coin_price && !item.want_card_name && (
                              <p className="text-xs text-white/30">Open to any offers</p>
                            )}
                          </div>
                          <button onClick={() => setOfferModal({ listing: item })}
                            className="neon-btn w-full text-xs py-2 flex items-center justify-center gap-2">
                            <MdSend className="text-sm" /> Make Offer
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="🏪" title="No listings available" description="Be the first to create a trade listing!" />
                )}
              </div>
            )}

            {/* ── INCOMING OFFERS ── */}
            {tab === 'incoming' && (
              <div className="space-y-3">
                {incoming.length > 0 ? incoming.map((offer, i) => (
                  <motion.div key={offer.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 border border-white/5 space-y-3">
                    <div className="flex items-start gap-3">
                      {offer.offer_card_image && (
                        <img src={offer.offer_card_image} alt={offer.offer_card_name}
                          className="w-12 h-16 object-contain rounded-lg flex-shrink-0 bg-navy-700" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-neon-blue">@{offer.sender_name}</span>
                          <span className="text-xs text-white/30">made an offer</span>
                        </div>
                        {offer.listing_card_name && (
                          <p className="text-xs text-white/50">For your: <span className="text-white">{offer.listing_card_name}</span></p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {offer.coin_amount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-gold/10 text-neon-gold border border-neon-gold/20">
                              💰 {offer.coin_amount} coins
                            </span>
                          )}
                          {offer.offer_card_name && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                              🃏 {offer.offer_card_name}
                            </span>
                          )}
                        </div>
                        {offer.message && (
                          <p className="text-xs text-white/40 italic mt-2">"{offer.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(offer.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
                        <MdCheck /> Accept
                      </button>
                      <button onClick={() => handleReject(offer.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                        <MdBlock /> Reject
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState icon="📭" title="No incoming offers" description="No one has made an offer to you yet" />
                )}
              </div>
            )}

            {/* ── SENT OFFERS ── */}
            {tab === 'sent' && (
              <div className="space-y-3">
                {sent.length > 0 ? sent.map((offer, i) => (
                  <motion.div key={offer.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 border border-white/5 flex items-center gap-4">
                    {offer.offer_card_image && (
                      <img src={offer.offer_card_image} alt={offer.offer_card_name}
                        className="w-10 h-14 object-contain rounded-lg flex-shrink-0 bg-navy-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">To: <span className="text-neon-blue font-semibold">@{offer.receiver_name}</span></p>
                      {offer.listing_card_name && <p className="text-xs text-white/40">For: {offer.listing_card_name}</p>}
                      <div className="flex gap-2 mt-1">
                        {offer.coin_amount > 0 && <span className="text-xs text-neon-gold">💰 {offer.coin_amount}</span>}
                        {offer.offer_card_name && <span className="text-xs text-neon-purple">🃏 {offer.offer_card_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                        ${offer.status === 'pending' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                          : offer.status === 'accepted' ? 'text-green-400 border-green-400/30 bg-green-400/10'
                          : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
                        {offer.status}
                      </span>
                      {offer.status === 'pending' && (
                        <button onClick={() => handleCancelOffer(offer.id)}
                          className="text-xs text-white/30 hover:text-red-400 transition-colors">Cancel</button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState icon="📤" title="No sent offers" description="You haven't sent any trade offers yet" />
                )}
              </div>
            )}

            {/* ── MY LISTINGS ── */}
            {tab === 'my_listings' && (
              <div className="space-y-3">
                {myListings.length > 0 ? myListings.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 border border-white/5 flex items-center gap-4">
                    {item.card_image && (
                      <img src={item.card_image} alt={item.card_name}
                        className="w-10 h-14 object-contain rounded-lg flex-shrink-0 bg-navy-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{item.card_name}</p>
                      <p className="text-xs" style={{ color: RARITY_COLOR[item.card_rarity] || '#9ca3af' }}>{item.card_rarity}</p>
                      <div className="flex gap-2 mt-1">
                        {item.coin_price && <span className="text-xs text-neon-gold">💰 {item.coin_price}</span>}
                        {item.want_card_name && <span className="text-xs text-neon-purple">🔄 {item.want_card_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border
                        ${item.status === 'open' ? 'text-green-400 border-green-400/30 bg-green-400/10'
                          : item.status === 'completed' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                          : 'text-gray-400 border-gray-400/30 bg-gray-400/10'}`}>
                        {item.status}
                      </span>
                      {item.status === 'open' && (
                        <button onClick={() => handleCancelListing(item.id)}
                          className="text-xs text-white/30 hover:text-red-400 transition-colors">Cancel</button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState icon="📋" title="No listings" description="Create a listing to start trading" />
                )}
              </div>
            )}

            {/* ── HISTORY ── */}
            {tab === 'history' && (
              <div className="space-y-3">
                {history.length > 0 ? history.map((h, i) => (
                  <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MdSwapHoriz className="text-neon-purple text-lg" />
                        <span className="text-sm font-semibold text-white">
                          @{h.seller_name} → @{h.buyer_name}
                        </span>
                      </div>
                      <span className="text-xs text-white/30">
                        {new Date(h.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-white/50">
                      {h.card_given_name && <span>🃏 {h.card_given_name}</span>}
                      {h.coins_exchanged > 0 && <span>💰 {h.coins_exchanged} coins</span>}
                      {h.card_received_name && <span>🔄 {h.card_received_name}</span>}
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState icon="📜" title="No trade history" description="Completed trades will appear here" />
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}

      {/* Modals */}
      {createModal && (
        <CreateListingModal onClose={() => setCreateModal(false)} onCreated={fetchAll} />
      )}
      {offerModal && (
        <SendOfferModal
          listing={offerModal.listing || null}
          receiverUsername={offerModal.username || null}
          onClose={() => setOfferModal(null)}
          onSent={fetchAll}
        />
      )}
    </div>
  );
}
