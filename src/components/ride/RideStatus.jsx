  import React, { useEffect, useState, useRef } from 'react';
  import {
    getActiveStatus,
    storeActiveStatus,
    clearActiveRide,
    clearActiveStatus,
    updateBookingStatus,
    storeActiveRide,
    formatCategoryName,
  } from '../../services/bookingService';
  import { motion, AnimatePresence } from 'framer-motion';
  import {
    Phone,
    PhoneOff,
    MessageSquare,
    Send,
    Navigation,
    Compass,
    Eye,
    CheckCircle2,
    X,
    Mic,
    Volume2,
    ShieldCheck,
    Star,
    Car,
    Clock,
    MapPin,
    Sparkles,
  } from 'lucide-react';

  // Fixed simulated driver info
  const DRIVER_INFO = {
    name: 'Alex Patel',
    phone: '+91 98765-43210',
    vehicle: 'Toyota Prius (White)',
    plate: 'KA 03 MX 4821',
    rating: 4.9,
    trips: '1,420 trips',
  };

  // Status stages
  const STATUS_STAGES = [
    'Ride Confirmed',
    'Driver Assigned',
    'Driver Arriving',
    'Driver Arrived',
    'Ride in Progress',
    'Ride Completed',
  ];

  export default function RideStatus({
    booking,
    stage: externalStage,
    onStageChange,
    onCancel,
    onBackHome,
    trackingMetrics,
    followDriver = true,
    onToggleFollowDriver,
    onFitOverview,
  }) {
    if (!booking) return null;

    const [internalStage, setInternalStage] = useState(() => getActiveStatus());
    const stage = typeof externalStage === 'number' ? externalStage : internalStage;

    const [startTime, setStartTime] = useState(() => {
      const saved = localStorage.getItem('rident_ride_start_time');
      return saved ? new Date(saved) : null;
    });
    const [endTime, setEndTime] = useState(() => {
      const saved = localStorage.getItem('rident_ride_end_time');
      return saved ? new Date(saved) : null;
    });

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [showCancelPrompt, setShowCancelPrompt] = useState(false);

    // Simulated Call & Message modals
    const [showCallModal, setShowCallModal] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [chatMessages, setChatMessages] = useState([
      { id: 1, sender: 'driver', text: 'Hello! I am on my way to your pickup point.', time: 'Just now' },
    ]);
    const [inputMsg, setInputMsg] = useState('');
    const chatBottomRef = useRef(null);

    // Sync state when booking changes
    useEffect(() => {
      const st = getActiveStatus();
      setInternalStage(st);
      if (onStageChange) onStageChange(st);
      setPaymentConfirmed(false);
      setPaymentMethod(null);
      setShowCancelPrompt(false);
    }, [booking?.id]);

    // Stage transition management
    const advanceStage = (next) => {
      setInternalStage(next);
      storeActiveStatus(next);
      if (onStageChange) onStageChange(next);

      if (next === 1) updateBookingStatus(booking.id, 'Driver Assigned');
      else if (next === 2) updateBookingStatus(booking.id, 'Driver Arriving');
      else if (next === 3) updateBookingStatus(booking.id, 'Driver Arrived');
      else if (next === 4) {
        const now = new Date();
        setStartTime(now);
        localStorage.setItem('rident_ride_start_time', now.toISOString());

        // Ensure the ride is stored as active for the Navbar
        storeActiveRide({
          ...booking,
          status: 'Ride in Progress',
          paymentStatus: booking.paymentStatus || 'Pending',
        });

        updateBookingStatus(booking.id, 'Ride in Progress');
      } else if (next === 5) {
        const now = new Date();
        setEndTime(now);
        localStorage.setItem('rident_ride_end_time', now.toISOString());
        updateBookingStatus(booking.id, 'Ride Completed');
      }
    };

    // Auto-advance lifecycle timer (if not driven externally)
    useEffect(() => {
      if (stage >= 5) return;
      // Stage durations tailored for realistic feel
      // 0 -> 1 (4s), 1 -> 2 (6s), 2 -> 3 (7s), 3 -> 4 (4s), 4 -> 5 (16s)
      const stageDelays = [4000, 6000, 7000, 4000, 16000];
      const delay = stageDelays[stage] || 6000;

      const timer = setTimeout(() => {
        advanceStage(stage + 1);
      }, delay);

      return () => clearTimeout(timer);
    }, [stage, booking?.id]);

    // Call simulation timer
    useEffect(() => {
      let callTimer;
      if (showCallModal) {
        setCallDuration(0);
        callTimer = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
      return () => clearInterval(callTimer);
    }, [showCallModal]);

    // Auto-scroll chat modal
    useEffect(() => {
      if (showMessageModal && chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [chatMessages, showMessageModal]);

    const formatSeconds = (s) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Send message in simulated chat
    const handleSendMessage = (textToSend) => {
      const msg = (textToSend || inputMsg).trim();
      if (!msg) return;

      const userMessage = {
        id: Date.now(),
        sender: 'user',
        text: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setInputMsg('');

      // Simulated driver response
      setTimeout(() => {
        const replies = [
          'Got it! Reaching your exact spot shortly.',
          'Thanks for letting me know, looking out for you!',
          'Understood. I will wait by the gate.',
          'Perfect, see you in a minute!',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'driver',
            text: randomReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1200);
    };

    // Confirm cancellation without browser popup
    const confirmCancellation = () => {
      updateBookingStatus(booking.id, 'Cancelled', 'Cancelled');
      clearActiveRide();
      clearActiveStatus();
      localStorage.removeItem('rident_ride_start_time');
      localStorage.removeItem('rident_ride_end_time');
      if (onCancel) onCancel();
    };

    const handlePaymentSelect = (method) => {
      setPaymentMethod(method);
    };

    const handlePaymentConfirm = () => {
      if (paymentMethod) {
        setPaymentConfirmed(true);
        updateBookingStatus(booking.id, 'Completed', 'Paid');
        clearActiveRide();
        clearActiveStatus();
        localStorage.removeItem('rident_ride_start_time');
        localStorage.removeItem('rident_ride_end_time');
      }
    };

    // Dynamic dynamic ETA and distance calculations
    const getDisplayMetrics = () => {
      if (trackingMetrics) {
        return {
          eta: trackingMetrics.etaText,
          distance: trackingMetrics.distanceRemainingKm,
          progress: trackingMetrics.progressPercent,
        };
      }

      // Fallbacks
      switch (stage) {
        case 0:
          return { eta: 'Finding nearest cab...', distance: 1.5, progress: 5 };
        case 1:
          return { eta: 'Driver assigned (~4m away)', distance: 1.3, progress: 20 };
        case 2:
          return { eta: 'Driver arriving in ~2m', distance: 0.6, progress: 65 };
        case 3:
          return { eta: 'Driver has arrived at pickup', distance: 0.0, progress: 100 };
        case 4:
          return { eta: 'Heading to destination', distance: booking.distance || 5.0, progress: 50 };
        case 5:
          return { eta: 'Trip Completed', distance: 0.0, progress: 100 };
        default:
          return { eta: 'Calculating...', distance: 0, progress: 0 };
      }
    };

    const metrics = getDisplayMetrics();

    return (
      <motion.aside
        className="w-full md:w-[410px] bg-white dark:bg-dark-card p-5 overflow-y-auto shadow-lg border-r border-gray-200 dark:border-dark-border z-20 flex flex-col justify-between"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Live Trip Tracking
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Interactive GPS driver movement simulation (Prototype)
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {STATUS_STAGES[stage]}
            </span>
          </div>

          {/* Live Map Control Bar (Follow Driver / Fit Overview) */}
          <div className="mb-4 p-2 rounded-xl bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
              <Compass size={15} className="text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
              <span>Map Camera</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleFollowDriver}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  followDriver
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                }`}
                title="Automatically center the map on the moving vehicle"
              >
                <Navigation size={12} className={followDriver ? 'animate-pulse' : ''} />
                {followDriver ? 'Following Driver' : 'Follow Off'}
              </button>
              <button
                type="button"
                onClick={onFitOverview}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1"
                title="Fit entire route and driver within map view"
              >
                <Eye size={12} />
                Overview
              </button>
            </div>
          </div>

          {/* Dynamic ETA & Distance Countdown Card */}
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200/80 dark:border-indigo-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Car size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                    {stage <= 3 ? 'Driver Arrival ETA' : 'Trip Destination ETA'}
                  </p>
                  <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">
                    {metrics.eta}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                  Distance
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {metrics.distance} km
                </p>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.progress}%` }}
                transition={{ ease: 'linear', duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
              <span>{stage <= 3 ? 'Driver dispatched' : 'Trip started'}</span>
              <span>{stage <= 3 ? 'At pickup' : 'At destination'}</span>
            </div>
          </div>

          {/* Driver Card with Demo Call & Message Buttons */}
          <div className="mb-4 p-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  AP
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{DRIVER_INFO.name}</p>
                    <ShieldCheck size={14} className="text-emerald-500" title="Verified Driver" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{DRIVER_INFO.vehicle}</p>
                  <p className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {DRIVER_INFO.plate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Star size={12} className="fill-amber-400 text-amber-500 mr-1" />
                  {DRIVER_INFO.rating}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{DRIVER_INFO.trips}</p>
              </div>
            </div>

            {/* Quick Contact Buttons (Simulated Prototypes) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/70 dark:border-gray-700/70">
              <button
                type="button"
                onClick={() => setShowCallModal(true)}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
                Call Driver
              </button>
              <button
                type="button"
                onClick={() => setShowMessageModal(true)}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <MessageSquare size={13} className="text-indigo-600 dark:text-indigo-400" />
                Message
              </button>
            </div>
          </div>

          {/* Booking Details Summary */}
          <div className="space-y-1.5 mb-4 text-xs p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <p className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Ride ID:</span>
              <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{booking.id}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Category:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCategoryName(booking.type)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Pickup:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{booking.pickup}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Destination:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{booking.destination}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Distance:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{booking.distance} km</span>
            </p>
            <p className="flex justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
              <span className="text-gray-500 dark:text-gray-400">Estimated Fare:</span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">₹{booking.fare}</span>
            </p>
            {startTime && (
              <p className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trip Started:</span>
                <span className="text-gray-700 dark:text-gray-300">{startTime.toLocaleTimeString()}</span>
              </p>
            )}
            {endTime && (
              <p className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trip Concluded:</span>
                <span className="text-gray-700 dark:text-gray-300">{endTime.toLocaleTimeString()}</span>
              </p>
            )}
          </div>

          {/* Status Lifecycle Timeline */}
          <div className="mb-4 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Trip Milestones
            </p>
            {STATUS_STAGES.map((label, idx) => (
              <div key={label} className="flex items-center space-x-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    idx <= stage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-transparent'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span
                  className={`text-xs transition-colors ${
                    idx <= stage
                      ? 'font-semibold text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Cancellation Section (Only allowed during approach stages <= 3) */}
          {stage <= 3 && !paymentConfirmed && (
            <div className="mt-2">
              {showCancelPrompt ? (
                <div className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-center animate-in fade-in duration-150">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-2.5">
                    Are you sure you want to cancel this ride?
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(false)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Keep Ride
                    </button>
                    <button
                      type="button"
                      onClick={confirmCancellation}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="w-full py-2.5 px-3 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          )}

          {/* Payment Section (Shown at Stage 5 - Ride Completed) */}
          {stage === 5 && !paymentConfirmed && (
            <div className="mt-3 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-dark-card shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Trip Completed – Settle Payment
              </h3>
              <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                <p className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-medium">{booking.distance} km</span>
                </p>
                <p className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium">{formatCategoryName(booking.type)}</span>
                </p>
                <p className="flex justify-between font-bold text-sm text-gray-900 dark:text-gray-100 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span>Final Fare:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">₹{booking.fare}</span>
                </p>
              </div>

              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1">
                Select Payment Method (Demo):
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => handlePaymentSelect('Cash')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    paymentMethod === 'Cash'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentSelect('UPI')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  UPI Demo
                </button>
              </div>

              <button
                type="button"
                onClick={handlePaymentConfirm}
                disabled={!paymentMethod}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Confirm Payment (₹{booking.fare})
              </button>
            </div>
          )}

          {/* Payment Success Card */}
          {paymentConfirmed && (
            <div className="mt-3 p-4 border border-emerald-200 dark:border-emerald-800 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1">
                ✓
              </div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Payment Successful</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Thank you for riding with RIDELY! Your ride has concluded.
              </p>
            </div>
          )}

          {/* Back to Home Button (Strictly after payment) */}
          {paymentConfirmed && (
            <button
              type="button"
              onClick={onBackHome}
              className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>

        {/* Simulated Call Modal */}
        <AnimatePresence>
          {showCallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm rounded-3xl bg-gray-900 text-white p-6 shadow-2xl border border-gray-800 text-center relative overflow-hidden"
              >
                {/* Demo Badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-semibold border border-indigo-800 mb-4">
                  Simulated Driver Call (Prototype Demo)
                </div>

                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg ring-4 ring-indigo-500/20">
                  AP
                </div>
                <h3 className="text-lg font-bold">{DRIVER_INFO.name}</h3>
                <p className="text-xs text-gray-400 mb-1">{DRIVER_INFO.phone}</p>
                <p className="text-sm text-emerald-400 font-mono font-medium mb-6">
                  Connected • {formatSeconds(callDuration)}
                </p>

                {/* In-call audio buttons */}
                <div className="flex justify-center gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setIsMuted((prev) => !prev)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    title="Mute"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSpeaker((prev) => !prev)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isSpeaker ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    title="Speaker"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <PhoneOff size={18} />
                  End Call
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulated Message Modal */}
        <AnimatePresence>
          {showMessageModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md h-[540px] rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-gray-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      AP
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        {DRIVER_INFO.name}
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {DRIVER_INFO.vehicle} • {DRIVER_INFO.plate}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Disclaimer */}
                <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium text-center border-b border-indigo-100 dark:border-indigo-900/50">
                  Simulated Driver Chat (Prototype Demo)
                </div>

                {/* Message Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Reply Chips */}
                <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSendMessage("I'm waiting at the pickup gate")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    At pickup gate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage("Wearing a black jacket")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Wearing black
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage("Please hurry, thank you!")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Please hurry
                  </button>
                </div>

                {/* Input row */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-gray-900"
                >
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Type a message to Alex..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMsg.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    );
  }
