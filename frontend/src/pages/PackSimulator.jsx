import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardsAPI, collectionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { GiCardPickup } from 'react-icons/gi';
import { MdAutorenew, MdAddCircle } from 'react-icons/md';

// SAMA PERSIS dengan RARITIES di Search.jsx
const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Holo VSTAR',
  'Rare Ultra',
  'Rare Rainbow',
  'Rare Secret',
  'Rare Shining',
  'Rare Shiny',
  'Rare Shiny GX',
  'Amazing Rare',
  'LEGEND',
  'Promo',
];

// WEIGHT untuk setiap rarity (total 100%)
const RARITY_WEIGHTS = [
  { rarity: 'Common', weight: 40, color: '#9ca3af', glow: 'rgba(156,163,175,0.4)' },
  { rarity: 'Uncommon', weight: 25, color: '#4ade80', glow: 'rgba(74,222,128,0.5)' },
  { rarity: 'Rare', weight: 12, color: '#60a5fa', glow: 'rgba(96,165,250,0.6)' },
  { rarity: 'Rare Holo', weight: 7, color: '#a855f7', glow: 'rgba(168,85,247,0.7)' },
  { rarity: 'Rare Holo EX', weight: 4, color: '#4d9fff', glow: 'rgba(77,159,255,0.8)' },
  { rarity: 'Rare Holo GX', weight: 2.5, color: '#ff6b35', glow: 'rgba(255,107,53,0.8)' },
  { rarity: 'Rare Holo V', weight: 2.5, color: '#ff6b35', glow: 'rgba(255,107,53,0.8)' },
  { rarity: 'Rare Holo VMAX', weight: 1.5, color: '#ff914d', glow: 'rgba(255,145,77,0.85)' },
  { rarity: 'Rare Holo VSTAR', weight: 1, color: '#ffb347', glow: 'rgba(255,179,71,0.85)' },
  { rarity: 'Rare Ultra', weight: 1.2, color: '#e879f9', glow: 'rgba(232,121,249,0.9)' },
  { rarity: 'Rare Rainbow', weight: 0.8, color: '#ff4dce', glow: 'rgba(255,77,206,0.9)' },
  { rarity: 'Rare Secret', weight: 0.5, color: '#ffd700', glow: 'rgba(255,215,0,0.9)' },
  { rarity: 'Rare Shining', weight: 0.4, color: '#fbbf24', glow: 'rgba(251,191,36,0.9)' },
  { rarity: 'Rare Shiny', weight: 0.4, color: '#fbbf24', glow: 'rgba(251,191,36,0.9)' },
  { rarity: 'Rare Shiny GX', weight: 0.3, color: '#f59e0b', glow: 'rgba(245,158,11,0.95)' },
  { rarity: 'Amazing Rare', weight: 0.3, color: '#06b6d4', glow: 'rgba(6,182,212,0.9)' },
  { rarity: 'LEGEND', weight: 0.2, color: '#ec4899', glow: 'rgba(236,72,153,0.95)' },
  { rarity: 'Promo', weight: 0.4, color: '#a78bfa', glow: 'rgba(167,139,250,0.7)' },
];

function pickRarity() {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const r of RARITY_WEIGHTS) {
    rand -= r.weight;
    if (rand <= 0) return r;
  }
  return RARITY_WEIGHTS[0];
}

