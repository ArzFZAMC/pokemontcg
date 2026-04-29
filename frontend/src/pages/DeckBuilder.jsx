import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deckAPI, cardsAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdViewModule } from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

// ── Modal buat / edit deck ─────────────────────────────────────
function DeckModal({ deck, onSave, onClose }) {
  const [name, setName] = useState(deck?.name || '');
  const [desc, setDesc] = useState(deck?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Enter a deck name');
    setLoading(true);
    try { await onSave({ name, description: desc }); onClose(); }
    catch { toast.error('Failed to save deck'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card neon-border p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">{deck ? 'Edit Deck' : 'New Deck'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><MdClose /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Deck name" value={name}
            onChange={e => setName(e.target.value)} className="input-glass" />
          <textarea placeholder="Description (optional)" value={desc}
            onChange={e => setDesc(e.target.value)} className="input-glass h-20 resize-none" />
          <button onClick={handleSave} disabled={loading} className="neon-btn w-full text-center text-sm">
            {loading ? 'Saving...' : 'Save Deck'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal tambah kartu ke deck ─────────────────────────────────
function AddCardModal({ deckId, onAdded, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await cardsAPI.search({ q: `name:"${q.trim()}*"`, pageSize: 12 });
      setResults(res.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  const addCard = async (card) => {
    try {
      await deckAPI.addCard(deckId, {
        card_id: card.id, card_name: card.name,
        card_image: card.images?.large || card.images?.small,
        card_type: card.types?.[0], card_rarity: card.rarity,
        card_data: card, quantity: 1,
      });
      toast.success(`${card.name} added to deck!`);
      onAdded();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card neon-border p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add Card to Deck</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><MdClose /></button>
        </div>
        <div className="relative mb-4">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
          <input type="text" placeholder="Search Pokémon..." value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value); }}
            className="input-glass pl-10" />
        </div>
        <div className="overflow-y-auto flex-1 grid grid-cols-3 gap-3">
          {loading && <div className="col-span-3 text-center text-white/40 py-8">Searching...</div>}
          {results.map(card => (
            <button key={card.id} onClick={() => addCard(card)}
              className="glass-card p-2 text-left hover:border-neon-purple/30 border border-white/5 transition-all group">
              {card.images?.small && (
                <img src={card.images.small} alt={card.name} className="w-full rounded-lg mb-2" />
              )}
              <p className="text-xs text-white/70 truncate group-hover:text-white">{card.name}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Deck Card (list kiri) dengan cover ─────────────────────────
function DeckCard({ deck, isActive, onSelect, onEdit, onDelete }) {
  return (
    <motion.button
      onClick={() => onSelect(deck)}
      className={`w-full text-left transition-all border rounded-2xl overflow-hidden
        ${isActive ? 'border-neon-purple/50' : 'border-white/5 hover:border-white/20'}`}
    >
      {/* Cover image area */}
      <div className="relative h-28 bg-navy-700 overflow-hidden">
        {deck.cover_card_image ? (
          <img
            src={deck.cover_card_image} alt={deck.cover_card_name || deck.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MdViewModule className="text-4xl text-white/10" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
        {/* Active indicator */}
        {isActive && (
          <div className="absolute inset-0 border-2 border-neon-purple/50 rounded-none pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(180,77,255,0.2)' }} />
        )}
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(deck)}
            className="w-7 h-7 bg-navy-900/80 rounded-lg flex items-center justify-center text-white/50 hover:text-neon-blue transition-colors">
            <MdEdit className="text-sm" />
          </button>
          <button onClick={() => onDelete(deck.id)}
            className="w-7 h-7 bg-navy-900/80 rounded-lg flex items-center justify-center text-white/50 hover:text-red-400 transition-colors">
            <MdDelete className="text-sm" />
          </button>
        </div>
      </div>

      {/* Deck info */}
      <div className={`p-3 ${isActive ? 'bg-neon-purple/10' : 'bg-navy-800/50'}`}>
        <p className="font-semibold text-white text-sm truncate">{deck.name}</p>
        <p className="text-xs text-white/40 mt-0.5">{deck.total_cards || 0} cards</p>
        {deck.cover_card_name && (
          <p className="text-[10px] text-white/25 truncate mt-0.5">Cover: {deck.cover_card_name}</p>
        )}
      </div>
    </motion.button>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function DeckBuilder() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState(null);
  const [deckModal, setDeckModal] = useState(null);
  const [addCardModal, setAddCardModal] = useState(false);

  const fetchDecks = async () => {
    try {
      const res = await deckAPI.getAll();
      const data = res.data.data || [];
      setDecks(data);
      if (activeDeck) {
        const updated = data.find(d => d.id === activeDeck.id);
        if (updated) setActiveDeck(updated);
      }
    } catch { toast.error('Failed to load decks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDecks(); }, []);

  const handleSaveDeck = async (data) => {
    if (deckModal?.id) {
      await deckAPI.update(deckModal.id, data);
      toast.success('Deck updated');
    } else {
      await deckAPI.create(data);
      toast.success('Deck created! 🃏');
    }
    fetchDecks();
  };

  const handleDeleteDeck = async (id) => {
    if (!confirm('Delete this deck?')) return;
    await deckAPI.delete(id);
    toast.success('Deck deleted');
    if (activeDeck?.id === id) setActiveDeck(null);
    fetchDecks();
  };

  const handleRemoveCard = async (deckId, cardId) => {
    await deckAPI.removeCard(deckId, cardId);
    toast.success('Card removed');
    fetchDecks();
  };

  const typeComposition = activeDeck?.cards?.reduce((acc, c) => {
    const t = c.card_type || 'Unknown';
    acc[t] = (acc[t] || 0) + (c.quantity || 1);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins">Deck Builder</h1>
          <p className="text-white/40 text-sm mt-1">{decks.length} decks created</p>
        </div>
        <button onClick={() => setDeckModal({})} className="neon-btn text-sm flex items-center gap-2">
          <MdAdd className="text-lg" /> New Deck
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Deck list — with cover cards */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Your Decks</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/5 animate-pulse">
                  <div className="h-28 bg-navy-700" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton h-2 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : decks.length > 0 ? (
            <div className="space-y-3">
              {decks.map(deck => (
                <DeckCard
                  key={deck.id} deck={deck}
                  isActive={activeDeck?.id === deck.id}
                  onSelect={setActiveDeck}
                  onEdit={setDeckModal}
                  onDelete={handleDeleteDeck}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="🃏" title="No decks yet" description="Create your first deck!" />
          )}
        </div>

        {/* Deck detail */}
        <div className="lg:col-span-2">
          {activeDeck ? (
            <div className="space-y-4">
              {/* Deck header with cover */}
              <div className="glass-card overflow-hidden">
                {activeDeck.cover_card_image && (
                  <div className="relative h-32 overflow-hidden">
                    <img src={activeDeck.cover_card_image} alt={activeDeck.cover_card_name}
                      className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">{activeDeck.name}</h2>
                        <p className="text-white/40 text-sm">
                          {activeDeck.total_cards || 0} / 60 cards
                          {activeDeck.cover_card_name && (
                            <span className="ml-2 text-white/25">· Cover: {activeDeck.cover_card_name}</span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => setAddCardModal(true)} className="neon-btn text-sm flex items-center gap-2">
                        <MdAdd /> Add Card
                      </button>
                    </div>
                  </div>
                )}
                {!activeDeck.cover_card_image && (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{activeDeck.name}</h2>
                      <p className="text-white/40 text-sm">{activeDeck.total_cards || 0} / 60 cards</p>
                    </div>
                    <button onClick={() => setAddCardModal(true)} className="neon-btn text-sm flex items-center gap-2">
                      <MdAdd /> Add Card
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="glass-card p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/50">Deck Progress</span>
                  <span className="text-neon-purple">{Math.min(100, Math.round((activeDeck.total_cards || 0) / 60 * 100))}%</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((activeDeck.total_cards || 0) / 60) * 100)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue"
                  />
                </div>
                {Object.keys(typeComposition).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(typeComposition).map(([type, count]) => (
                      <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-navy-700 text-white/60 border border-white/10">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cards grid */}
              {activeDeck.cards?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {activeDeck.cards.map(card => (
                    <div key={card.id} className="relative group">
                      <div className={`glass-card overflow-hidden rounded-xl border transition-all
                        ${activeDeck.cover_card_image === card.card_image
                          ? 'border-neon-gold/40'
                          : 'border-white/5 hover:border-neon-purple/20'}`}
                      >
                        {card.card_image ? (
                          <img src={card.card_image} alt={card.card_name} className="w-full aspect-[3/4] object-cover" />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-navy-700 flex items-center justify-center text-3xl">🃏</div>
                        )}
                        <div className="p-2">
                          <p className="text-[10px] text-white/60 truncate">{card.card_name}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-neon-purple">×{card.quantity}</p>
                            {activeDeck.cover_card_image === card.card_image && (
                              <span className="text-[8px] text-neon-gold">★ Cover</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCard(activeDeck.id, card.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MdClose className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="➕" title="No cards in deck"
                  description="Add cards to build your deck. The first card added becomes the cover!" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <EmptyState icon="🃏" title="Select a deck" description="Choose a deck from the list to view and edit it" />
            </div>
          )}
        </div>
      </div>

      {deckModal !== null && (
        <DeckModal
          deck={Object.keys(deckModal).length ? deckModal : null}
          onSave={handleSaveDeck}
          onClose={() => setDeckModal(null)}
        />
      )}
      {addCardModal && activeDeck && (
        <AddCardModal
          deckId={activeDeck.id}
          onAdded={() => { fetchDecks(); }}
          onClose={() => setAddCardModal(false)}
        />
      )}
    </div>
  );
}
