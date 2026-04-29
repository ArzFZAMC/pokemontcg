import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { achievementsAPI } from '../services/api';
import { ListSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const ALL_ACHIEVEMENTS = [
  { key: 'first_catch', name: 'First Catch!', desc: 'Added your first card', icon: '🎴' },
  { key: 'collector', name: 'Collector', desc: 'Collected 10 cards', icon: '📦' },
  { key: 'ghost_collector', name: 'Ghost Collector', desc: 'Collected 50 cards', icon: '👻' },
  { key: 'legendary_owner', name: 'Legendary Owner', desc: 'Collected 100 cards', icon: '🏆' },
  { key: 'ex_hunter', name: 'EX Hunter', desc: 'Obtained an EX card', icon: '⚡' },
  { key: 'deck_master', name: 'Deck Master', desc: 'Created your first deck', icon: '🃏' },
];

export default function Achievements() {
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    achievementsAPI.getAll()
      .then(res => setUnlocked(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedKeys = new Set(unlocked.map(a => a.achievement_key));

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-white font-poppins">Achievements</h1>
        <p className="text-white/40 text-sm mt-1">{unlocked.length} / {ALL_ACHIEVEMENTS.length} unlocked</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Overall Progress</span>
          <span className="text-neon-purple font-semibold">{Math.round(unlocked.length / ALL_ACHIEVEMENTS.length * 100)}%</span>
        </div>
        <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlocked.length / ALL_ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-gold"
            style={{ boxShadow: '0 0 10px rgba(180,77,255,0.5)' }}
          />
        </div>
      </div>

      {loading ? <ListSkeleton rows={6} /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {ALL_ACHIEVEMENTS.map((ach, i) => {
            const isUnlocked = unlockedKeys.has(ach.key);
            const data = unlocked.find(a => a.achievement_key === ach.key);
            return (
              <motion.div
                key={ach.key}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`glass-card p-5 border transition-all ${isUnlocked ? 'border-neon-gold/30 bg-gradient-to-br from-neon-gold/5 to-transparent' : 'border-white/5 opacity-50'}`}
                style={isUnlocked ? { boxShadow: '0 0 20px rgba(255,215,0,0.1)' } : {}}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isUnlocked ? 'bg-gradient-to-br from-neon-gold/20 to-neon-purple/20 border border-neon-gold/20' : 'bg-navy-700'}`}>
                    {isUnlocked ? ach.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-white/40'}`}>{ach.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{ach.desc}</p>
                    {isUnlocked && data?.unlocked_at && (
                      <p className="text-[10px] text-neon-gold/60 mt-1">
                        Unlocked {new Date(data.unlocked_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isUnlocked && (
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, delay: i * 0.1 }}>
                      <span className="text-xl">✨</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
