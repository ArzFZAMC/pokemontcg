import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdCollections, MdSearch, MdFavorite,
  MdViewModule, MdPerson, MdEmojiEvents,
  MdLogout, MdMenu, MdClose, MdSwapHoriz, MdMonetizationOn
} from 'react-icons/md';
import { GiCardPickup } from 'react-icons/gi';

const navItems = [
  { to: '/', icon: MdDashboard, label: 'Dashboard' },
  { to: '/collection', icon: MdCollections, label: 'Collection' },
  { to: '/search', icon: MdSearch, label: 'Search' },
  { to: '/wishlist', icon: MdFavorite, label: 'Wishlist' },
  { to: '/decks', icon: MdViewModule, label: 'Decks' },
  { to: '/pack-simulator', icon: GiCardPickup, label: 'Pack Opening' },
  { to: '/trade', icon: MdSwapHoriz, label: 'Trade' },
  { to: '/coins', icon: MdMonetizationOn, label: 'Coins', highlight: true },
  { to: '/achievements', icon: MdEmojiEvents, label: 'Achievements' },
  { to: '/profile', icon: MdPerson, label: 'Profile' },
];

const bottomNavItems = [
  { to: '/', icon: MdDashboard, label: 'Home' },
  { to: '/collection', icon: MdCollections, label: 'Cards' },
  { to: '/pack-simulator', icon: GiCardPickup, label: 'Packs' },
  { to: '/trade', icon: MdSwapHoriz, label: 'Trade' },
  { to: '/coins', icon: MdMonetizationOn, label: 'Coins' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }, highlight) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
     ${isActive
       ? 'bg-gradient-to-r from-neon-purple/20 to-neon-blue/10 text-white border border-neon-purple/30'
       : highlight
         ? 'text-neon-gold/70 hover:text-neon-gold hover:bg-neon-gold/10'
         : 'text-white/50 hover:text-white hover:bg-white/5'}`;

  return (
    <div className="h-screen bg-navy-900 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-navy-800/50 border-r border-white/5 p-4 sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 mb-6 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-neon-purple">
            <GiCardPickup className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white font-poppins glow-text-purple">PocketDex</h1>
            <p className="text-xs text-white/40">TCG Collection</p>
          </div>
        </div>

        {/* User card */}
        <div className="glass-card p-3 mb-6 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.to === '/'}
              className={(props) => navLinkClass(props, item.highlight)}
            >
              <item.icon className={`text-lg flex-shrink-0 ${item.highlight ? 'text-neon-gold' : ''}`} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/20">
                  NEW
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all mt-4 flex-shrink-0">
          <MdLogout className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-navy-800 border-r border-white/5 z-50 p-4 flex flex-col lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                    <GiCardPickup className="text-white text-xl" />
                  </div>
                  <h1 className="font-bold text-lg text-white">PocketDex</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white">
                  <MdClose className="text-2xl" />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.to} to={item.to} end={item.to === '/'}
                    className={(props) => navLinkClass(props, item.highlight)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`text-lg ${item.highlight ? 'text-neon-gold' : ''}`} />
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/20">
                        NEW
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/70 hover:text-red-400 transition-all">
                <MdLogout className="text-lg" />
                <span>Logout</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy-800/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white">
            <MdMenu className="text-2xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
              <GiCardPickup className="text-white text-sm" />
            </div>
            <span className="font-bold text-white font-poppins">PocketDex</span>
          </div>
          <NavLink to="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </NavLink>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto overflow-x-hidden">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navy-800/90 backdrop-blur-lg border-t border-white/5 z-30 lg:hidden bottom-nav">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200
                 ${isActive
                   ? item.to === '/coins' ? 'text-neon-gold' : 'text-neon-purple'
                   : 'text-white/40'}`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div animate={{ scale: isActive ? 1.1 : 1 }}>
                    <item.icon className="text-2xl" />
                  </motion.div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
