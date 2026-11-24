import L from 'leaflet';

/**
 * Calculates bearing between two lat/lng points in degrees (0 to 360, 0 = North).
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Calculates haversine distance between two points in km.
 */
export function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Deterministically generates a simulated driver start location within 1.2-1.8km of pickup.
 */
export function getSimulatedDriverOrigin(pickupLat, pickupLng, bookingId = 'demo') {
  // Hash bookingId to get repeatable offsets
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = (hash << 5) - hash + bookingId.charCodeAt(i);
    hash |= 0;
  }
  const angle = Math.abs(hash % 360) * (Math.PI / 180);
  const offsetKm = 1.35; // ~1.35 km away
  const latOffset = (offsetKm / 111) * Math.cos(angle);
  const lngOffset = (offsetKm / (111 * Math.cos((pickupLat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat: pickupLat + latOffset,
    lng: pickupLng + lngOffset,
  };
}

/**
 * Generates realistic urban road waypoints between two points with road grid doglegs and sub-stepping.
 */
export function generateRealisticRoute(start, end, segments = 50) {
  const waypoints = [];
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;

  // Intermediate road corridor nodes to simulate city turns (instead of straight Euclidean line)
  // 1st leg: 35% towards primary direction with slight cross-street deflection
  const p1 = {
    lat: start.lat + dLat * 0.32 + dLng * 0.08,
    lng: start.lng + dLng * 0.38 - dLat * 0.06,
  };
  // 2nd leg: 70% along route with alignment back to destination
  const p2 = {
    lat: start.lat + dLat * 0.68 - dLng * 0.05,
    lng: start.lng + dLng * 0.72 + dLat * 0.04,
  };

  const keyNodes = [
    { lat: start.lat, lng: start.lng },
    p1,
    p2,
    { lat: end.lat, lng: end.lng },
  ];

  // Subdivide keyNodes into fine waypoints for fluid animation
  const stepsPerLeg = Math.max(6, Math.floor(segments / (keyNodes.length - 1)));

  for (let i = 0; i < keyNodes.length - 1; i++) {
    const nodeA = keyNodes[i];
    const nodeB = keyNodes[i + 1];

    for (let step = 0; step < stepsPerLeg; step++) {
      const t = step / stepsPerLeg;
      waypoints.push({
        lat: nodeA.lat + (nodeB.lat - nodeA.lat) * t,
        lng: nodeA.lng + (nodeB.lng - nodeA.lng) * t,
      });
    }
  }

  // Push final destination
  waypoints.push({ lat: end.lat, lng: end.lng });

  // Calculate cumulative distances
  let cumulative = 0;
  const cumulativeDistances = [0];

  for (let i = 1; i < waypoints.length; i++) {
    const d = haversineDist(
      waypoints[i - 1].lat,
      waypoints[i - 1].lng,
      waypoints[i].lat,
      waypoints[i].lng
    );
    cumulative += d;
    cumulativeDistances.push(cumulative);
  }

  return {
    waypoints,
    totalDistanceKm: cumulative,
    cumulativeDistances,
  };
}

/**
 * Returns interpolated vehicle state at a given progress fraction (0.0 to 1.0)
 */
export function interpolateRouteState(routeData, progress) {
  if (!routeData || !routeData.waypoints || routeData.waypoints.length === 0) {
    return null;
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const { waypoints, totalDistanceKm, cumulativeDistances } = routeData;

  const targetDist = totalDistanceKm * clampedProgress;

  // Find segment index
  let idx = 0;
  while (idx < cumulativeDistances.length - 1 && cumulativeDistances[idx + 1] <= targetDist) {
    idx++;
  }

  const pA = waypoints[idx];
  const pB = waypoints[Math.min(idx + 1, waypoints.length - 1)];

  const segStartDist = cumulativeDistances[idx];
  const segEndDist = cumulativeDistances[Math.min(idx + 1, cumulativeDistances.length - 1)];
  const segLength = segEndDist - segStartDist;

  let localT = 0;
  if (segLength > 0.000001) {
    localT = (targetDist - segStartDist) / segLength;
  }
  localT = Math.max(0, Math.min(1, localT));

  const currentLat = pA.lat + (pB.lat - pA.lat) * localT;
  const currentLng = pA.lng + (pB.lng - pA.lng) * localT;

  // Bearing from current position to next waypoint or segment direction
  let bearing = calculateBearing(pA.lat, pA.lng, pB.lat, pB.lng);
  if (idx < waypoints.length - 2 && localT > 0.7) {
    const pNext = waypoints[idx + 2];
    const nextBearing = calculateBearing(pB.lat, pB.lng, pNext.lat, pNext.lng);
    // Smooth transition into next turn
    bearing = bearing * 0.4 + nextBearing * 0.6;
  }

  const distanceRemainingKm = Math.max(0, totalDistanceKm * (1 - clampedProgress));

  // Traveled coordinates array and remaining coordinates array
  const traveledCoords = [];
  for (let i = 0; i <= idx; i++) {
    traveledCoords.push([waypoints[i].lat, waypoints[i].lng]);
  }
  traveledCoords.push([currentLat, currentLng]);

  const remainingCoords = [[currentLat, currentLng]];
  for (let i = idx + 1; i < waypoints.length; i++) {
    remainingCoords.push([waypoints[i].lat, waypoints[i].lng]);
  }

  return {
    position: { lat: currentLat, lng: currentLng },
    bearing: Math.round(bearing),
    distanceRemainingKm: Number(distanceRemainingKm.toFixed(1)),
    distanceTraveledKm: Number((totalDistanceKm * clampedProgress).toFixed(1)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    progressPercent: Math.round(clampedProgress * 100),
    traveledCoords,
    remainingCoords,
  };
}

/**
 * Creates an animated high-contrast vehicle Leaflet DivIcon with directional rotation
 */
export function createVehicleMarkerIcon(bearing = 0, isArriving = false) {
  const pulseColor = isArriving ? '#10b981' : '#4f46e5';
  return L.divIcon({
    className: 'ridely-animated-vehicle-container',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Outer radar pulse ring -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: ${pulseColor};
          opacity: 0.22;
          animation: ridelyPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Rotating vehicle disk -->
        <div style="
          width: 36px;
          height: 36px;
          background: #ffffff;
          border-radius: 50%;
          border: 2px solid ${pulseColor};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${bearing}deg);
          transition: transform 0.25s linear;
        ">
          <!-- Sleek Top-Down Cab SVG pointing North (Up) -->
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#1e1b4b">
            <!-- Cab body -->
            <path d="M12 2C9.5 2 7.5 4 7.5 7v10c0 2.5 1.8 3.5 4.5 3.5s4.5-1 4.5-3.5V7c0-3-2-5-4.5-5z" fill="#4f46e5"/>
            <!-- Front windshield -->
            <path d="M9 7c0-1.2 1.2-2 3-2s3 .8 3 2l-.4 3.5H9.4L9 7z" fill="#38bdf8"/>
            <!-- Rear window -->
            <path d="M9.5 17c0 .8 1.1 1.2 2.5 1.2s2.5-.4 2.5-1.2l-.3-2H9.8l-.3 2z" fill="#38bdf8"/>
            <!-- Headlights -->
            <rect x="8.2" y="3" width="1.8" height="1.2" rx="0.6" fill="#fde047"/>
            <rect x="14" y="3" width="1.8" height="1.2" rx="0.6" fill="#fde047"/>
            <!-- Side mirrors -->
            <rect x="6.3" y="8" width="1.2" height="2" rx="0.5" fill="#4338ca"/>
            <rect x="16.5" y="8" width="1.2" height="2" rx="0.5" fill="#4338ca"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}
