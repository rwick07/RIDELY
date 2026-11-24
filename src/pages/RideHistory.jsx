import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from '../router';
import { AuthContext } from '../auth/AuthContext';
import {
  getBookings,
  getBookingDate,
  formatCategoryName,
  getActiveRide,
  BASE_FARE,
  PER_KM,
  TYPE_SURCHARGE,
} from '../services/bookingService';
import {
  Car,
  History,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RideHistory() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};

  const [bookings, setBookings] = useState([]);
  const [activeRide, setActiveRideState] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);

  // Load bookings and active ride
  useEffect(() => {
    const list = getBookings(user?.email);
    // Sort most recent first
    const sorted = [...list].sort((a, b) => {
      const dateA = getBookingDate(a).getTime();
      const dateB = getBookingDate(b).getTime();
      return dateB - dateA;
    });
    setBookings(sorted);
    setActiveRideState(getActiveRide());
  }, [user]);

  // Normalize status for badges and filters
  const getNormalizedStatus = (booking) => {
    const status = (booking.status || '').toLowerCase();
    if (status.includes('cancel')) return 'Cancelled';
    if (status.includes('complete')) return 'Completed';
    return 'In Progress';
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const norm = getNormalizedStatus(b);
      if (filter === 'COMPLETED' && norm !== 'Completed') return false;
      if (filter === 'CANCELLED' && norm !== 'Cancelled') return false;
      if (filter === 'IN_PROGRESS' && norm !== 'In Progress') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = b.id?.toLowerCase().includes(q);
        const pMatch = b.pickup?.toLowerCase().includes(q);
        const dMatch = b.destination?.toLowerCase().includes(q);
        const typeMatch = b.type?.toLowerCase().includes(q);
        return idMatch || pMatch || dMatch || typeMatch;
      }
      return true;
    });
  }, [bookings, filter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    const c = { ALL: bookings.length, COMPLETED: 0, IN_PROGRESS: 0, CANCELLED: 0 };
    bookings.forEach((b) => {
      const norm = getNormalizedStatus(b);
      if (norm === 'Completed') c.COMPLETED += 1;
      else if (norm === 'Cancelled') c.CANCELLED += 1;
      else c.IN_PROGRESS += 1;
    });
    return c;
  }, [bookings]);

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const norm = status.toLowerCase();
    if (norm.includes('complete')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800">
          <CheckCircle size={12} className="mr-1" />
          Completed
        </span>
      );
    }
    if (norm.includes('cancel')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800">
          <XCircle size={12} className="mr-1" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock size={12} className="mr-1 animate-pulse" />
        In Progress
      </span>
    );
  };

  // Payment Badge Component
  const PaymentBadge = ({ paymentStatus, status }) => {
    const isCompleted = (status || '').toLowerCase().includes('complete');
    const isCancelled = (status || '').toLowerCase().includes('cancel');

    if (paymentStatus === 'Paid' || isCompleted) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CreditCard size={11} className="mr-1" />
          Paid
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          Not Applicable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
        <Clock size={11} className="mr-1" />
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mb-2 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Home
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <History size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Ride History</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View and manage all your past and live cab bookings
                </p>
              </div>
            </div>
          </div>

          {/* Quick Book CTA button */}
          <button
            type="button"
            onClick={() => navigate('/book')}
            className="self-start md:self-auto inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Car size={16} className="mr-2" />
            Book a Ride
          </button>
        </div>

        {/* Active Ride Alert Banner (if any) */}
        {activeRide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
                <Car size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                    Live Ride in Progress
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {activeRide.pickup} → {activeRide.destination} (₹{activeRide.fare})
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Your active ride continues uninterrupted while browsing history.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition-colors"
            >
              Track Live Ride
              <ChevronRight size={16} className="ml-1" />
            </button>
          </motion.div>
        )}

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tab Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Rides', count: counts.ALL },
              { id: 'COMPLETED', label: 'Completed', count: counts.COMPLETED },
              { id: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
              { id: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-border'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-xs ${
                      active
                        ? 'bg-indigo-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ID or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content: List or Empty State */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
              {bookings.length === 0 ? 'No Ride History' : 'No Rides Found'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {bookings.length === 0
                ? "You haven't booked any rides with RIDELY yet. Book your first ride and experience seamless travel across Bengaluru!"
                : 'No rides matched your active filter or search keyword. Try clearing your search.'}
            </p>
            {bookings.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <Car size={16} className="mr-2" />
                Book Your First Ride
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setSearchQuery('');
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((b) => {
              const rideDate = getBookingDate(b);
              const isLive = activeRide && activeRide.id === b.id;
              const categoryName = formatCategoryName(b.type);

              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedRide(b)}
                  className={`cursor-pointer rounded-xl border bg-white dark:bg-dark-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isLive
                      ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 dark:border-dark-border'
                  }`}
                >
                  <div>
                    {/* Top row: Ride ID & Badges */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {b.id}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Calendar size={12} className="mr-1" />
                          <span>
                            {rideDate.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="mx-1">•</span>
                          <Clock size={12} className="mr-1" />
                          <span>
                            {rideDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <StatusBadge status={b.status} />
                        {isLive && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Route Visualizer */}
                    <div className="space-y-3 mb-4">
                      {/* Pickup */}
                      <div className="flex items-start space-x-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Pickup
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {b.pickup}
                          </p>
                        </div>
                      </div>

                      {/* Route Line */}
                      <div className="ml-1.5 border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-4" />

                      {/* Destination */}
                      <div className="flex items-start space-x-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-950/60 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Destination
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {b.destination}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                        {categoryName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {b.distance} km
                      </span>
                      <PaymentBadge paymentStatus={b.paymentStatus} status={b.status} />
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total Fare</p>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                          ₹{b.fare}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detailed Ride Modal */}
        <AnimatePresence>
          {selectedRide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/40">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Car size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                        Ride Details
                      </h3>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {selectedRide.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRide(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                  {/* Status row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs text-gray-400">Ride Status</p>
                      <div className="mt-0.5">
                        <StatusBadge status={selectedRide.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Status</p>
                      <div className="mt-0.5">
                        <PaymentBadge
                          paymentStatus={selectedRide.paymentStatus}
                          status={selectedRide.status}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Booked On</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                        {getBookingDate(selectedRide).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Route */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Trip Route
                    </h4>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-border space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Pickup</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {selectedRide.pickup}
                          </p>
                        </div>
                      </div>
                      <div className="ml-1.5 border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-4" />
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Destination</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {selectedRide.destination}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Driver Details
                    </h4>
                    <div className="flex items-center p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-gray-800/40">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mr-3">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          Alex Patel
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Toyota Prius • XYZ 1234
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-yellow-500">
                          ★ 4.8
                        </span>
                        <p className="text-[10px] text-gray-400">Verified Driver</p>
                      </div>
                    </div>
                  </div>

                  {/* Fare Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Fare Breakdown ({formatCategoryName(selectedRide.type)})
                    </h4>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-border space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Base Fare</span>
                        <span>₹{BASE_FARE}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>
                          Distance Fare ({selectedRide.distance} km × ₹{PER_KM}/km)
                        </span>
                        <span>₹{selectedRide.distance * PER_KM}</span>
                      </div>
                      {TYPE_SURCHARGE[selectedRide.type] > 0 && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>
                            {formatCategoryName(selectedRide.type)} Tier Surcharge
                          </span>
                          <span>₹{TYPE_SURCHARGE[selectedRide.type]}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                        <span>Total Fare</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          ₹{selectedRide.fare}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/40 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRide(null)}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  {activeRide && activeRide.id === selectedRide.id && (
                    <button
                      type="button"
                      onClick={() => navigate('/book')}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                    >
                      View Live Status
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
