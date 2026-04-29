import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { wishlistAPI, collectionAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import { ListSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { MdDelete, MdAddCircle, MdStar } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const PRIORITY_STYLES = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistAPI.getAll();
      setItems(res.data.data || []);
    } catch { toast.error('Failed to load wishlist'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (id, name) => {
    try {
      await wishlistAPI.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success(`${name} removed from wishlist`);
    } catch { toast.error('Failed to remove'); }
  };

  const handlePriority = async (id, priority) => {
    try {
      await wishlistAPI.updatePriority(id, priority);
      setItems(prev => prev.map(i => i.id === id ? { ...i, priority } : i));
    } catch { toast.error('Failed to update priority'); }
  };

  const handleAddToCollection = async (item) => {
    try {
      await collectionAPI.add({
        card_id: item.card_id, card_name: item.card_name, card_image: item.card_image,
        card_rarity: item.card_rarity, card_set_name: item.card_set_name,
      });
      toast.success(`${item.card_name} added to collection! 🎴`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-5 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-white font-poppins">Wishlist</h1>
        <p className="text-white/40 text-sm mt-1">{items.length} cards on your list</p>
      </div>

      {loading ? <ListSkeleton rows={5} /> : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-4 hover:border-neon-purple/20 border border-white/5 transition-all"
            >
              {item.card_image ? (
                <img src={item.card_image} alt={item.card_name} className="w-12 h-16 object-contain rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-16 bg-navy-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🃏</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{item.card_name}</h3>
                <p className="text-xs text-white/40">{item.card_rarity} · {item.card_set_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/40">Priority:</span>
                  {['high','medium','low'].map(p => (
                    <button key={p} onClick={() => handlePriority(item.id, p)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border capitalize transition-all ${item.priority === p ? PRIORITY_STYLES[p] : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleAddToCollection(item)}
                  className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/40 transition-colors border border-neon-purple/20"
                  title="Add to collection">
                  <MdAddCircle className="text-lg" />
                </button>
                <button onClick={() => handleRemove(item.id, item.card_name)}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Remove">
                  <MdDelete className="text-lg" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="⭐" title="Your wishlist is empty"
          description="Find cards you want and add them to your wishlist"
          action={{ label: 'Browse Cards', onClick: () => navigate('/search') }}
        />
      )}
    </div>
  );
}