// POSISI KARTU DALAM PACK (5 kartu)
// Slot 0-2: Common/Uncommon/Rare biasa
// Slot 3: Rare ke atas (peluang lebih tinggi)
// Slot 4: Bisa dapet apa aja (termasuk ultra rare)
function getSlotRarity(slotIndex) {
  if (slotIndex === 4) {
    // Slot terakhir: full random berdasarkan weight
    return pickRarity();
  } else if (slotIndex === 3) {
    // Slot ke-4: bias ke rare+ (rare holo ke atas)
    const rareWeights = RARITY_WEIGHTS.filter(r => 
      !['Common', 'Uncommon', 'Rare'].includes(r.rarity)
    );
    const total = rareWeights.reduce((s, r) => s + r.weight, 0);
    let rand = Math.random() * total;
    for (const r of rareWeights) {
      rand -= r.weight;
      if (rand <= 0) return r;
    }
    return rareWeights[0];
  } else {
    // Slot 1-3: common/uncommon/rare biasa
    const commonWeights = RARITY_WEIGHTS.filter(r => 
      ['Common', 'Uncommon', 'Rare'].includes(r.rarity)
    );
    const total = commonWeights.reduce((s, r) => s + r.weight, 0);
    let rand = Math.random() * total;
    for (const r of commonWeights) {
      rand -= r.weight;
      if (rand <= 0) return r;
    }
    return commonWeights[0];
  }
}

// LANGSUNG panggil API dengan rarity yang tepat (SAMA KAYA SEARCH)
async function fetchRandomCard(rarityName) {
  try {
    // Query langsung pakai rarity name persis seperti di Search
    const res = await cardsAPI.search({ 
      q: `rarity:"${rarityName}"`, 
      pageSize: 50 
    });
    const cards = res.data.data || [];
    if (!cards.length) {
      // Fallback: cari kartu dengan nama populer
      const fallbackQueries = ['Charizard', 'Pikachu', 'Mewtwo', 'Gengar'];
      const fallbackQuery = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
      const res2 = await cardsAPI.search({ q: `name:"${fallbackQuery}*"`, pageSize: 50 });
      const fallback = res2.data.data || [];
      return fallback[Math.floor(Math.random() * fallback.length)] || null;
    }
    return cards[Math.floor(Math.random() * cards.length)];
  } catch { 
    return null; 
  }
}

