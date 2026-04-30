import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { collectionAPI } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import CardSelector from '../components/battle/CardSelector';
import BattleArena from '../components/battle/BattleArena';
import { GiSwordWound, GiCardPickup } from 'react-icons/gi';
import { MdAdd, MdLogin, MdEmojiEvents, MdMonetizationOn, MdClose } from 'react-icons/md';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pdex_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const BATTLE_PHASES = {
  LOBBY: 'lobby',
  WAITING: 'waiting',
  SELECTING: 'selecting',
  BATTLE: 'battle',
  FINISHED: 'finished',
};

export default function Battle() {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState(BATTLE_PHASES.LOBBY);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [cards, setCards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [collection, setCollection] = useState([]);
  const [battleStats, setBattleStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [attackLoading, setAttackLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [battleResult, setBattleResult] = useState(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [iReady, setIReady] = useState(false);

  // Fetch collection and stats
  useEffect(() => {
    collectionAPI.getAll().then(r => setCollection(r.data.data || []));
    API.get('/battle/stats').then(r => setBattleStats(r.data));
  }, []);

  // Socket setup
  const setupSocket = useCallback(() => {
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('auth', { userId: user.id, username: user.username });
    });

    socket.on('auth_ok', () => {
      console.log('Socket authenticated');
    });

    socket.on('room_state', ({ room, cards: c, logs: l }) => {
  setRoomData(room);
  setCards(c || []);
  setLogs(l || []);

  // ← TAMBAH INI
  if (room?.status === 'finished') setPhase(BATTLE_PHASES.FINISHED);
  else if (room?.status === 'battle') setPhase(BATTLE_PHASES.BATTLE);
  else if (room?.status === 'selecting') setPhase(BATTLE_PHASES.SELECTING); // ← ini sudah ada
  else if (room?.status === 'waiting' && phase !== BATTLE_PHASES.WAITING) {
    // jangan override kalau lagi waiting
  }
});

    socket.on('player_joined', ({ username }) => {
      toast.success(`${username} joined the room! 🎮`);
      setPhase(BATTLE_PHASES.SELECTING);
    });

    socket.on('battle_start', ({ message }) => {
      toast.success(message, { duration: 3000 });
      setPhase(BATTLE_PHASES.BATTLE);
    });

    socket.on('battle_phase_change', ({ phase: p }) => {
      if (p === 'selecting') setPhase(BATTLE_PHASES.SELECTING);
      if (p === 'battle') setPhase(BATTLE_PHASES.BATTLE);
    });

    socket.on('attack_result', (result) => {
      setAttackLoading(false);
      if (result.isKo) toast(`💥 ${result.defenderCard} is KO'd!`, { icon: '⚡' });
    });

    socket.on('retreat_done', ({ username }) => {
      if (username !== user.username) toast(`${username} retreated a card`);
    });

    socket.on('battle_end', (result) => {
      setBattleResult(result);
      setPhase(BATTLE_PHASES.FINISHED);
      if (result.winnerId === user.id) {
        toast.success(`🏆 You won! +${result.coinReward} coins!`, { duration: 5000 });
      } else {
        toast.error('😔 You lost! Better luck next time.', { duration: 5000 });
      }
    });

    socket.on('player_disconnected', ({ username }) => {
      toast.error(`${username} disconnected`);
    });

    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev.slice(-50), msg]);
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
      setAttackLoading(false);
      setSubmitLoading(false);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current = socket;
    return socket;
  }, [user]);

  useEffect(() => {
    setupSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [setupSocket]);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await API.post('/battle/room');
      const { room_code, room_id } = res.data;
      setRoomCode(room_code);
      setRoomId(room_id);
      setPhase(BATTLE_PHASES.WAITING);
      socketRef.current?.emit('join_room', { roomId: room_id });
      toast.success(`Room created! Code: ${room_code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return toast.error('Enter room code');
    setLoading(true);
    try {
      const res = await API.post('/battle/room/join', { room_code: joinCode.trim() });
      const { room_id, room_code } = res.data;
      setRoomId(room_id);
      setRoomCode(room_code);
      setPhase(BATTLE_PHASES.SELECTING);
      socketRef.current?.emit('join_room', { roomId: room_id });
      toast.success('Joined room! Select your cards.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Room not found');
    } finally { setLoading(false); }
  };

  const handleSubmitCards = async (selectedCards) => {
    setSubmitLoading(true);
    try {
      const res = await API.post('/battle/cards/submit', {
        room_id: roomId,
        cards: selectedCards,
      });
      setIReady(true);
      toast.success('Cards submitted! Waiting for opponent...');
      socketRef.current?.emit('cards_ready', { roomId });
      if (res.data.battleStarted) {
        setPhase(BATTLE_PHASES.BATTLE);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit cards');
    } finally { setSubmitLoading(false); }
  };

  const handleAttack = (attackIndex) => {
    setAttackLoading(true);
    socketRef.current?.emit('attack', { roomId, attackIndex });
  };

  const handleRetreat = (cardId) => {
    socketRef.current?.emit('retreat', { roomId, cardId });
  };

  const handleForfeit = () => {
    socketRef.current?.emit('forfeit', { roomId });
  };

  const handleSendChat = (message) => {
    socketRef.current?.emit('chat', { roomId, message });
  };

  const handlePlayAgain = () => {
    setBattleResult(null);
    setRoomData(null);
    setCards([]);
    setLogs([]);
    setChatMessages([]);
    setRoomCode('');
    setRoomId(null);
    setJoinCode('');
    setIReady(false);
    setOpponentReady(false);
    setPhase(BATTLE_PHASES.LOBBY);
    API.get('/battle/stats').then(r => setBattleStats(r.data));
  };

  const isMyTurn = roomData?.current_turn === user.id;

  return (
    <div className="space-y-5 page-transition max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins flex items-center gap-2">
            <GiSwordWound className="text-neon-purple" /> PvP Battle
          </h1>
          <p className="text-white/40 text-sm mt-1">Battle other trainers in real-time</p>
        </div>
        {battleStats && (
          <div className="flex gap-3">
            <div className="text-center glass-card px-3 py-2">
              <p className="text-neon-purple font-bold text-lg">{battleStats.stats?.wins || 0}</p>
              <p className="text-[10px] text-white/40">Wins</p>
            </div>
            <div className="text-center glass-card px-3 py-2">
              <p className="text-red-400 font-bold text-lg">{battleStats.stats?.losses || 0}</p>
              <p className="text-[10px] text-white/40">Losses</p>
            </div>
          </div>
        )}
      </div>

      {/* ── LOBBY ── */}
      {phase === BATTLE_PHASES.LOBBY && (
        <div className="space-y-4">
          {/* Create or join */}
          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 text-center border border-white/5 hover:border-neon-purple/30 transition-all"
            >
              <GiSwordWound className="text-neon-purple text-4xl mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Create Battle</h3>
              <p className="text-white/40 text-xs mb-4">Create a room and share the code</p>
              <button onClick={handleCreateRoom} disabled={loading}
                className="neon-btn w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <MdAdd /> Create Room
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-6 border border-white/5 hover:border-neon-blue/30 transition-all"
            >
              <MdLogin className="text-neon-blue text-4xl mx-auto mb-3 block text-center w-full" />
              <h3 className="text-lg font-bold text-white mb-1 text-center">Join Battle</h3>
              <p className="text-white/40 text-xs mb-4 text-center">Enter room code from opponent</p>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Room code..."
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="input-glass flex-1 text-sm text-center tracking-widest uppercase font-bold"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                />
                <button onClick={handleJoinRoom} disabled={loading || !joinCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30 transition-all disabled:opacity-40 text-sm font-semibold">
                  Join
                </button>
              </div>
            </motion.div>
          </div>

          {/* Battle history */}
          {battleStats?.recent?.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <MdEmojiEvents className="text-neon-gold" /> Recent Battles
              </h3>
              <div className="space-y-2">
                {battleStats.recent.slice(0, 5).map((b, i) => {
                  const won = b.winner_id === user.id;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-navy-700/50">
                      <span className={won ? 'text-green-400 font-semibold' : 'text-red-400'}>
                        {won ? '🏆 Won' : '💀 Lost'}
                      </span>
                      <span className="text-white/40">
                        {won ? b.winner_name : b.loser_name} vs {won ? b.loser_name : b.winner_name}
                      </span>
                      <span className="text-white/30">
                        {b.winner_ko}-{b.loser_ko}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WAITING FOR OPPONENT ── */}
      {phase === BATTLE_PHASES.WAITING && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-8 text-center border border-neon-purple/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-neon-purple/20 border-t-neon-purple mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-white mb-2">Waiting for Opponent</h2>
          <p className="text-white/40 text-sm mb-4">Share this code with your opponent:</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-navy-700 border border-neon-purple/30 mb-4">
            <span className="text-3xl font-bold text-neon-purple tracking-widest font-poppins">{roomCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Copied!'); }}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-white/20 text-xs">Once they join, you'll both select battle cards</p>
          <button onClick={handlePlayAgain} className="mt-4 text-xs text-white/30 hover:text-red-400 transition-colors">
            Cancel
          </button>
        </motion.div>
      )}

      {/* ── CARD SELECTION ── */}
      {phase === BATTLE_PHASES.SELECTING && (
        <div className="space-y-4">
          {iReady ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-6 text-center border border-green-500/20">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-lg font-bold text-white">Cards Submitted!</h2>
              <p className="text-white/40 text-sm mt-1">Waiting for opponent to select their cards...</p>
              <div className="w-8 h-8 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mt-4" />
            </motion.div>
          ) : (
            <CardSelector
              collection={collection}
              onSubmit={handleSubmitCards}
              loading={submitLoading}
            />
          )}
        </div>
      )}

      {/* ── BATTLE ── */}
      {phase === BATTLE_PHASES.BATTLE && roomData && (
        <BattleArena
          room={roomData}
          cards={cards}
          logs={logs}
          myId={user.id}
          isMyTurn={isMyTurn}
          onAttack={handleAttack}
          onRetreat={handleRetreat}
          onForfeit={handleForfeit}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          attackLoading={attackLoading}
        />
      )}

      {/* ── FINISHED ── */}
      {phase === BATTLE_PHASES.FINISHED && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          {battleResult?.winnerId === user.id ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >🏆</motion.div>
              <h2 className="text-2xl font-bold text-neon-gold mb-2">Victory!</h2>
              <p className="text-white/60 mb-4">You won the battle!</p>
              {battleResult?.coinReward && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/20 border border-neon-gold/30 mb-6">
                  <MdMonetizationOn className="text-neon-gold text-xl" />
                  <span className="text-neon-gold font-bold">+{battleResult.coinReward} coins earned!</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Defeated</h2>
              <p className="text-white/60 mb-6">Better luck next time, Trainer!</p>
            </>
          )}

          {battleResult && (
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-neon-purple">{battleResult.winnerKo || 0}</p>
                <p className="text-white/40">Winner KOs</p>
              </div>
              <div className="text-2xl text-white/20 self-center">-</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{battleResult.loserKo || 0}</p>
                <p className="text-white/40">Loser KOs</p>
              </div>
            </div>
          )}

          {battleResult?.forfeit && (
            <p className="text-white/30 text-xs mb-4">{battleResult.logText}</p>
          )}

          <button onClick={handlePlayAgain} className="neon-btn px-8 flex items-center gap-2 mx-auto">
            <GiSwordWound /> Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
}
