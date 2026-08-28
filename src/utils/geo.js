const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

function distanceKm(a, b) {
  if (!a || !b) return 0;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return (
    EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function routeDistance(points) {
  return points
    .slice(1)
    .reduce(
      (total, point, index) => total + distanceKm(points[index], point),
      0,
    );
}

function trackingProgress(route, readings) {
  const total = routeDistance(route);
  const traveled = routeDistance(
    readings.map((item) => ({
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    })),
  );
  return {
    totalKm: total,
    traveledKm: Math.min(traveled, total),
    remainingKm: Math.max(total - traveled, 0),
    progress: total ? Math.min((traveled / total) * 100, 100) : 0,
  };
}

module.exports = { distanceKm, routeDistance, trackingProgress };
