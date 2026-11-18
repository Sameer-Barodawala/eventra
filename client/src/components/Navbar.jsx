import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, User, LogOut, Ticket, Search, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors">
          <Film className="w-8 h-8" />
          <span className="font-black text-2xl tracking-wider text-white">
            EVENT<span className="text-rose-500">RA</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movies, genres, languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
        </form>

        {/* Right side: City & User controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300 text-sm bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <MapPin className="w-4 h-4 text-rose-500" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Mumbai" className="bg-slate-900">Mumbai</option>
              <option value="Delhi-NCR" className="bg-slate-900">Delhi-NCR</option>
              <option value="Bengaluru" className="bg-slate-900">Bengaluru</option>
              <option value="Hyderabad" className="bg-slate-900">Hyderabad</option>
            </select>
          </div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full border border-slate-700 transition"
              >
                <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline">{user?.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/my-bookings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Ticket className="w-4 h-4 text-rose-500" />
                    My Bookings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
