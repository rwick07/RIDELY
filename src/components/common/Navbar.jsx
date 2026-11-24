import React, { useContext, useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { Menu, X, Car, History, LogOut, ChevronRight, User, Home as HomeIcon } from 'lucide-react';
import { AuthContext } from '../../auth/AuthContext';
import { useNavigate, useLocation } from '../../router';
import { getActiveRide } from '../../services/bookingService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRide, setActiveRide] = useState(null);

  // Check active ride status on mount and path change
  useEffect(() => {
  const syncActiveRide = () => {
    setActiveRide(getActiveRide());
  };

  syncActiveRide();

  window.addEventListener('rideUpdated', syncActiveRide);

  return () => {
    window.removeEventListener('rideUpdated', syncActiveRide);
  };
  }, [pathname, isDrawerOpen]);

  const handleNav = (path) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = () => {
    setIsDrawerOpen(false);
    if (logout) logout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border shadow-sm transition-colors">
        {/* Left side: Hamburger menu + Brand + Desktop links */}
        <div className="flex items-center space-x-3">
          {user && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Open navigation menu"
            >
              <Menu size={22} className="text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center space-x-1.5 text-xl font-bold text-gray-900 dark:text-gray-100 hover:opacity-90 transition-opacity"
          >
            <span className="text-indigo-600 dark:text-indigo-400">RIDELY</span>
          </button>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 ml-4 pl-4 border-l border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => handleNav('/')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <HomeIcon size={16} />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('/book')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/book'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Car size={16} />
                <span>Book Ride</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('/history')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/history'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <History size={16} />
                <span>Ride History</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('/profile')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/profile'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <User size={16} />
                <span>Profile</span>
              </button>

              {activeRide && activeRide.status !== 'Completed' && activeRide.status !== 'Cancelled' &&(
                <button
                  type="button"
                  onClick={() => handleNav('/book')}
                  className="ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5 hover:bg-emerald-100 transition-colors"
                  title="Active ride ongoing - click to view live status"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Ride in Progress</span>
                </button>
              )}
            </nav>
          )}
        </div>

        {/* Right side: User Profile info + ThemeToggle */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <button
                type="button"
                onClick={() => handleNav('/profile')}
                className="flex items-center space-x-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="View Profile & Settings"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {user.name}
                </span>
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Logout
              </motion.button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Slide-out Sidebar Drawer */}
      <AnimatePresence>
        {isDrawerOpen && user && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border shadow-2xl flex flex-col justify-between z-10"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      RIDELY
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Info Card (Clickable to go to Profile) */}
                <div
                  onClick={() => handleNav('/profile')}
                  className="cursor-pointer p-3.5 mx-3 my-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 flex items-center space-x-3 transition-colors"
                  title="Manage Profile"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                {/* Navigation Options */}
                <nav className="p-3 space-y-1.5">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    Navigation
                  </p>

                  <button
                    type="button"
                    onClick={() => handleNav('/')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === '/'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <HomeIcon size={18} />
                      <span>Home</span>
                    </div>
                    <ChevronRight size={16} className="opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('/book')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === '/book'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Car size={18} />
                      <span>Book a Ride</span>
                    </div>
                    <ChevronRight size={16} className="opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('/history')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === '/history'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <History size={18} />
                      <span>Ride History</span>
                    </div>
                    <ChevronRight size={16} className="opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('/profile')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === '/profile'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User size={18} />
                      <span>Profile & Settings</span>
                    </div>
                    <ChevronRight size={16} className="opacity-60" />
                  </button>

                  {/* Active Ride Card in Drawer */}
                  {activeRide && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleNav('/book')}
                        className="w-full text-left p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">Active Ride</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 truncate">
                          {activeRide.pickup} → {activeRide.destination}
                        </p>
                      </button>
                    </div>
                  )}
                </nav>
              </div>

              {/* Drawer Footer: Logout */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
