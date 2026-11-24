import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from '../router';
import { AuthContext } from '../auth/AuthContext';
import { getBookings, getBookingDate, formatCategoryName, getActiveRide } from '../services/bookingService';
import { BENGALURU_PRESETS } from '../constants/locations';
import {
  Car,
  History,
  User,
  MapPin,
  Navigation,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plane,
  Building2,
  Train,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};

  const [recentRides, setRecentRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

  // Load user data and recent rides on mount
  useEffect(() => {
    const list = getBookings(user?.email);
    // Sort recent first and take up to 3
    const sorted = [...list].sort((a, b) => {
      const dateA = getBookingDate(a).getTime();
      const dateB = getBookingDate(b).getTime();
      return dateB - dateA;
    });
    setRecentRides(sorted.slice(0, 3));

    const active = getActiveRide();
    if (active && (!active.userEmail || (user?.email && active.userEmail.toLowerCase() === user.email.toLowerCase()))) {
      setActiveRide(active);
    } else {
      setActiveRide(null);
    }
  }, [user]);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Rider';

  // Quick Action: Book Again for a recent ride
  const handleBookAgain = (ride) => {
    sessionStorage.setItem(
      'rident_prefill_booking',
      JSON.stringify({
        pickup: ride.pickup,
        destination: ride.destination,
      })
    );
    navigate('/book');
  };

  // Quick destination preset selection
  const handleSelectPreset = (presetName) => {
    sessionStorage.setItem(
      'rident_prefill_booking',
      JSON.stringify({
        destination: presetName,
      })
    );
    navigate('/book');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Active Ride Alert Banner (if any) */}
        {activeRide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl mt-0.5">
                <Car size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                    Active Ride in Progress
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {activeRide.pickup} → {activeRide.destination} (₹{activeRide.fare})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/book')}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
            >
              <span>Track Live Ride</span>
              <ChevronRight size={14} className="ml-1" />
            </button>
          </motion.div>
        )}

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-700/40"
        >
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            {/* Personalized greeting */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-200 font-medium mb-4">
              <span>{greeting}, {firstName}!</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-3">
              Where would you like to go today?
            </h1>

            <p className="text-sm sm:text-base text-indigo-200/90 font-normal mb-8 leading-relaxed">
              Safe, fast and transparent cab rides across Bengaluru. Doorstep pickup in 2–4 minutes with verified drivers.
            </p>

            {/* Hero CTA & Quick Location Pills */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Car size={18} className="mr-2" />
                <span>Book a Ride Now</span>
                <ArrowRight size={18} className="ml-2" />
              </button>

              {/* Quick Preset Destination Pills */}
              <div className="pt-2">
                <p className="text-xs text-indigo-300/80 uppercase tracking-wider font-semibold mb-2">
                  Popular destinations in Bengaluru:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Kempegowda International Airport (BLR)', label: 'BLR Airport', icon: Plane },
                    { name: 'KSR Bengaluru City Railway Station (Majestic)', label: 'Majestic Station', icon: Train },
                    { name: 'International Tech Park Bengaluru (ITPL)', label: 'ITPL Whitefield', icon: Building2 },
                    { name: 'Koramangala (Sony World Signal)', label: 'Koramangala', icon: MapPin },
                    { name: 'Indiranagar (100 Feet Road)', label: 'Indiranagar', icon: MapPin },
                  ].map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset.name)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-white transition-all backdrop-blur-sm"
                      >
                        <Icon size={12} className="text-emerald-400" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Action Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Book a Ride */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/book')}
            className="cursor-pointer p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Car size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Book a Ride
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Instant pickup & live map tracking
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Choose ride & fare</span>
              <ArrowRight size={14} />
            </div>
          </motion.div>

          {/* Card 2: Ride History */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/history')}
            className="cursor-pointer p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <History size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Ride History
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Past trips & digital receipts
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>View trip history</span>
              <ArrowRight size={14} />
            </div>
          </motion.div>

          {/* Card 3: Profile & Settings */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate('/profile')}
            className="cursor-pointer p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <User size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  Account Settings
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Profile, security & preferences
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Manage account</span>
              <ArrowRight size={14} />
            </div>
          </motion.div>
        </div>

        {/* Promotional / Demo Offer Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
              Prototype Demo Offer
            </span>
            <h3 className="text-lg font-extrabold text-white">
              Airport Rush? Save 20% on BLR Airport rides
            </h3>
            <p className="text-xs text-emerald-50 max-w-xl">
              Use demo promo code <strong className="font-mono bg-white/20 px-1 py-0.5 rounded">RIDELY20</strong> for discounted airport drop-offs and pickups across Bengaluru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectPreset('Kempegowda International Airport (BLR)')}
            className="self-start sm:self-auto px-4 py-2 bg-white text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-50 shadow transition-colors whitespace-nowrap"
          >
            Book Airport Cab
          </button>
        </div>

        {/* Ride Categories Section (Mini, Comfort, Premium) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Explore Ride Categories
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tailored vehicle types to fit your budget and travel style
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              <span>Compare Fares</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category 1: Mini */}
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Best Value
                  </span>
                  <span className="text-xs text-gray-400">3 Seats</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  RIDELY Mini
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Compact Hatchback (Swift, WagonR)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Everyday economical rides ideal for solo commuters, quick errands, and hassle-free city travel.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Base Fare</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">₹20 + ₹5/km</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                >
                  Select Mini
                </button>
              </div>
            </div>

            {/* Category 2: Comfort */}
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-indigo-200 dark:border-indigo-800/60 shadow-sm flex flex-col justify-between ring-1 ring-indigo-500/10">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Most Popular
                  </span>
                  <span className="text-xs text-gray-400">4 Seats</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  RIDELY Comfort
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Spacious Sedan (Dzire, Etios)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Extra legroom, climate-controlled cabins, and top-rated drivers for a smooth, relaxed journey.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Base Fare</span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">₹30 + ₹5/km</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Select Comfort
                </button>
              </div>
            </div>

            {/* Category 3: Premium */}
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Executive
                  </span>
                  <span className="text-xs text-gray-400">4-6 Seats</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  RIDELY Premium
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Executive Sedan / SUV (Innova, City)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Luxury vehicles with spacious seating and VIP hospitality for business meetings and airport rides.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Base Fare</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">₹40 + ₹5/km</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                >
                  Select Premium
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rides Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Recent Rides
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quickly repeat previous trips or review past bookings
              </p>
            </div>
            {recentRides.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                <span>View Full History</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {recentRides.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">
                No recent rides yet
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
                You haven't completed any trips with RIDELY yet. Book your first ride across Bengaluru!
              </p>
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Car size={14} className="mr-1.5" />
                <span>Book Your First Ride</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRides.map((ride) => {
                const date = getBookingDate(ride);
                const isCompleted = (ride.status || '').toLowerCase().includes('complete');
                const isCancelled = (ride.status || '').toLowerCase().includes('cancel');

                return (
                  <div
                    key={ride.id}
                    className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Date & Status Badge */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {isCompleted ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} className="mr-1" />
                            Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                            <XCircle size={10} className="mr-1" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                            <Clock size={10} className="mr-1" />
                            In Progress
                          </span>
                        )}
                      </div>

                      {/* Route Summary */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {ride.pickup}
                          </p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {ride.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Fare & Book Again Button */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block">
                          {formatCategoryName(ride.type)} • {ride.distance} km
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          ₹{ride.fare}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookAgain(ride)}
                        title="Book again with same pickup and destination"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>Book Again</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
