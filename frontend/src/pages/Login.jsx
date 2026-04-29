import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back, Trainer! 🎴');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue shadow-neon-purple mb-4"
            animate={{ boxShadow: ['0 0 20px rgba(180,77,255,0.3)', '0 0 40px rgba(180,77,255,0.7)', '0 0 20px rgba(180,77,255,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GiCardPickup className="text-white text-4xl" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white font-poppins glow-text-purple">PocketDex</h1>
          <p className="text-white/40 mt-1">TCG Collection Tracker</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 neon-border">
          <h2 className="text-xl font-semibold text-white mb-6">Welcome Back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-glass pl-11"
                required
              />
            </div>
            <div className="relative">
              <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-glass pl-11 pr-11"
                required
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showPwd ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
              </button>
            </div>

            <button type="submit" disabled={loading} className="neon-btn w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-purple hover:text-neon-blue transition-colors font-medium">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
