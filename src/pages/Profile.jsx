import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from '../router';
import { AuthContext } from '../auth/AuthContext';
import {
  updateUserProfile,
  changeUserPassword,
  getFullCurrentUser,
} from '../auth/authService';
import { getBookings } from '../services/bookingService';
import {
  User,
  Mail,
  Phone,
  Lock,
  Key,
  ShieldCheck,
  Calendar,
  Car,
  Sun,
  Moon,
  LogOut,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useContext(AuthContext) || {};

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberSince, setMemberSince] = useState(null);
  const [totalRides, setTotalRides] = useState(0);

  // Status & feedback states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  // Load user data on mount
  useEffect(() => {
    const full = getFullCurrentUser() || user;
    if (full) {
      setName(full.name || '');
      setEmail(full.email || '');
      setPhone(full.phone || '');
      setMemberSince(full.createdAt ? new Date(full.createdAt) : null);

      // Total rides taken
      const bookings = getBookings(full.email);
      setTotalRides(bookings.length);
    }
  }, [user]);

  // Handle Theme Toggle
  const handleThemeChange = (dark) => {
    setIsDark(dark);
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('theme-changed'));
  };

  // Avatar Initials
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Full name cannot be empty');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      setProfileError('Please enter a valid phone number (7-15 digits)');
      return;
    }

    setProfileSaving(true);
    try {
      const updatedSession = await updateUserProfile(user.email, {
        name,
        email,
        phone,
      });

      if (updateUser) {
        updateUser(updatedSession);
      }

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      setPwError('Please enter your current password');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwSaving(true);
    try {
      await changeUserPassword(user.email, currentPassword, newPassword);
      setPwSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Home
          </button>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <History size={16} className="mr-1.5" />
            View Ride History
          </button>
        </div>

        {/* Profile Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          {/* Initials Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-indigo-100 dark:ring-indigo-950 flex-shrink-0">
            {getInitials(name || user?.name)}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {name || user?.name}
              </h1>
              <span className="self-center sm:self-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck size={12} className="mr-1" />
                Verified Rider
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {email || user?.email}
            </p>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Car size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  <strong>{totalRides}</strong> {totalRides === 1 ? 'Ride' : 'Rides'} Booked
                </span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  Member since{' '}
                  {memberSince
                    ? memberSince.toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid: Left Column = Edit Profile, Right Column = Settings & Password */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Edit Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Personal Information
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your personal profile and contact details
                  </p>
                </div>
              </div>

              {/* Feedback banners */}
              <AnimatePresence>
                {profileSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center space-x-2"
                  >
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </motion.div>
                )}
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 text-xs flex items-center space-x-2"
                  >
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    <span>{profileError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Form */}
              <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Used for ride receipts and booking notifications.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Drivers will use this number to contact you at pickup.
                  </p>
                </div>
              </form>
            </div>

            <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                form="profile-form"
                disabled={profileSaving}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Save size={16} className="mr-2" />
                {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </motion.div>

          {/* Section 2: Security & Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Security & Password
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage your credentials and account password
                  </p>
                </div>
              </div>

              {/* Password Feedback */}
              <AnimatePresence>
                {pwSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center space-x-2"
                  >
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{pwSuccess}</span>
                  </motion.div>
                )}
                {pwError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 text-xs flex items-center space-x-2"
                  >
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    <span>{pwError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Form */}
              <form id="pw-form" onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Key
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                form="pw-form"
                disabled={pwSaving}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Key size={16} className="mr-2" />
                {pwSaving ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Section 3: App Preferences & Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm space-y-6"
        >
          {/* Header */}
          <div className="pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Preferences & Account Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure your app appearance and manage your session
              </p>
            </div>
          </div>

          {/* Theme Preference Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Appearance & Theme
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle between light and dark modes according to your preference
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleThemeChange(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  !isDark
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-300 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Sun size={15} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isDark
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Moon size={15} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Account Information Summary */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Account Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">Account Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Active & Verified
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">Authentication</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Local Encrypted (SHA-256)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">Registered Email</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block">
                  {email || user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Log Out of RIDELY
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                End your active session on this device
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <LogOut size={14} className="mr-1.5" />
              Log Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
