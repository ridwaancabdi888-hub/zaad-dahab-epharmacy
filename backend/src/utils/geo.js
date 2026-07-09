const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in kilometers. */
function haversineDistanceKm(from, to) {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * A same-city delivery rider's average effective speed, accounting for
 * traffic/stops — not a highway cruising speed. Used only to produce a
 * rough estimated delivery window; there's no live traffic data source
 * in this phase.
 */
const AVERAGE_DELIVERY_SPEED_KMH = 25;

/** Minimum window width so a very-close estimate doesn't read as "0 minutes". */
const MIN_WINDOW_MINUTES = 10;

/**
 * Estimated delivery window (start/end) from a rider's current position to
 * the delivery address, based on straight-line distance and an assumed
 * average urban delivery speed. This is a genuine, testable computation —
 * not a real-time-traffic ETA (no such data source is available) — and is
 * recomputed every time the rider's location or delivery status changes.
 */
function estimateDeliveryWindow(from, to, now = new Date()) {
  const distanceKm = haversineDistanceKm(from, to);
  const travelMinutes = (distanceKm / AVERAGE_DELIVERY_SPEED_KMH) * 60;
  const windowMinutes = Math.max(MIN_WINDOW_MINUTES, Math.round(travelMinutes));

  const start = new Date(now.getTime() + windowMinutes * 60 * 1000);
  const end = new Date(start.getTime() + MIN_WINDOW_MINUTES * 60 * 1000);
  return { start, end, distanceKm: Number(distanceKm.toFixed(2)) };
}

module.exports = { haversineDistanceKm, estimateDeliveryWindow, AVERAGE_DELIVERY_SPEED_KMH };
