import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collectionAPI } from '../services/api';
import CardItem from '../components/cards/CardItem';
import CardDetailModal from '../components/modals/CardDetailModal';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { MdSearch, MdFilterList, MdGridView, MdViewList } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'alphabet', label: 'A–Z' },
  { value: 'rarity', label: 'Rarity' },
];

export default function Collection() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedCard, setSelectedCard] = useState(null);
  const [view, setView] = useState('grid');
  const navigate = useNavigate();

  const fetchCollection = async (params = {}) => {
    setLoading(true);
    try {
      const res = await collectionAPI.getAll(params);
      setCards(res.data.data || []);
    } catch {
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollection({ sort }); }, [sort]);

  useEffect(() => {
    const t = setTimeout(() => fetchCollection({ search, sort }), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleFavorite = async (card) => {
    try {
      await collectionAPI.update(card.id, { ...card, is_favorite: card.is_favorite ? 0 : 1 });
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_favorite: c.is_favorite ? 0 : 1 } : c));
      toast.success(card.is_favorite ? 'Removed from favorites' : 'Added to favorites ❤️');
    } catch { toast.error('Failed to update'); }
  };

  const handleRemove = async (card) => {
    if (!confirm(`Remove ${card.card_name} from collection?`)) return;
    try {
      await collectionAPI.remove(card.id);
      setCards(prev => prev.filter(c => c.id !== card.id));
      toast.success('Card removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-5 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins">My Collection</h1>
          <p className="text-white/40 text-sm mt-1">{cards.length} cards collected</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2.5 rounded-xl bg-navy-800 border border-white/10 text-white/50 hover:text-white transition-colors">
            {view === 'grid' ? <MdViewList className="text-xl" /> : <MdGridView className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
          <input type="text" placeholder="Search collection..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-glass pl-11" />
        </div>
        <div className="flex gap-2">
          {SORTS.map(s => (
            <button key={s.value} onClick={() => setSort(s.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${sort === s.value ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple' : 'bg-navy-800 border-white/10 text-white/50 hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : cards.length > 0 ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {cards.map(card => (
            <CardItem
              key={card.id} card={{ ...card, name: card.card_name, images: { large: card.card_image }, types: [card.card_type], set: { name: card.card_set_name }, rarity: card.card_rarity, hp: card.card_hp }}
              onDetail={() => setSelectedCard(card)}
              onFavorite={handleFavorite}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📦" title="Your collection is empty"
          description="Start adding Pokémon cards to your collection!"
          action={{ label: 'Search Cards', onClick: () => navigate('/search') }}
        />
      )}

      {selectedCard && (
        <CardDetailModal card={{
          ...selectedCard, name: selectedCard.card_name, images: { large: selectedCard.card_image },
          types: [selectedCard.card_type], set: { name: selectedCard.card_set_name, images: { logo: selectedCard.card_set_logo } },
          rarity: selectedCard.card_rarity, hp: selectedCard.card_hp, artist: selectedCard.card_artist,
        }} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
