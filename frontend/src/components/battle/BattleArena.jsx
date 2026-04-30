import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiSwordWound, GiShield, GiCardPickup } from 'react-icons/gi';
import { MdSwapHoriz, MdFlag, MdChat, MdSend } from 'react-icons/md';

function HPBar({ current, max, color = 'purple' }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/50">HP</span>
        <span className="font-bold" style={{ color: barColor }}>{current}/{max}</span>
      </div>
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: barColor, boxShadow: `0 0 8px ${barColor}80` }}
        />
      </div>
    </div>
  );
}

function BattleCard({ card, isActive, isMyCard, onSelect, selectable }) {
  if (!card) return (
    <div className="aspect-[3/4] rounded-xl bg-navy-800/50 border border-white/5 flex items-center justify-center">
      <GiCardPickup className="text-white/20 text-3xl" />
    </div>
  );

  return (
    <motion.div
      whileHover={selectable ? { scale: 1.05 } : {}}
      onClick={selectable ? onSelect : undefined}
      className={`relative rounded-xl overflow-hidden border-2 transition-all
        ${isActive
          ? isMyCard ? 'border-neon-purple/70 shadow-neon-purple' : 'border-red-500/70'
          : card.is_ko ? 'border-white/10 opacity-40' : 'border-white/20'}
        ${selectable ? 'cursor-pointer hover:border-neon-blue/50' : ''}
        ${card.is_ko ? 'grayscale' : ''}`}
    >
      {card.card_image ? (
        <img src={card.card_image} alt={card.card_name}
          className="w-full aspect-[3/4] object-cover" />
      ) : (
        <div className="w-full aspect-[3/4] bg-navy-700 flex items-center justify-center text-4xl">🃏</div>
      )}

      {/* Active glow */}
      {isActive && !card.is_ko && (
        <div className={`absolute inset-0 pointer-events-none rounded-xl`}
          style={{ boxShadow: `inset 0 0 20px ${isMyCard ? 'rgba(180,77,255,0.3)' : 'rgba(248,113,113,0.3)'}` }} />
      )}

      {/* KO overlay */}
      {card.is_ko && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
          <span className="text-red-400 font-bold text-lg rotate-12">KO!</span>
        </div>
      )}

      {/* Active badge */}
      {isActive && !card.is_ko && (
        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold
          ${isMyCard ? 'bg-neon-purple text-white' : 'bg-red-500 text-white'}`}>
          ACTIVE
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <p className="text-[9px] font-bold text-white truncate">{card.card_name}</p>
        {isActive && !card.is_ko && (
          <HPBar current={card.current_hp} max={card.max_hp} />
        )}
      </div>
    </motion.div>
  );
}

export default function BattleArena({
  room, cards, logs,
  myId, isMyTurn,
  onAttack, onRetreat, onForfeit,
  chatMessages, onSendChat,
  attackLoading, lastAttackResult
}) {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showRetreat, setShowRetreat] = useState(false);

  const myCards = cards.filter(c => c.user_id === myId);
  const oppCards = cards.filter(c => c.user_id !== myId);
  const myActive = myCards.find(c => c.is_active && !c.is_ko);
  const oppActive = oppCards.find(c => c.is_active && !c.is_ko);

  const myKo = room?.player1_id === myId ? room?.player1_ko : room?.player2_ko;
  const oppKo = room?.player1_id === myId ? room?.player2_ko : room?.player1_ko;
  const myName = room?.player1_id === myId ? room?.player1_name : room?.player2_name;
  const oppName = room?.player1_id === myId ? room?.player2_name : room?.player1_name;

  // Parse attacks for active card
  let myAttacks = [];
  if (myActive?.attacks) {
    try {
      myAttacks = typeof myActive.attacks === 'string' ? JSON.parse(myActive.attacks) : myActive.attacks;
    } catch { myAttacks = []; }
  }
  if (!myAttacks.length) myAttacks = [{ name: 'Tackle', damage: '30' }];

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-4">
      {/* Turn indicator */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`text-center py-2 px-4 rounded-xl text-sm font-bold border
          ${isMyTurn
            ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
            : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
      >
        {isMyTurn ? '⚔️ Your Turn — Choose an attack!' : `⏳ ${oppName}'s turn...`}
      </motion.div>

      {/* KO Score */}
      <div className="glass-card p-3 flex items-center justify-between">
        <div className="text-center">
          <p className="text-xs text-white/40">{myName}</p>
          <p className="text-2xl font-bold text-neon-purple">{myKo || 0} KO</p>
        </div>
        <div className="text-2xl">⚔️</div>
        <div className="text-center">
          <p className="text-xs text-white/40">{oppName}</p>
          <p className="text-2xl font-bold text-red-400">{oppKo || 0} KO</p>
        </div>
      </div>

      {/* Battle field */}
      <div className="glass-card p-4 space-y-4">
        {/* Opponent's cards */}
        <div>
          <p className="text-xs text-red-400/70 mb-2 font-semibold">{oppName}'s Cards</p>
          <div className="grid grid-cols-6 gap-1.5">
            {oppCards.map(card => (
              <BattleCard key={card.id} card={card} isActive={card.is_active && !card.is_ko} isMyCard={false} />
            ))}
          </div>
        </div>

        {/* VS divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-bold">VS</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* My cards */}
        <div>
          <p className="text-xs text-neon-purple/70 mb-2 font-semibold">Your Cards</p>
          <div className="grid grid-cols-6 gap-1.5">
            {myCards.map(card => (
              <BattleCard
                key={card.id} card={card}
                isActive={card.is_active && !card.is_ko}
                isMyCard={true}
                selectable={showRetreat && !card.is_active && !card.is_ko && isMyTurn}
                onSelect={() => { onRetreat(card.id); setShowRetreat(false); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Active cards face-off */}
      {(myActive || oppActive) && (
        <div className="glass-card p-4">
          <p className="text-xs text-white/40 mb-3 text-center">Active Battle</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-neon-purple/70 font-semibold text-center">{myName}</p>
              {myActive ? (
                <>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-neon-purple/40 max-w-24 mx-auto">
                    {myActive.card_image
                      ? <img src={myActive.card_image} alt={myActive.card_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-navy-700 flex items-center justify-center text-4xl">🃏</div>
                    }
                  </div>
                  <p className="text-xs text-white text-center font-semibold">{myActive.card_name}</p>
                  <HPBar current={myActive.current_hp} max={myActive.max_hp} />
                </>
              ) : <p className="text-white/30 text-xs text-center">No active card</p>}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-red-400/70 font-semibold text-center">{oppName}</p>
              {oppActive ? (
                <>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-red-500/40 max-w-24 mx-auto">
                    {oppActive.card_image
                      ? <img src={oppActive.card_image} alt={oppActive.card_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-navy-700 flex items-center justify-center text-4xl">🃏</div>
                    }
                  </div>
                  <p className="text-xs text-white text-center font-semibold">{oppActive.card_name}</p>
                  <HPBar current={oppActive.current_hp} max={oppActive.max_hp} />
                </>
              ) : <p className="text-white/30 text-xs text-center">No active card</p>}
            </div>
          </div>
        </div>
      )}

      {/* Attack buttons */}
      {isMyTurn && myActive && (
        <div className="glass-card p-4 space-y-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <GiSwordWound className="text-neon-purple" /> Choose Attack
          </p>
          <div className="grid grid-cols-1 gap-2">
            {myAttacks.slice(0, 4).map((atk, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => onAttack(i)}
                disabled={attackLoading}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 hover:bg-neon-purple/20 hover:border-neon-purple/40 transition-all disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{atk.name}</p>
                  {atk.text && <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{atk.text}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {atk.damage && (
                    <span className="text-neon-purple font-bold text-lg">{atk.damage}</span>
                  )}
                  <GiSwordWound className="text-neon-purple text-xl" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Battle log */}
      <div className="glass-card p-4">
        <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Battle Log</p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs.length > 0 ? logs.map((log, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`text-xs ${log.is_ko ? 'text-red-400 font-semibold' : 'text-white/50'}`}
            >
              {log.log_text}
            </motion.p>
          )) : (
            <p className="text-white/20 text-xs">Battle log will appear here...</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {isMyTurn && (
          <button
            onClick={() => setShowRetreat(p => !p)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all
              ${showRetreat ? 'bg-neon-blue/20 border-neon-blue/40 text-neon-blue' : 'bg-navy-700 border-white/10 text-white/50 hover:text-white'}`}
          >
            <MdSwapHoriz className="text-lg" />
            {showRetreat ? 'Cancel Retreat' : 'Retreat'}
          </button>
        )}
        <button
          onClick={() => setShowChat(p => !p)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-700 border border-white/10 text-white/50 hover:text-white transition-all text-sm font-medium"
        >
          <MdChat className="text-lg" /> Chat
          {chatMessages.length > 0 && (
            <span className="w-4 h-4 bg-neon-purple rounded-full text-[9px] text-white flex items-center justify-center">
              {chatMessages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { if (confirm('Forfeit this battle?')) onForfeit(); }}
          className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all text-sm"
        >
          <MdFlag />
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="max-h-32 overflow-y-auto space-y-1">
              {chatMessages.length > 0 ? chatMessages.map((msg, i) => (
                <div key={i} className={`text-xs ${msg.userId === myId ? 'text-right' : 'text-left'}`}>
                  <span className="text-white/30">{msg.username}: </span>
                  <span className="text-white/70">{msg.message}</span>
                </div>
              )) : (
                <p className="text-white/20 text-xs text-center">No messages yet</p>
              )}
            </div>
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text" placeholder="Say something..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                className="input-glass flex-1 text-sm py-2"
                maxLength={100}
              />
              <button type="submit" className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/40 transition-all">
                <MdSend />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retreat hint */}
      {showRetreat && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs text-neon-blue/70 text-center">
          Click one of your non-active cards above to retreat to it
        </motion.p>
      )}
    </div>
  );
}
