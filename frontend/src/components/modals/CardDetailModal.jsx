import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdAddCircle, MdFavorite, MdFavoriteBorder, MdStar } from 'react-icons/md';
import { GiSwordWound, GiShield } from 'react-icons/gi';

const RARITY_GLOW = {
  'Common': '#9ca3af',
  'Uncommon': '#4ade80',
  'Rare': '#60a5fa',
  'Rare Holo': '#a855f7',
  'Rare Holo EX': '#4d9fff',
  'Full Art': '#ff4dce',
  'Secret Rare': '#ffd700',
  'Gold': '#ffc200',
};

export default function CardDetailModal({ card, onClose, onAddCollection, onAddWishlist }) {
  if (!card) return null;

  const image = card.images?.large || card.images?.small || card.card_image;
  const name = card.name || card.card_name;
  const rarity = card.rarity || card.card_rarity;
  const type = card.types?.[0] || card.card_type;
  const hp = card.hp || card.card_hp;
  const setName = card.set?.name || card.card_set_name;
  const setLogo = card.set?.images?.logo || card.card_set_logo;
  const artist = card.artist || card.card_artist;
  const attacks = card.attacks || [];
  const weaknesses = card.weaknesses || [];
  const marketPrice = card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market;
  const glowColor = RARITY_GLOW[rarity] || '#b44dff';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="bg-navy-800 border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
          style={{ boxShadow: `0 0 60px ${glowColor}40, 0 20px 60px rgba(0,0,0,0.6)` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-navy-900/80 hover:bg-navy-700 text-white/60 hover:text-white rounded-full p-2 transition-all">
            <MdClose className="text-xl" />
          </button>

          {/* Card image hero */}
          <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-3xl">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-contain bg-navy-950 p-4" />
            ) : (
              <div className="w-full h-full bg-navy-950 flex items-center justify-center text-6xl">🃏</div>
            )}
            {/* Rarity glow overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(ellipse at bottom, ${glowColor}30 0%, transparent 70%)`
            }} />
            {/* Rarity badge */}
            {rarity && (
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: `${glowColor}30`, border: `1px solid ${glowColor}60`, color: glowColor, textShadow: `0 0 10px ${glowColor}` }}>
                {rarity}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Name & HP */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-poppins">{name}</h2>
                {type && <span className="text-sm text-white/50 mt-1">{type} Pokémon</span>}
              </div>
              {hp && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-neon-blue">{hp}</p>
                  <p className="text-xs text-white/40">HP</p>
                </div>
              )}
            </div>

            {/* Set info */}
            <div className="flex items-center gap-3 p-3 bg-navy-700/50 rounded-xl">
              {setLogo && <img src={setLogo} alt={setName} className="h-6 object-contain" onError={e => e.target.style.display='none'} />}
              <div>
                <p className="text-xs text-white/40">Set</p>
                <p className="text-sm text-white font-medium">{setName || 'Unknown Set'}</p>
              </div>
              {artist && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-white/40">Artist</p>
                  <p className="text-sm text-white/70">{artist}</p>
                </div>
              )}
            </div>

            {/* Market price */}
            {marketPrice && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neon-gold/10 to-transparent rounded-xl border border-neon-gold/20">
                <div className="flex items-center gap-2">
                  <MdStar className="text-neon-gold text-xl" />
                  <span className="text-sm text-white/70">Market Price</span>
                </div>
                <span className="text-lg font-bold text-neon-gold">${parseFloat(marketPrice).toFixed(2)}</span>
              </div>
            )}

            {/* Attacks */}
            {attacks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                  <GiSwordWound className="text-red-400" /> Attacks
                </h3>
                <div className="space-y-2">
                  {attacks.map((atk, i) => (
                    <div key={i} className="p-3 bg-navy-700/40 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white text-sm">{atk.name}</span>
                        <span className="text-neon-blue font-bold text-sm">{atk.damage}</span>
                      </div>
                      {atk.text && <p className="text-xs text-white/40 leading-relaxed">{atk.text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div className="flex items-center gap-2">
                <GiShield className="text-yellow-400 flex-shrink-0" />
                <span className="text-sm text-white/60">Weakness:</span>
                {weaknesses.map((w, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full text-xs border border-red-500/30">
                    {w.type} {w.value}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {onAddCollection && (
                <button onClick={() => { onAddCollection(card); onClose(); }}
                  className="neon-btn flex-1 flex items-center justify-center gap-2 text-sm">
                  <MdAddCircle className="text-lg" /> Add to Collection
                </button>
              )}
              {onAddWishlist && (
                <button onClick={() => { onAddWishlist(card); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-navy-700 border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all">
                  <MdFavoriteBorder className="text-lg" /> Wishlist
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