function CardReveal({ card, rarityInfo, revealed, onReveal }) {
  return (
    <motion.div
      className="relative cursor-pointer select-none"
      onClick={onReveal}
      whileHover={{ scale: revealed ? 1 : 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="back"
            className="aspect-[3/4] rounded-2xl overflow-hidden border-2 flex items-center justify-center"
            style={{ borderColor: '#b44dff40', background: 'linear-gradient(135deg, #1e1e3f, #111128)' }}
            exit={{ rotateY: 90, transition: { duration: 0.2 } }}
          >
            <div className="flex flex-col items-center gap-3">
              <GiCardPickup className="text-5xl text-neon-purple/40" />
              <p className="text-xs text-white/30 font-poppins">Tap to reveal</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="aspect-[3/4] rounded-2xl overflow-hidden relative border-2"
            style={{ borderColor: rarityInfo?.glow?.replace('rgba', 'rgba').replace(/[\d.]+\)$/, '0.6)') || '#ffffff20' }}
          >
            {card?.images?.large || card?.images?.small ? (
              <img src={card.images.large || card.images.small} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-navy-700 flex items-center justify-center text-5xl">🃏</div>
            )}
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ boxShadow: `inset 0 0 30px ${rarityInfo?.glow || 'transparent'}` }} />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs font-bold text-white truncate">{card?.name}</p>
              <p className="text-[10px]" style={{ color: rarityInfo?.color }}>{rarityInfo?.rarity}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PackSimulator() {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState([]);

  const openPack = async () => {
    setLoading(true);
    setPack(null);
    setRevealed([]);
    setRevealAll(false);
    
    try {
      const cards = await Promise.all(
        Array.from({ length: 5 }, async (_, slotIndex) => {
          const rarityInfo = getSlotRarity(slotIndex);
          const card = await fetchRandomCard(rarityInfo.rarity);
          return { card, rarityInfo };
        })
      );
      setPack(cards);
    } catch (error) {
      console.error(error);
      toast.error('Failed to open pack');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = (i) => {
    setRevealed(prev => prev.includes(i) ? prev : [...prev, i]);
  };

  const handleRevealAll = () => {
    if (pack) {
      setRevealed(pack.map((_, i) => i));
      setRevealAll(true);
    }
  };

  const addAllToCollection = async () => {
    if (!pack) return;
    let added = 0;
    for (const { card } of pack) {
      if (!card) continue;
      try {
        await collectionAPI.add({
        card_id: card.id,
        card_name: card.name,
        card_image: card.images?.large || card.images?.small,
        card_type: card.types?.[0],
        card_rarity: card.rarity,
        card_set_name: card.set?.name,
        card_data: card || null,   // ← fix
      });
        added++;
      } catch (err) {
        console.error(err);
      }
    }
    toast.success(`${added} cards added to collection! 🎴`);
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-white font-poppins">Pack Simulator</h1>
        <p className="text-white/40 text-sm mt-1">Open virtual booster packs</p>
      </div>

      {/* Pack visual */}
      <motion.div
        className="glass-card p-8 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(180,77,255,0.1) 0%, rgba(77,159,255,0.05) 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-8 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 right-8 w-32 h-32 bg-neon-blue/10 rounded-full blur-2xl" />
        </div>
        <motion.div
          animate={loading ? { scale: [1, 1.1, 0.95, 1.05, 1], rotate: [0, -5, 5, -3, 0] } : { y: [0, -8, 0] }}
          transition={loading ? { duration: 0.6, repeat: 3 } : { duration: 3, repeat: Infinity }}
          className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-neon-purple to-neon-blue shadow-neon-purple mb-4 cursor-pointer"
          onClick={!loading ? openPack : undefined}
        >
          <GiCardPickup className="text-white text-5xl" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-1">Standard Booster Pack</h2>
        <p className="text-white/40 text-sm mb-6">5 cards · Chance for EX, Full Art & more!</p>
        <button onClick={openPack} disabled={loading} className="neon-btn px-10 flex items-center gap-3 mx-auto disabled:opacity-50">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Opening...</>
          ) : (
            <><GiCardPickup className="text-lg" />Open Pack!</>
          )}
        </button>
      </motion.div>

      {/* Cards */}
      {pack && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">{revealed.length}/{pack.length} revealed</p>
            <div className="flex gap-2">
              {!revealAll && (
                <button onClick={handleRevealAll} className="px-4 py-2 rounded-xl text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 transition-all">
                  Reveal All
                </button>
              )}
              {revealAll && (
                <button onClick={addAllToCollection} className="neon-btn text-sm flex items-center gap-2 px-4 py-2">
                  <MdAddCircle /> Add All
                </button>
              )}
              <button onClick={openPack} disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-navy-700 border border-white/10 text-white/60 hover:text-white transition-all flex items-center gap-2">
                <MdAutorenew /> Again
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {pack.map(({ card, rarityInfo }, i) => (
              <CardReveal 
                key={i} 
                card={card} 
                rarityInfo={rarityInfo}
                revealed={revealed.includes(i)} 
                onReveal={() => handleReveal(i)} 
              />
            ))}
          </div>

          {/* Rarity summary */}
          {revealAll && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Pack Summary</h3>
              <div className="flex flex-wrap gap-2">
                {pack.map(({ rarityInfo }, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full border font-medium"
                    style={{ 
                      borderColor: rarityInfo.glow, 
                      color: rarityInfo.color, 
                      background: rarityInfo.glow?.replace(/[\d.]+\)$/, '0.1)')
                    }}>
                    {rarityInfo.rarity}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Rarity odds */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Drop Rates</h3>
        <div className="space-y-2">
          {RARITY_WEIGHTS.map((r, idx) => (
            <div key={r.rarity} className="flex items-center gap-3">
              <span className="text-xs w-28 flex-shrink-0" style={{ color: r.color }}>{r.rarity}</span>
              <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.weight / 100) * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: r.color, boxShadow: `0 0 6px ${r.glow}` }}
                />
              </div>
              <span className="text-xs text-white/30 w-10 text-right">{r.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}