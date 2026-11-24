// src/services/bookingService.js
import { BENGALURU_PRESETS } from "../constants/locations";

// Find preset location by name (case‑insensitive)
export function findLocationByName(name) {
  return BENGALURU_PRESETS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

// Haversine distance in km between two lat/lng points
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple fare algorithm (base + per‑km * distance + type surcharge)
export const BASE_FARE = 20; // base fare in INR
export const PER_KM = 5; // per km rate
export const TYPE_SURCHARGE = {
  mini: 0,
  comfort: 10,
  premium: 20,
};

export function calculateFare(distanceKm, type) {
  const surcharge = TYPE_SURCHARGE[type] || 0;
  const fare = BASE_FARE + distanceKm * PER_KM + surcharge;
  return Math.round(fare);
}

// Generate a simple unique ID (timestamp + random)
export function generateBookingId() {
  return `RID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Reliable date resolver for booking (supports createdAt, date, or parsed timestamp from ID)
export function getBookingDate(booking) {
  if (!booking) return new Date();
  if (booking.createdAt) {
    const d = new Date(booking.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (booking.date) {
    const d = new Date(booking.date);
    if (!isNaN(d.getTime())) return d;
  }
  const parts = booking.id?.split('-');
  if (parts && parts[1]) {
    const ts = parseInt(parts[1], 10);
    if (!isNaN(ts)) return new Date(ts);
  }
  return new Date();
}

// Format category name (e.g. mini -> Mini, comfort -> Comfort, premium -> Premium)
export function formatCategoryName(type) {
  if (!type) return 'Mini';
  const clean = String(type).toLowerCase();
  if (clean === 'comfort') return 'Comfort';
  if (clean === 'premium') return 'Premium';
  return 'Mini';
}

// Update booking status (e.g., Cancelled, Completed) and optional payment status
export function updateBookingStatus(id, newStatus, paymentStatus) {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index !== -1) {
    let resolvedPayment = paymentStatus;
    if (!resolvedPayment) {
      if (newStatus === 'Completed') {
        resolvedPayment = 'Paid';
      } else if (newStatus === 'Cancelled') {
        resolvedPayment = 'Cancelled';
      } else {
        resolvedPayment = bookings[index].paymentStatus || 'Pending';
      }
    }

    bookings[index] = {
      ...bookings[index],
      status: newStatus,
      paymentStatus: resolvedPayment,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("rident_bookings", JSON.stringify(bookings));

    // Also synchronize active ride in storage if matching
    const active = getActiveRide();
    if (active && active.id === id) {
      storeActiveRide({
        ...active,
        status: newStatus,
        paymentStatus: resolvedPayment,
      });
    }
  }
}

export function storeBooking(booking) {
  const key = "rident_bookings";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const enrichedBooking = {
    ...booking,
    createdAt: booking.createdAt || new Date().toISOString(),
    paymentStatus: booking.paymentStatus || (booking.status === 'Completed' ? 'Paid' : 'Pending'),
  };
  existing.push(enrichedBooking);
  localStorage.setItem(key, JSON.stringify(existing));
  return enrichedBooking;
}

export function getBookings(userEmail) {
  const all = JSON.parse(localStorage.getItem("rident_bookings") || "[]");
  if (!userEmail) return all;
  return all.filter(
    (b) => !b.userEmail || b.userEmail.toLowerCase() === userEmail.toLowerCase()
  );
}

export function getBookingById(id) {
  const bookings = getBookings();
  return bookings.find((b) => b.id === id) || null;
}

// ----- Active ride persistence helpers (Phase 4) -----
const ACTIVE_RIDE_KEY = "rident_active_ride";
const ACTIVE_STATUS_KEY = "rident_active_status";

export function storeActiveRide(ride) {
  localStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride));
  window.dispatchEvent(new Event('rideUpdated'));
}

export function getActiveRide() {
  const raw = localStorage.getItem(ACTIVE_RIDE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearActiveRide() {
  localStorage.removeItem(ACTIVE_RIDE_KEY);
}

export function storeActiveStatus(status) {
  localStorage.setItem(ACTIVE_STATUS_KEY, String(status));
}

export function getActiveStatus() {
  const raw = localStorage.getItem(ACTIVE_STATUS_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function clearActiveStatus() {
  localStorage.removeItem(ACTIVE_STATUS_KEY);
}
