import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, MapPin, Navigation, Clock, ShieldCheck, X, Check, Users } from 'lucide-react';

export default function BookingConfirmation({ summary, isOpen, onConfirm, onCancel }) {
  if (!isOpen || !summary) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        {/* Backdrop click to cancel */}
        <motion.div
          className="fixed inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-md overflow-hidden z-10"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-dark-bg/40">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Car size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Confirm Booking
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please review your trip details
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Route Summary */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0 ring-2 ring-emerald-100 dark:ring-emerald-950" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Pickup Location
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {summary.pickup}
                  </p>
                </div>
              </div>

              <div className="ml-1.5 border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-3" />

              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0 ring-2 ring-red-100 dark:ring-red-950" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Destination
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {summary.destination}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Option Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
                <span className="text-gray-400 block mb-0.5">Ride Category</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-1">
                  <span>{summary.name || summary.type}</span>
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  {summary.capacity || 4} Seats • {summary.eta || '3 min'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
                <span className="text-gray-400 block mb-0.5">Estimated Distance</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  {summary.distance} km
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  Direct Bengaluru route
                </span>
              </div>
            </div>

            {/* Fare Summary Box */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  Total Estimated Fare
                </p>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Includes base fare, distance & taxes
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  ₹{summary.fare}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              Payment is made upon arrival via Cash or UPI demo.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-3 bg-gray-50/60 dark:bg-dark-bg/40">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check size={16} />
              <span>Confirm & Book Ride</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
