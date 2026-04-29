import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cardsAPI, wishlistAPI } from '../services/api';
import CardItem from '../components/cards/CardItem';
import CardDetailModal from '../components/modals/CardDetailModal';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { MdSearch, MdFilterList, MdClose } from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

const TYPES = ['Fire','Water','Grass','Electric','Psychic','Fighting','Darkness','Metal','Dragon','Fairy','Colorless'];

const RARITIES = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo',
  'Rare Holo EX', 'Rare Holo GX', 'Rare Holo V',
  'Rare Holo VMAX', 'Rare Holo VSTAR', 'Rare Ultra',
  'Rare Rainbow', 'Rare Secret', 'Rare Shining',
  'Rare Shiny', 'Rare Shiny GX', 'Amazing Rare', 'LEGEND', 'Promo',
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filters, setFilters] = useState({ type: '', rarity: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q, f, p = 1) => {
    if (!q.trim() && !f.type && !f.rarity) { setCards([]); return; }
    setLoading(true);
    try {
      const parts = [];
      if (q.trim()) parts.push(`name:"${q.trim()}*"`);
      if (f.type) parts.push(`types:${f.type}`);
      if (f.rarity) parts.push(`rarity:"${f.rarity}"`);
      const res = await cardsAPI.search({ q: parts.join(' '), page: p, pageSize: 20 });
      if (p === 1) setCards(res.data.data || []);
      else setCards(prev => [...prev, ...(res.data.data || [])]);
      setHasMore((res.data.data?.length || 0) === 20);
      setPage(p);
    } catch {
      toast.error('Failed to search cards');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, filters, 1), 500);
  };

  const handleFilterChange = (key, val) => {
    const newF = { ...filters, [key]: val };
    setFilters(newF);
    doSearch(query, newF, 1);
  };

  const handleAddWishlist = async (card) => {
    try {
      await wishlistAPI.add({
        card_id: card.id,
        card_name: card.name,
        card_image: card.images?.large || card.images?.small,
        card_rarity: card.rarity,
        card_set_name: card.set?.name,
        card_data: card,
      });
      toast.success(`${card.name} added to wishlist! ⭐`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-poppins">Search Cards</h1>
        <p className="text-white/40 text-sm mt-1">Browse any Pokémon TCG card</p>
      </div>

      {/* Gacha-only notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl border border-neon-purple/30 bg-neon-purple/5"
      >
        <GiCardPickup className="text-neon-purple text-2xl flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Cards obtained via Pack Opening only</p>
          <p className="text-xs text-white/40 mt-0.5">
            You can wishlist cards here, then get them through the{' '}
            <span className="text-neon-purple font-medium">Pack Simulator</span> or{' '}
            <span className="text-neon-blue font-medium">Trade</span> system.
          </p>
        </div>
      </motion.div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
          <input
            type="text"
            placeholder="Search by name… e.g. Charizard"
            value={query}
            onChange={handleInput}
            className="input-glass pl-11 pr-4"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setCards([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <MdClose />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`px-4 py-3 rounded-xl border transition-all ${showFilters
            ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
            : 'bg-navy-800 border-white/10 text-white/50 hover:text-white'}`}
        >
          <MdFilterList className="text-xl" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Type</label>
              <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="input-glass text-sm">
                <option value="">All Types</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-2 block">Rarity</label>
              <select value={filters.rarity} onChange={e => handleFilterChange('rarity', e.target.value)} className="input-glass text-sm">
                <option value="">All Rarities</option>
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {(filters.type || filters.rarity) && (
            <button
              onClick={() => { setFilters({ type: '', rarity: '' }); doSearch(query, { type: '', rarity: '' }, 1); }}
              className="text-xs text-neon-purple hover:text-neon-blue transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Results */}
      {loading && cards.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : cards.length > 0 ? (
        <>
          <p className="text-white/40 text-sm">{cards.length} cards found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map(card => (
              <CardItem
                key={card.id}
                card={card}
                onDetail={setSelectedCard}
                onAdd={handleAddWishlist}
                addLabel="+ Wishlist"
                showActions={true}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => doSearch(query, filters, page + 1)}
                disabled={loading}
                className="neon-btn px-8 text-sm disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : query || filters.type || filters.rarity ? (
        <EmptyState icon="🔍" title="No cards found" description="Try a different name or adjust your filters" />
      ) : (
        <EmptyState icon="✨" title="Search for cards" description="Type a Pokémon name to browse the TCG database" />
      )}

      {/* Card detail modal — wishlist only, no add to collection */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onAddWishlist={handleAddWishlist}
          // onAddCollection intentionally omitted
        />
      )}
    </div>
  );
}
