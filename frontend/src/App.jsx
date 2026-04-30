import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Collection from './pages/Collection';
import Search from './pages/Search';
import Wishlist from './pages/Wishlist';
import DeckBuilder from './pages/DeckBuilder';
import PackSimulator from './pages/PackSimulator';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Trade from './pages/Trade';
import CoinShop from './pages/CoinShop';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-neon-purple/30 border-t-neon-purple animate-spin" />
        <p className="text-white/50 font-poppins text-sm">Loading PocketDex...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#161632', color: '#fff',
              border: '1px solid rgba(180,77,255,0.3)',
              fontFamily: 'Poppins',
            },
            success: { iconTheme: { primary: '#b44dff', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ff4d6a', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="collection" element={<Collection />} />
            <Route path="search" element={<Search />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="decks" element={<DeckBuilder />} />
            <Route path="pack-simulator" element={<PackSimulator />} />
            <Route path="trade" element={<Trade />} />
            <Route path="coins" element={<CoinShop />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
