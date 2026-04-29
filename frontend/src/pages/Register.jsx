import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created! Welcome, Trainer! 🎴');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue shadow-neon-purple mb-4">
            <GiCardPickup className="text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-white font-poppins">PocketDex</h1>
          <p className="text-white/40 mt-1">Start your TCG journey</p>
        </div>
        <div className="glass-card p-8 neon-border">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input type="text" placeholder="Username" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="input-glass pl-11" required />
            </div>
            <div className="relative">
              <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-glass pl-11" required />
            </div>
            <div className="relative">
              <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input type={showPwd ? 'text' : 'password'} placeholder="Password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-glass pl-11 pr-11" required />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showPwd ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
              </button>
            </div>
            <div className="relative">
              <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input type={showPwd ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                className="input-glass pl-11" required />
            </div>
            <button type="submit" disabled={loading} className="neon-btn w-full text-center disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-purple hover:text-neon-blue transition-colors font-medium">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
