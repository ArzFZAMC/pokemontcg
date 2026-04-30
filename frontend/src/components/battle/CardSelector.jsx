import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheckCircle, MdClose } from 'react-icons/md';
import { GiSwordWound } from 'react-icons/gi';

export default function CardSelector({ collection, onSubmit, loading }) {
  const [selected, setSelected] = useState([]);

  const toggle = (card) => {
    setSelected(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) return prev.filter(c => c.id !== card.id);
      if (prev.length >= 6) return prev;
      return [...prev, card];
    });
  };

  const isSelected = (card) => selected.some(c => c.id === card.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Select Your Battle Cards</h2>
          <p className="text-white/40 text-sm mt-0.5">Choose exactly 6 cards from your collection</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all
          ${selected.length === 6
            ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
            : 'bg-navy-700 border-white/10 text-white/50'}`}>
          {selected.length} / 6
        </div>
      </div>

      {/* Selected cards preview */}
      {selected.length > 0 && (
        <div className="glass-card p-3">
          <p className="text-xs text-white/40 mb-2">Selected:</p>
          <div className="flex gap-2 flex-wrap">
            {selected.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="relative"
              >
                <img
                  src={card.card_image} alt={card.card_name}
                  className="w-12 h-16 object-cover rounded-lg border-2 border-neon-purple/40"
                  onError={e => e.target.style.display = 'none'}
                />
                <button
                  onClick={() => toggle(card)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <MdClose className="text-white text-[10px]" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 rounded-b-lg px-0.5">
                  <p className="text-[7px] text-white text-center truncate">{card.card_name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Collection grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
        {collection.map(card => {
          const sel = isSelected(card);
          return (
            <motion.button
              key={card.id}
              onClick={() => toggle(card)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative glass-card overflow-hidden rounded-xl border transition-all
                ${sel
                  ? 'border-neon-purple/60 bg-neon-purple/10'
                  : selected.length >= 6
                    ? 'border-white/5 opacity-40 cursor-not-allowed'
                    : 'border-white/5 hover:border-neon-purple/30'}`}
            >
              {card.card_image ? (
                <img src={card.card_image} alt={card.card_name}
                  className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-navy-700 flex items-center justify-center text-3xl">🃏</div>
              )}
              <div className="p-1.5">
                <p className="text-[9px] text-white/70 truncate font-medium">{card.card_name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[8px] text-neon-blue">HP {card.card_hp || '?'}</p>
                  {card.card_type && <p className="text-[8px] text-white/40">{card.card_type}</p>}
                </div>
              </div>
              {sel && (
                <div className="absolute inset-0 bg-neon-purple/10 flex items-start justify-end p-1">
                  <div className="w-5 h-5 bg-neon-purple rounded-full flex items-center justify-center">
                    <MdCheckCircle className="text-white text-xs" />
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => onSubmit(selected)}
        disabled={selected.length !== 6 || loading}
        className="neon-btn w-full text-center disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
        ) : (
          <><GiSwordWound className="text-lg" />Ready to Battle!</>
        )}
      </button>
    </div>
  );
}
