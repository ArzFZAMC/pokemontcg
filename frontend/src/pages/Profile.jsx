import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collectionAPI, achievementsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdEdit, MdSave, MdLogout } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const TYPES = ['Fire','Water','Grass','Electric','Psychic','Fighting','Darkness','Metal','Dragon','Fairy','Colorless'];
const TYPE_EMOJI = { Fire:'🔥', Water:'💧', Grass:'🌿', Electric:'⚡', Psychic:'🔮', Fighting:'🥊', Darkness:'🌑', Metal:'⚙️', Dragon:'🐉', Fairy:'🧚', Colorless:'⭐' };

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ avatar_url: user?.avatar_url || '', favorite_type: user?.favorite_type || '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    collectionAPI.getStats().then(r => setStats(r.data)).catch(() => {});
    achievementsAPI.getAll().then(r => setAchievements(r.data.data || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      setUser(prev => ({ ...prev, ...form }));
      localStorage.setItem('pdex_user', JSON.stringify({ ...user, ...form }));
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  return (
    <div className="space-y-6 page-transition max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-start gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-neon-purple/40"
                onError={e => e.target.style.display='none'} />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-3xl font-bold text-white"
                style={{ boxShadow: '0 0 20px rgba(180,77,255,0.4)' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-white font-poppins">{user?.username}</h1>
                <p className="text-white/40 text-sm">{user?.email}</p>
                {joinDate && <p className="text-white/30 text-xs mt-1">Trainer since {joinDate}</p>}
              </div>
              <button onClick={() => setEditing(p => !p)}
                className={`p-2.5 rounded-xl border transition-all ${editing ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple' : 'bg-navy-700 border-white/10 text-white/50 hover:text-white'}`}>
                <MdEdit className="text-lg" />
              </button>
            </div>
            {user?.favorite_type && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-white/40">Favorite type:</span>
                <span className="text-sm font-medium text-white">
                  {TYPE_EMOJI[user.favorite_type]} {user.favorite_type}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 pt-5 border-t border-white/10 space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Avatar URL</label>
              <input type="url" placeholder="https://..." value={form.avatar_url}
                onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
                className="input-glass text-sm" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Favorite Type</label>
              <select value={form.favorite_type} onChange={e => setForm(p => ({ ...p, favorite_type: e.target.value }))}
                className="input-glass text-sm">
                <option value="">Select type...</option>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="neon-btn text-sm flex items-center gap-2 px-6">
              <MdSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Cards', value: stats?.stats?.total || 0, color: 'text-neon-purple' },
          { label: 'Favorites', value: stats?.stats?.favorites || 0, color: 'text-red-400' },
          { label: 'Achievements', value: achievements.length, color: 'text-neon-gold' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold font-poppins ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements earned */}
      {achievements.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((ach, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.07, type: 'spring' }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-neon-gold/10 to-transparent border border-neon-gold/20"
                title={ach.achievement_desc}>
                <span className="text-2xl">{ach.achievement_icon}</span>
                <span className="text-[10px] text-white/60 text-center leading-tight">{ach.achievement_name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center justify-center gap-2 font-medium">
        <MdLogout /> Logout
      </button>
    </div>
  );
}
