import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collectionAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';
import { StatSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import CardDetailModal from '../components/modals/CardDetailModal';
import { MdCollections, MdFavorite, MdStar, MdTrendingUp, MdLocalFireDepartment } from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    collectionAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topType = stats?.stats?.typeStats?.[0];
  const topRarity = stats?.stats?.rarityStats?.[0];

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl lg:text-3xl font-bold text-white font-poppins"
          >
            Hey, <span className="glow-text-purple">{user?.username}</span>! 👋
          </motion.h1>
          <p className="text-white/40 text-sm mt-1">Your TCG Dashboard</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-neon-purple animate-glow-pulse">
          <GiCardPickup className="text-white text-2xl" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={MdCollections} label="Total Cards" value={stats?.stats?.total || 0} color="purple" delay={0} />
            <StatCard icon={MdFavorite} label="Favorites" value={stats?.stats?.favorites || 0} color="pink" delay={0.1} />
            <StatCard icon={MdStar} label="Top Rarity" value={topRarity?.card_rarity || '—'} sub={topRarity ? `${topRarity.count} cards` : ''} color="gold" delay={0.2} />
            <StatCard icon={MdLocalFireDepartment} label="Top Type" value={topType?.card_type || '—'} sub={topType ? `${topType.count} cards` : ''} color="blue" delay={0.3} />
          </>
        )}
      </div>

      {/* Collection progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MdTrendingUp className="text-neon-purple" /> Collection Progress
          </h2>
          <span className="text-sm text-white/40">{stats?.stats?.total || 0} / 500</span>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="skeleton h-3 rounded-full w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/60">Overall</span>
                <span className="text-neon-purple font-semibold">{Math.min(100, Math.round((stats?.stats?.total || 0) / 500 * 100))}%</span>
              </div>
              <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((stats?.stats?.total || 0) / 500) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue"
                  style={{ boxShadow: '0 0 10px rgba(180,77,255,0.5)' }}
                />
              </div>
              {/* Type breakdown */}
              {stats?.stats?.typeStats?.slice(0, 4).map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50">{t.card_type || 'Unknown'}</span>
                    <span className="text-white/70">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (t.count / (stats?.stats?.total || 1)) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan"
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* Two-column: recent + favorites */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recently Added</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : stats?.recent?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => setSelectedCard(card)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-navy-700/40 hover:bg-navy-700/80 cursor-pointer transition-all group border border-white/5 hover:border-neon-purple/20"
                >
                  {card.card_image ? (
                    <img src={card.card_image} alt={card.card_name} className="w-10 h-14 object-contain rounded-lg" />
                  ) : (
                    <div className="w-10 h-14 bg-navy-600 rounded-lg flex items-center justify-center text-xl">🃏</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{card.card_name}</p>
                    <p className="text-xs text-white/40">{card.card_rarity}</p>
                  </div>
                  <span className="text-xs text-neon-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">No cards yet. Start collecting!</p>
          )}
        </motion.div>

        {/* Favorites */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MdFavorite className="text-red-400" /> Favorites
          </h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton aspect-[3/4] rounded-xl" />)}
            </div>
          ) : stats?.favoriteCards?.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {stats.favoriteCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedCard(card)}
                  className="cursor-pointer group relative rounded-xl overflow-hidden border border-red-500/20 hover:border-red-400/40 transition-all"
                >
                  {card.card_image ? (
                    <img src={card.card_image} alt={card.card_name} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-navy-700 flex items-center justify-center text-3xl">🃏</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-6">No favorites yet!</p>
          )}
        </motion.div>
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
