import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MdMonetizationOn, MdCheckCircle, MdTimer,
  MdLocalFireDepartment, MdHistory, MdStorefront,
  MdShoppingCart, MdStar,
} from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';
import EmptyState from '../components/ui/EmptyState';

// Axios instance
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pdex_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const coinAPI = {
  getDailyStatus: () => API.get('/coins/daily'),
  claimDaily: () => API.post('/coins/daily/claim'),
  getPackages: () => API.get('/coins/packages'),
  purchase: (package_id) => API.post('/coins/purchase', { package_id }),
  getPurchaseHistory: () => API.get('/coins/history/purchases'),
};

const STREAK_REWARDS = [
  { streak: 1, coins: 10 },
  { streak: 2, coins: 12 },
  { streak: 3, coins: 15 },
  { streak: 4, coins: 18 },
  { streak: 5, coins: 20 },
  { streak: 6, coins: 25 },
  { streak: 7, coins: 35 },
];

// ── Confirm Purchase Modal ─────────────────────────────────────
function ConfirmModal({ pkg, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card neon-border p-6 w-full max-w-sm text-center"
      >
        <div className="text-5xl mb-3">{pkg.icon}</div>
        <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
        <p className="text-white/50 text-sm mb-4">
          {pkg.coins} coins{pkg.bonus > 0 ? ` + ${pkg.bonus} bonus` : ''}
        </p>

        {/* Simulasi payment info */}
        <div className="glass-card p-4 mb-5 space-y-2 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Package</span>
            <span className="text-white">{pkg.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Coins</span>
            <span className="text-neon-purple font-semibold">
              {pkg.coins + pkg.bonus} coins
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-white/70">Total</span>
            <span className="text-neon-gold">
              Rp {pkg.price.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Simulasi — tidak ada pembayaran nyata</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 neon-btn text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : <><MdShoppingCart /> Confirm</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
const TABS = [
  { key: 'daily', label: 'Daily Reward', icon: MdLocalFireDepartment },
  { key: 'shop', label: 'Coin Shop', icon: MdStorefront },
  { key: 'history', label: 'History', icon: MdHistory },
];

export default function CoinShop() {
  const [tab, setTab] = useState('daily');
  const [dailyStatus, setDailyStatus] = useState(null);
  const [packages, setPackages] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [justClaimed, setJustClaimed] = useState(null);

  const fetchAll = async () => {
    try {
      const [daily, pkgs, hist] = await Promise.all([
        coinAPI.getDailyStatus(),
        coinAPI.getPackages(),
        coinAPI.getPurchaseHistory(),
      ]);
      setDailyStatus(daily.data);
      setCoins(daily.data.coins);
      setPackages(pkgs.data.packages || []);
      setPurchaseHistory(hist.data.data || []);
    } catch { toast.error('Failed to load coin data'); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleClaimDaily = async () => {
    setClaimLoading(true);
    try {
      const res = await coinAPI.claimDaily();
      toast.success(res.data.message);
      setJustClaimed(res.data);
      setCoins(res.data.totalCoins);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!confirmPkg) return;
    setPurchaseLoading(true);
    try {
      const res = await coinAPI.purchase(confirmPkg.id);
      toast.success(res.data.message);
      setCoins(res.data.totalCoins);
      setConfirmPkg(null);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins">Coin Center</h1>
          <p className="text-white/40 text-sm mt-1">Get coins to trade and collect</p>
        </div>
        {/* Coin balance */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-neon-gold/10 border border-neon-gold/30"
          style={{ boxShadow: '0 0 20px rgba(255,215,0,0.15)' }}
        >
          <MdMonetizationOn className="text-neon-gold text-2xl" />
          <div>
            <p className="text-xl font-bold text-neon-gold">{coins}</p>
            <p className="text-[10px] text-white/40 -mt-0.5">coins</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${tab === t.key
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'text-white/40 hover:text-white bg-navy-800/50'}`}>
            <t.icon className="text-base" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

          {/* ── DAILY REWARD ── */}
          {tab === 'daily' && (
            <div className="space-y-5">
              {/* Claim card */}
              <div className="glass-card p-6 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(180,77,255,0.1), rgba(77,159,255,0.05))' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neon-purple/5 to-transparent" />
                </div>

                <motion.div
                  animate={dailyStatus?.canClaim ? { y: [0, -8, 0], scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  {dailyStatus?.canClaim ? '🎁' : '✅'}
                </motion.div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {dailyStatus?.canClaim ? 'Daily Reward Ready!' : 'Come Back Tomorrow!'}
                </h2>

                {dailyStatus?.canClaim ? (
                  <>
                    <p className="text-white/50 text-sm mb-2">
                      Claim your reward for Day {dailyStatus?.currentStreak}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/20 border border-neon-gold/30 mb-5">
                      <MdMonetizationOn className="text-neon-gold" />
                      <span className="text-neon-gold font-bold text-lg">+{dailyStatus?.nextReward} coins</span>
                      {dailyStatus?.currentStreak % 7 === 0 && (
                        <span className="text-xs bg-neon-gold text-navy-900 px-2 py-0.5 rounded-full font-bold">WEEKLY BONUS!</span>
                      )}
                    </div>
                    <button onClick={handleClaimDaily} disabled={claimLoading}
                      className="neon-btn px-10 flex items-center gap-3 mx-auto disabled:opacity-50">
                      {claimLoading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Claiming...</>
                        : <><MdCheckCircle className="text-xl" />Claim Reward</>
                      }
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-white/50 text-sm mb-2">
                      You've claimed today's reward
                    </p>
                    <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                      <MdTimer />
                      <span>Next reward in {dailyStatus?.hoursUntilNext}h</span>
                    </div>
                  </>
                )}
              </div>

              {/* Streak info */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MdLocalFireDepartment className="text-orange-400" />
                    Login Streak
                  </h3>
                  <span className="text-2xl font-bold text-orange-400">
                    {dailyStatus?.currentStreak || 0} 🔥
                  </span>
                </div>

                {/* Streak progress bar - 7 days */}
                <div className="grid grid-cols-7 gap-2">
                  {STREAK_REWARDS.map((r, i) => {
                    const dayNum = i + 1;
                    const isCompleted = (dailyStatus?.currentStreak || 0) >= dayNum;
                    const isToday = (dailyStatus?.currentStreak || 0) === dayNum && !dailyStatus?.canClaim;
                    const isNext = (dailyStatus?.currentStreak || 0) + 1 === dayNum && dailyStatus?.canClaim;
                    return (
                      <motion.div
                        key={dayNum}
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                          ${isCompleted ? 'bg-neon-purple/20 border-neon-purple/40' :
                            isNext ? 'bg-neon-gold/20 border-neon-gold/40 animate-pulse' :
                            'bg-navy-700/50 border-white/5'}`}
                      >
                        <span className="text-lg">{dayNum === 7 ? '🏆' : '🪙'}</span>
                        <span className={`text-[10px] font-bold ${isCompleted ? 'text-neon-purple' : isNext ? 'text-neon-gold' : 'text-white/30'}`}>
                          +{r.coins}
                        </span>
                        <span className="text-[9px] text-white/30">Day {dayNum}</span>
                        {isCompleted && <MdCheckCircle className="text-neon-purple text-xs" />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Just claimed animation */}
              <AnimatePresence>
                {justClaimed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="glass-card p-5 text-center border border-neon-gold/30"
                    style={{ boxShadow: '0 0 30px rgba(255,215,0,0.2)' }}
                  >
                    <p className="text-4xl mb-2">🎉</p>
                    <p className="text-white font-bold">+{justClaimed.coinsGiven} coins claimed!</p>
                    <p className="text-white/40 text-sm">Streak: {justClaimed.currentStreak} days</p>
                    <button onClick={() => setJustClaimed(null)} className="text-xs text-white/30 hover:text-white mt-2 transition-colors">dismiss</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── COIN SHOP ── */}
          {tab === 'shop' && (
            <div className="space-y-4">
              {/* Simulasi notice */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-neon-blue/20 bg-neon-blue/5">
                <GiCardPickup className="text-neon-blue text-2xl flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Demo Mode — No Real Payment</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Ini adalah simulasi pembelian. Klik Confirm untuk langsung dapat koin.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {packages.map((pkg, i) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card p-5 border transition-all relative overflow-hidden
                      ${pkg.popular
                        ? 'border-neon-gold/40 bg-gradient-to-br from-neon-gold/10 to-transparent'
                        : 'border-white/5 hover:border-neon-purple/20'}`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-neon-gold text-navy-900 text-[10px] font-bold flex items-center gap-1">
                        <MdStar className="text-xs" /> POPULAR
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{pkg.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{pkg.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-neon-gold font-bold text-lg">{pkg.coins}</span>
                          {pkg.bonus > 0 && (
                            <span className="text-xs text-green-400 font-semibold">+{pkg.bonus} bonus</span>
                          )}
                          <span className="text-white/40 text-xs">coins</span>
                        </div>
                      </div>
                    </div>

                    {pkg.bonus > 0 && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <MdCheckCircle className="text-green-400 text-sm flex-shrink-0" />
                        <span className="text-xs text-green-400">
                          Total {pkg.coins + pkg.bonus} coins ({pkg.bonus} bonus!)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-white/30">
                          ~Rp {Math.round(pkg.price / (pkg.coins + pkg.bonus))}/coin
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmPkg(pkg)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                          ${pkg.popular
                            ? 'bg-gradient-to-r from-neon-gold to-yellow-500 text-navy-900 hover:shadow-neon-gold'
                            : 'neon-btn'}`}
                      >
                        <MdShoppingCart /> Buy
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div className="space-y-3">
              {purchaseHistory.length > 0 ? purchaseHistory.map((h, i) => (
                <motion.div key={h.id}
                  initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 border border-white/5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${h.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {h.status === 'success'
                      ? <MdCheckCircle className="text-green-400 text-xl" />
                      : <MdTimer className="text-red-400 text-xl" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{h.package_name}</p>
                    <p className="text-xs text-white/40 truncate">ID: {h.transaction_id}</p>
                    <p className="text-xs text-white/30">
                      {new Date(h.purchased_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-neon-gold font-bold">+{h.coins_amount}</p>
                    <p className="text-xs text-white/30">Rp {h.price_idr.toLocaleString('id-ID')}</p>
                  </div>
                </motion.div>
              )) : (
                <EmptyState icon="🧾" title="No purchase history" description="Buy a coin package to see your history here" />
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Confirm purchase modal */}
      {confirmPkg && (
        <ConfirmModal
          pkg={confirmPkg}
          onConfirm={handlePurchase}
          onClose={() => setConfirmPkg(null)}
          loading={purchaseLoading}
        />
      )}
    </div>
  );
}
