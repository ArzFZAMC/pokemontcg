import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color = 'purple', delay = 0, sub }) {
  const colors = {
    purple: { bg: 'from-neon-purple/20 to-transparent', border: 'border-neon-purple/20', text: 'text-neon-purple', glow: 'shadow-neon-purple' },
    blue: { bg: 'from-neon-blue/20 to-transparent', border: 'border-neon-blue/20', text: 'text-neon-blue', glow: 'shadow-neon-blue' },
    gold: { bg: 'from-neon-gold/20 to-transparent', border: 'border-neon-gold/20', text: 'text-neon-gold', glow: '' },
    pink: { bg: 'from-neon-pink/20 to-transparent', border: 'border-neon-pink/20', text: 'text-neon-pink', glow: '' },
    cyan: { bg: 'from-neon-cyan/20 to-transparent', border: 'border-neon-cyan/20', text: 'text-neon-cyan', glow: '' },
  };
  const c = colors[color] || colors.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-card p-5 bg-gradient-to-br ${c.bg} border ${c.border} relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}
        style={{ background: `var(--tw-gradient-from)` }} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/50 text-sm font-medium">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${c.bg} border ${c.border}`}>
            <Icon className={`text-xl ${c.text}`} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold font-poppins ${c.text}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}
