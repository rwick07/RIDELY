import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';

import { LocationInput } from '../components/booking/LocationInput';
import {
  findLocationByName,
  haversineDistance,
  calculateFare,
  generateBookingId,
  storeBooking,
  updateBookingStatus,
} from '../services/bookingService';
import { AuthContext } from '../auth/AuthContext';

import { DEFAULT_BENGALURU_CENTER } from '../constants/locations';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import RideStatus from '../components/ride/RideStatus';
import {
  storeActiveRide,
  getActiveRide,
  clearActiveRide,
  storeActiveStatus,
  getActiveStatus,
  clearActiveStatus,
} from '../services/bookingService';
import {
  generateRealisticRoute,
  getSimulatedDriverOrigin,
  interpolateRouteState,
  createVehicleMarkerIcon,
} from '../utils/routeSimulation';

import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Users,
  Clock,
  ArrowUpDown,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  Shield,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function BookRide() {
  const { user } = useContext(AuthContext) || {};
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Live Tracking state
  const [activeRideStage, setActiveRideStage] = useState(() => getActiveStatus());
  const [followDriver, setFollowDriver] = useState(true);
  const [trackingMetrics, setTrackingMetrics] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const pickupMarker = useRef(null);
  const destMarker = useRef(null);
  const routeLine = useRef(null);

  // Tracking layers and animation refs
  const vehicleMarker = useRef(null);
  const approachPolyline = useRef(null);
  const traveledPolyline = useRef(null);
  const remainingPolyline = useRef(null);
  const animFrameRef = useRef(null);
  const lastMetricsUpdateRef = useRef(0);
  const routeDataRef = useRef({ approach: null, trip: null });

  // Available ride options with detailed metadata
  const rideOptions = [
    {
      type: 'mini',
      name: 'RIDELY Mini',
      model: 'Compact Hatchback (Swift, WagonR)',
      tagline: 'Affordable, everyday city trips',
      badge: 'Best Value',
      eta: '2-4 min',
      capacity: 3,
    },
    {
      type: 'comfort',
      name: 'RIDELY Comfort',
      model: 'Spacious Sedan (Dzire, Etios)',
      tagline: 'Extra legroom & top-rated drivers',
      badge: 'Popular',
      eta: '3-5 min',
      capacity: 4,
    },
    {
      type: 'premium',
      name: 'RIDELY Premium',
      model: 'Executive Sedan / SUV (Innova, City)',
      tagline: 'Top-tier luxury & spacious comfort',
      badge: 'Executive',
      eta: '5-7 min',
      capacity: 4,
    },
  ];

  // Custom Leaflet DivIcons to match RIDELY theme
  const createPickupIcon = () =>
    L.divIcon({
      className: 'ridely-custom-marker',
      html: `
        <div style="
          width: 26px;
          height: 26px;
          background-color: #10b981;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 7px; height: 7px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -14],
    });

  const createDestIcon = () =>
    L.divIcon({
      className: 'ridely-custom-marker',
      html: `
        <div style="
          width: 26px;
          height: 34px;
          position: relative;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
        ">
          <svg viewBox="0 0 24 32" width="26" height="34" fill="#ef4444" stroke="#ffffff" stroke-width="1.5">
            <path d="M12 0C6.48 0 2 4.48 2 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.52-4.48-10-10-10zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          </svg>
        </div>
      `,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      popupAnchor: [0, -34],
    });

  // Handle prefilled locations (e.g. from Home page quick search or 'Book Again' button)
  useEffect(() => {
    try {
      const prefillRaw = sessionStorage.getItem('rident_prefill_booking');
      if (prefillRaw) {
        const prefill = JSON.parse(prefillRaw);
        if (prefill.pickup) setPickup(prefill.pickup);
        if (prefill.destination) setDestination(prefill.destination);

        if (prefill.pickup && prefill.destination) {
          const pLoc = findLocationByName(prefill.pickup);
          const dLoc = findLocationByName(prefill.destination);
          if (pLoc && dLoc && pLoc.id !== dLoc.id) {
            const km = haversineDistance(pLoc.lat, pLoc.lng, dLoc.lat, dLoc.lng);
            setDistance(km);
          }
        }
        sessionStorage.removeItem('rident_prefill_booking');
      }
    } catch (e) {
      console.error('Error loading prefilled booking:', e);
    }
  }, []);

  // Initialize Leaflet map with resize observer
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      fadeAnimation: true,
    }).setView(
      [DEFAULT_BENGALURU_CENTER.lat, DEFAULT_BENGALURU_CENTER.lng],
      DEFAULT_BENGALURU_CENTER.zoom || 12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    const timer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 250);

    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Helper to remove active tracking layers
  const removeTrackingLayers = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mapInstance.current) {
      if (vehicleMarker.current) {
        mapInstance.current.removeLayer(vehicleMarker.current);
        vehicleMarker.current = null;
      }
      if (approachPolyline.current) {
        mapInstance.current.removeLayer(approachPolyline.current);
        approachPolyline.current = null;
      }
      if (traveledPolyline.current) {
        mapInstance.current.removeLayer(traveledPolyline.current);
        traveledPolyline.current = null;
      }
      if (remainingPolyline.current) {
        mapInstance.current.removeLayer(remainingPolyline.current);
        remainingPolyline.current = null;
      }
    }
    routeDataRef.current = { approach: null, trip: null };
    setTrackingMetrics(null);
  }, []);

  // Update map markers, route polyline, and camera positioning (Booking mode)
  useEffect(() => {
    if (!mapInstance.current) return;

    // In tracking mode, locations are defined by the active ride
    const currentPickup = showStatus && activeRide ? activeRide.pickup : pickup;
    const currentDest = showStatus && activeRide ? activeRide.destination : destination;

    const pLoc = findLocationByName(currentPickup);
    const dLoc = findLocationByName(currentDest);

    // Pickup marker
    if (pLoc) {
      if (pickupMarker.current) {
        pickupMarker.current.setLatLng([pLoc.lat, pLoc.lng]);
        pickupMarker.current.setPopupContent(`<b>Pickup:</b> ${pLoc.name}`);
      } else {
        pickupMarker.current = L.marker([pLoc.lat, pLoc.lng], {
          icon: createPickupIcon(),
          title: `Pickup: ${pLoc.name}`,
        })
          .bindPopup(`<b>Pickup:</b> ${pLoc.name}`)
          .addTo(mapInstance.current);
      }
    } else if (pickupMarker.current) {
      mapInstance.current.removeLayer(pickupMarker.current);
      pickupMarker.current = null;
    }

    // Destination marker
    if (dLoc) {
      if (destMarker.current) {
        destMarker.current.setLatLng([dLoc.lat, dLoc.lng]);
        destMarker.current.setPopupContent(`<b>Destination:</b> ${dLoc.name}`);
      } else {
        destMarker.current = L.marker([dLoc.lat, dLoc.lng], {
          icon: createDestIcon(),
          title: `Destination: ${dLoc.name}`,
        })
          .bindPopup(`<b>Destination:</b> ${dLoc.name}`)
          .addTo(mapInstance.current);
      }
    } else if (destMarker.current) {
      mapInstance.current.removeLayer(destMarker.current);
      destMarker.current = null;
    }

    // Static booking route line (only shown when NOT in active tracking mode)
    if (!showStatus && pLoc && dLoc) {
      const latlngs = [
        [pLoc.lat, pLoc.lng],
        [dLoc.lat, dLoc.lng],
      ];

      if (routeLine.current) {
        routeLine.current.setLatLngs(latlngs);
      } else {
        routeLine.current = L.polyline(latlngs, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstance.current);
      }

      mapInstance.current.fitBounds(latlngs, {
        padding: [60, 60],
        maxZoom: 15,
      });
    } else {
      if (routeLine.current) {
        mapInstance.current.removeLayer(routeLine.current);
        routeLine.current = null;
      }

      if (!showStatus) {
        if (pLoc) {
          mapInstance.current.setView([pLoc.lat, pLoc.lng], 13, { animate: true });
        } else if (dLoc) {
          mapInstance.current.setView([dLoc.lat, dLoc.lng], 13, { animate: true });
        } else {
          mapInstance.current.setView(
            [DEFAULT_BENGALURU_CENTER.lat, DEFAULT_BENGALURU_CENTER.lng],
            12,
            { animate: true }
          );
        }
      }
    }
  }, [pickup, destination, showStatus, activeRide]);

  // LIVE DRIVER TRACKING SIMULATION ENGINE
  useEffect(() => {
    if (!mapInstance.current || !showStatus || !activeRide) {
      removeTrackingLayers();
      return;
    }

    const pLoc = findLocationByName(activeRide.pickup);
    const dLoc = findLocationByName(activeRide.destination);
    if (!pLoc || !dLoc) return;

    // Generate simulated driver origin and realistic multi-waypoint road networks
    const driverOrigin = getSimulatedDriverOrigin(pLoc.lat, pLoc.lng, activeRide.id);

    if (!routeDataRef.current.approach) {
      routeDataRef.current.approach = generateRealisticRoute(driverOrigin, pLoc, 40);
      routeDataRef.current.trip = generateRealisticRoute(pLoc, dLoc, 60);
    }

    const { approach, trip } = routeDataRef.current;

    // Ensure polylines exist
    if (!approachPolyline.current) {
      approachPolyline.current = L.polyline([], {
        color: '#6366f1',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(mapInstance.current);
    }

    if (!traveledPolyline.current) {
      traveledPolyline.current = L.polyline([], {
        color: '#94a3b8',
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
      }).addTo(mapInstance.current);
    }

    if (!remainingPolyline.current) {
      remainingPolyline.current = L.polyline([], {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(mapInstance.current);
    }

    // Ensure vehicle marker exists
    if (!vehicleMarker.current) {
      vehicleMarker.current = L.marker([driverOrigin.lat, driverOrigin.lng], {
        icon: createVehicleMarkerIcon(0, true),
        zIndexOffset: 1000,
      }).addTo(mapInstance.current);
    }

    // Initial camera fit for trip tracking
    if (activeRideStage === 0 || activeRideStage === 1) {
      mapInstance.current.fitBounds(
        [
          [driverOrigin.lat, driverOrigin.lng],
          [pLoc.lat, pLoc.lng],
        ],
        { padding: [70, 70], maxZoom: 15 }
      );
    }

    // Smooth animation loop based on stage
    let startTime = performance.now();
    let currentAnimStage = activeRideStage;

    const animateDriver = (now) => {
      const elapsed = now - startTime;

      if (currentAnimStage === 0) {
        // Stage 0: Ride Confirmed - Driver at origin
        const startPos = approach.waypoints[0];
        vehicleMarker.current?.setLatLng([startPos.lat, startPos.lng]);
        approachPolyline.current?.setLatLngs(approach.waypoints.map((w) => [w.lat, w.lng]));
        traveledPolyline.current?.setLatLngs([]);
        remainingPolyline.current?.setLatLngs(trip.waypoints.map((w) => [w.lat, w.lng]));

        if (now - lastMetricsUpdateRef.current > 300) {
          lastMetricsUpdateRef.current = now;
          setTrackingMetrics({
            etaText: 'Driver assigned (~4 min away)',
            distanceRemainingKm: approach.totalDistanceKm,
            progressPercent: 5,
          });
        }
      } else if (currentAnimStage === 1 || currentAnimStage === 2) {
        // Stage 1 & 2: Driver Assigned -> Driver Arriving
        // Total approach duration: ~13 seconds
        const totalDuration = 13000;
        const progress = Math.min(1, elapsed / totalDuration);
        const state = interpolateRouteState(approach, progress);

        if (state) {
          vehicleMarker.current?.setLatLng([state.position.lat, state.position.lng]);
          vehicleMarker.current?.setIcon(createVehicleMarkerIcon(state.bearing, true));

          // Approach polyline shows path from driver to pickup
          approachPolyline.current?.setLatLngs(state.remainingCoords);
          traveledPolyline.current?.setLatLngs([]);
          remainingPolyline.current?.setLatLngs(trip.waypoints.map((w) => [w.lat, w.lng]));

          if (followDriver && mapInstance.current) {
            mapInstance.current.panTo([state.position.lat, state.position.lng], {
              animate: true,
              duration: 0.2,
            });
          }

          if (now - lastMetricsUpdateRef.current > 250) {
            lastMetricsUpdateRef.current = now;
            const etaMinutes = Math.max(1, Math.ceil(state.distanceRemainingKm * 2.5));
            setTrackingMetrics({
              etaText: `Arriving in ~${etaMinutes} min`,
              distanceRemainingKm: state.distanceRemainingKm,
              progressPercent: state.progressPercent,
            });
          }
        }
      } else if (currentAnimStage === 3) {
        // Stage 3: Driver Arrived at pickup
        vehicleMarker.current?.setLatLng([pLoc.lat, pLoc.lng]);
        approachPolyline.current?.setLatLngs([]);
        traveledPolyline.current?.setLatLngs([]);
        remainingPolyline.current?.setLatLngs(trip.waypoints.map((w) => [w.lat, w.lng]));

        if (now - lastMetricsUpdateRef.current > 300) {
          lastMetricsUpdateRef.current = now;
          setTrackingMetrics({
            etaText: 'Driver has arrived at pickup',
            distanceRemainingKm: 0.0,
            progressPercent: 100,
          });
        }
      } else if (currentAnimStage === 4) {
        // Stage 4: Ride in Progress (Pickup -> Destination)
        // Duration: ~16 seconds
        const totalTripDuration = 16000;
        const progress = Math.min(1, elapsed / totalTripDuration);
        const state = interpolateRouteState(trip, progress);

        if (state) {
          vehicleMarker.current?.setLatLng([state.position.lat, state.position.lng]);
          vehicleMarker.current?.setIcon(createVehicleMarkerIcon(state.bearing, false));

          approachPolyline.current?.setLatLngs([]);
          traveledPolyline.current?.setLatLngs(state.traveledCoords);
          remainingPolyline.current?.setLatLngs(state.remainingCoords);

          if (followDriver && mapInstance.current) {
            mapInstance.current.panTo([state.position.lat, state.position.lng], {
              animate: true,
              duration: 0.2,
            });
          }

          if (now - lastMetricsUpdateRef.current > 250) {
            lastMetricsUpdateRef.current = now;
            const etaMinutes = Math.max(1, Math.ceil(state.distanceRemainingKm * 1.8));
            setTrackingMetrics({
              etaText: `Destination in ~${etaMinutes} min`,
              distanceRemainingKm: state.distanceRemainingKm,
              progressPercent: state.progressPercent,
            });
          }
        }
      } else if (currentAnimStage === 5) {
        // Stage 5: Ride Completed at Destination
        vehicleMarker.current?.setLatLng([dLoc.lat, dLoc.lng]);
        approachPolyline.current?.setLatLngs([]);
        traveledPolyline.current?.setLatLngs(trip.waypoints.map((w) => [w.lat, w.lng]));
        remainingPolyline.current?.setLatLngs([]);

        setTrackingMetrics({
          etaText: 'Trip Completed',
          distanceRemainingKm: 0.0,
          progressPercent: 100,
        });

        // Trip complete - cancel animation
        return;
      }

      animFrameRef.current = requestAnimationFrame(animateDriver);
    };

    animFrameRef.current = requestAnimationFrame(animateDriver);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [showStatus, activeRide, activeRideStage, followDriver, removeTrackingLayers]);

  // Invalidate map size when status toggles
  useEffect(() => {
    if (mapInstance.current) {
      const timer = setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showStatus]);

  // Overview camera control
  const handleFitOverview = () => {
    if (!mapInstance.current) return;
    const currentPickup = showStatus && activeRide ? activeRide.pickup : pickup;
    const currentDest = showStatus && activeRide ? activeRide.destination : destination;

    const pLoc = findLocationByName(currentPickup);
    const dLoc = findLocationByName(currentDest);
    if (!pLoc || !dLoc) return;

    const bounds = [
      [pLoc.lat, pLoc.lng],
      [dLoc.lat, dLoc.lng],
    ];

    if (vehicleMarker.current) {
      const vPos = vehicleMarker.current.getLatLng();
      bounds.push([vPos.lat, vPos.lng]);
    }

    mapInstance.current.fitBounds(bounds, {
      padding: [70, 70],
      maxZoom: 15,
    });
  };

  // Calculate ride distance & validate locations
  const calculate = () => {
    setValidationError('');

    const pLoc = findLocationByName(pickup);
    const dLoc = findLocationByName(destination);

    if (!pLoc || !dLoc) {
      setValidationError('Please select valid pickup and destination locations from the suggestions.');
      return;
    }

    if (pLoc.id === dLoc.id) {
      setValidationError('Pickup and destination cannot be the same location.');
      return;
    }

    const km = haversineDistance(pLoc.lat, pLoc.lng, dLoc.lat, dLoc.lng);
    setDistance(km);
    setSelectedOption(null);
  };

  // Swap pickup and destination smoothly
  const swapLocations = () => {
    setPickup(destination);
    setDestination(pickup);
    setDistance(null);
    setSelectedOption(null);
    setValidationError('');
  };

  // Invalidate ride calculations on location change
  const handlePickupChange = (value) => {
    setPickup(value);
    setDistance(null);
    setSelectedOption(null);
    setValidationError('');
  };

  const handleDestinationChange = (value) => {
    setDestination(value);
    setDistance(null);
    setSelectedOption(null);
    setValidationError('');
  };

  // Step 1 of Booking: Open confirmation modal summarizing trip
  const handleReviewBooking = () => {
    if (distance === null || !selectedOption) return;

    const fare = calculateFare(distance, selectedOption.type);
    setBookingSummary({
      pickup,
      destination,
      type: selectedOption.type,
      name: selectedOption.name,
      model: selectedOption.model,
      capacity: selectedOption.capacity,
      eta: selectedOption.eta,
      distance: Math.round(distance),
      fare,
    });
    setShowConfirmation(true);
  };

  // Step 2 of Booking: User explicitly confirms creation
  const handleConfirmBooking = () => {
    if (!bookingSummary) return;

    const id = generateBookingId();
    const booking = {
      id,
      pickup: bookingSummary.pickup,
      destination: bookingSummary.destination,
      type: bookingSummary.type,
      fare: bookingSummary.fare,
      distance: bookingSummary.distance,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
      userEmail: user?.email || null,
    };

    storeBooking(booking);
    storeActiveRide(booking);
    storeActiveStatus(0);
    setActiveRide(booking);
    setActiveRideStage(0);

    setShowConfirmation(false);
    setBookingSummary(null);
    setSelectedOption(null);
    setShowStatus(true);
  };

  // Close/Cancel confirmation without creating booking
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  // Load any persisted active ride on component mount
  useEffect(() => {
    const persistedRide = getActiveRide();
    if (persistedRide) {
      if (
        user?.email &&
        persistedRide.userEmail &&
        persistedRide.userEmail.toLowerCase() !== user.email.toLowerCase()
      ) {
        clearActiveRide();
        clearActiveStatus();
        setActiveRide(null);
        setShowStatus(false);
      } else {
        setActiveRide(persistedRide);
        setActiveRideStage(getActiveStatus());
        setShowStatus(true);
      }
    }
  }, [user?.email]);

  // Handle ride cancellation from status screen
  const handleCancelRide = () => {
    if (activeRide?.id) {
      updateBookingStatus(activeRide.id, 'Cancelled', 'Cancelled');
    }
    removeTrackingLayers();
    clearActiveRide();
    clearActiveStatus();
    localStorage.removeItem('rident_ride_start_time');
    localStorage.removeItem('rident_ride_end_time');
    setActiveRide(null);
    setShowStatus(false);
  };

  // Dedicated handler for returning home after ride completion and payment
  const handleBackHome = () => {
    removeTrackingLayers();
    clearActiveRide();
    clearActiveStatus();
    localStorage.removeItem('rident_ride_start_time');
    localStorage.removeItem('rident_ride_end_time');
    setActiveRide(null);
    setShowStatus(false);
    setBookingSummary(null);
    setShowConfirmation(false);
    setSelectedOption(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* Booking / Status Panel */}
        {showStatus && activeRide ? (
          <RideStatus
            booking={activeRide}
            stage={activeRideStage}
            onStageChange={(newStage) => setActiveRideStage(newStage)}
            onCancel={handleCancelRide}
            onBackHome={handleBackHome}
            trackingMetrics={trackingMetrics}
            followDriver={followDriver}
            onToggleFollowDriver={() => setFollowDriver((prev) => !prev)}
            onFitOverview={handleFitOverview}
          />
        ) : (
          <motion.aside
            className="w-full md:w-[410px] bg-white dark:bg-dark-card p-5 overflow-y-auto shadow-lg z-20 flex flex-col justify-between border-r border-gray-200 dark:border-dark-border"
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              {/* Title & Tagline */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Book a Ride
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Bengaluru Cabs
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Safe, quick and reliable rides across the city
                </p>
              </div>

              {/* Inline Validation Alert */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-start space-x-2"
                  >
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Location Input Section */}
              <div className="space-y-1 relative">
                <LocationInput
                  label="Pickup Point"
                  type="pickup"
                  value={pickup}
                  onChange={handlePickupChange}
                  onClear={() => handlePickupChange('')}
                  placeholder="Select pickup point..."
                />

                {/* Floating Swap Button */}
                <div className="relative flex justify-center -my-2.5 z-10">
                  <button
                    type="button"
                    onClick={swapLocations}
                    title="Swap pickup and destination"
                    className="p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all transform active:scale-95"
                  >
                    <ArrowUpDown size={14} />
                  </button>
                </div>

                <LocationInput
                  label="Destination"
                  type="destination"
                  value={destination}
                  onChange={handleDestinationChange}
                  onClear={() => handleDestinationChange('')}
                  placeholder="Where are you going?"
                />
              </div>

              {/* Find Cabs / Fare Calculation CTA */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={calculate}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Search size={15} />
                  <span>Find Available Cabs</span>
                </button>
              </div>

              {/* Distance & Route Pill */}
              {distance !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200">
                    <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium">Estimated Distance:</span>
                  </div>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-300 text-sm">
                    {Math.round(distance)} km
                  </span>
                </motion.div>
              )}

              {/* Available Cabs Section */}
              {distance !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Select Your Ride
                    </h3>
                    <span className="text-[11px] text-gray-400">3 options nearby</span>
                  </div>

                  <div className="space-y-2">
                    {rideOptions.map((opt) => {
                      const fare = calculateFare(distance, opt.type);
                      const isSelected = selectedOption?.type === opt.type;

                      return (
                        <div
                          key={opt.type}
                          onClick={() => setSelectedOption(opt)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700/80 bg-white dark:bg-dark-card hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div
                                className={`p-2.5 rounded-xl ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <Car size={18} />
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                                    {opt.name}
                                  </h4>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    {opt.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                  {opt.model}
                                </p>
                                <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center space-x-0.5">
                                    <Clock size={11} className="mr-0.5" />
                                    {opt.eta}
                                  </span>
                                  <span className="flex items-center space-x-0.5">
                                    <Users size={11} className="mr-0.5" />
                                    {opt.capacity} seats
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                ₹{fare}
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Fixed Fare
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Booking Action Button */}
            {distance !== null && selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-gray-200 dark:border-dark-border mt-4"
              >
                <button
                  type="button"
                  onClick={handleReviewBooking}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-between"
                >
                  <span className="flex items-center space-x-1">
                    <span>Review & Book</span>
                    <span className="text-emerald-200 font-normal">({selectedOption.name})</span>
                  </span>
                  <span className="flex items-center space-x-1 text-sm font-extrabold">
                    <span>₹{calculateFare(distance, selectedOption.type)}</span>
                    <ChevronRight size={16} />
                  </span>
                </button>
              </motion.div>
            )}
          </motion.aside>
        )}

        {/* Leaflet Map Main Section */}
        <motion.main
          className="flex-1 h-full relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div ref={mapRef} className="w-full h-full" />
        </motion.main>
      </div>

      {/* Review & Confirmation Modal */}
      <BookingConfirmation
        summary={bookingSummary}
        isOpen={showConfirmation}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelConfirmation}
      />
    </div>
  );
}
