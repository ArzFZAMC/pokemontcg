import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdFavorite, MdFavoriteBorder, MdAddCircle, MdBookmarkAdd } from 'react-icons/md';

const RARITY_GLOW = {
  'Common': 'rgba(160,160,160,0.3)',
  'Uncommon': 'rgba(74,222,128,0.4)',
  'Rare': 'rgba(96,165,250,0.4)',
  'Rare Holo': 'rgba(168,85,247,0.5)',
  'Rare Holo EX': 'rgba(77,159,255,0.7)',
  'Rare Holo GX': 'rgba(255,107,53,0.7)',
  'Rare Holo V': 'rgba(255,107,53,0.7)',
  'Rare Holo VMAX': 'rgba(255,145,77,0.75)',
  'Rare Holo VSTAR': 'rgba(255,179,71,0.75)',
  'Rare Ultra': 'rgba(232,121,249,0.8)',
  'Rare Rainbow': 'rgba(255,77,206,0.8)',
  'Rare Secret': 'rgba(255,215,0,0.85)',
  'Rare Shining': 'rgba(251,191,36,0.8)',
  'Rare Shiny': 'rgba(251,191,36,0.8)',
  'Rare Shiny GX': 'rgba(245,158,11,0.85)',
  'Amazing Rare': 'rgba(6,182,212,0.8)',
  'LEGEND': 'rgba(236,72,153,0.9)',
  'Promo': 'rgba(167,139,250,0.6)',
};

const RARITY_CLASS = {
  'Common': 'text-gray-400',
  'Uncommon': 'text-green-400',
  'Rare': 'text-blue-400',
  'Rare Holo': 'text-purple-400',
  'Rare Holo EX': 'rarity-ex',
  'Rare Ultra': 'rarity-full-art',
  'Rare Rainbow': 'rarity-full-art',
  'Rare Secret': 'rarity-secret',
};

const TYPE_COLORS = {
  Fire: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Water: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Grass: 'bg-green-500/20 text-green-300 border-green-500/30',
  Electric: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Psychic: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Fighting: 'bg-red-500/20 text-red-300 border-red-500/30',
  Darkness: 'bg-gray-700/50 text-gray-300 border-gray-500/30',
  Metal: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Dragon: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Fairy: 'bg-pink-400/20 text-pink-200 border-pink-400/30',
  Colorless: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function CardItem({
  card,
  onAdd,
  onFavorite,
  onDetail,
  showActions = true,
  addLabel = 'Add',       // customizable label
}) {
  const [imgError, setImgError] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const image = card.images?.large || card.images?.small || card.card_image;
  const name = card.name || card.card_name;
  const rarity = card.rarity || card.card_rarity;
  const type = card.types?.[0] || card.subtypes?.[0] || card.card_type;
  const hp = card.hp || card.card_hp;
  const setName = card.set?.name || card.card_set_name;
  const isFavorite = card.is_favorite;

  const glowColor = RARITY_GLOW[rarity] || 'rgba(180,77,255,0.2)';
  const isWishlistAdd = addLabel.toLowerCase().includes('wishlist');

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 15;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 15;
    setTilt({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.1s ease',
      }}
      className="relative glass-card overflow-hidden cursor-pointer group holographic"
      onClick={() => onDetail?.(card)}
    >
      {/* Glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 30px ${glowColor}` }}
      />

      {/* Card image */}
      <div className="relative overflow-hidden rounded-t-xl" style={{ paddingTop: '140%' }}>
        {!imgError && image ? (
          <img
            src={image} alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-700">
            <span className="text-4xl">🃏</span>
          </div>
        )}

        {/* Rarity glow on rare+ */}
        {rarity && !['Common','Uncommon','Rare'].includes(rarity) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`, opacity: 0.35 }}
          />
        )}

        {/* Favorite badge */}
        {isFavorite && (
          <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
            <MdFavorite className="text-white text-xs" />
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold text-white leading-tight truncate">{name}</h3>
          {hp && <span className="text-xs text-neon-blue font-bold flex-shrink-0">HP {hp}</span>}
        </div>
        <div className="flex items-center justify-between gap-1">
          {type && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[type] || TYPE_COLORS.Colorless}`}>
              {type}
            </span>
          )}
          {rarity && (
            <span className={`text-[10px] font-bold ${RARITY_CLASS[rarity] || 'text-gray-400'}`}>
              {rarity?.length > 12 ? rarity.split(' ').slice(-1)[0] : rarity}
            </span>
          )}
        </div>
        {setName && <p className="text-[10px] text-white/30 truncate">{setName}</p>}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
            {onAdd && (
              <button
                onClick={() => onAdd(card)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold rounded-lg transition-colors border
                  ${isWishlistAdd
                    ? 'bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/40 border-neon-blue/20'
                    : 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/40 border-neon-purple/20'
                  }`}
              >
                {isWishlistAdd ? <MdBookmarkAdd className="text-sm" /> : <MdAddCircle className="text-sm" />}
                {addLabel}
              </button>
            )}
            {onFavorite && (
              <button
                onClick={() => onFavorite(card)}
                className={`p-1.5 rounded-lg border transition-colors
                  ${isFavorite
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/10 text-white/30 hover:text-red-400'}`}
              >
                {isFavorite ? <MdFavorite className="text-sm" /> : <MdFavoriteBorder className="text-sm" />}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
