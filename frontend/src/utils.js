/** Colour palette and label mapping for hydrant types. */

export const TYPE_CONFIG = {
  UH: { color: '#1E88E5', label: 'Unterflurhydrant',   labelShort: 'Unterflur H.' },
  OH: { color: '#E53935', label: 'Überflurhydrant',    labelShort: 'Überflur H.' },
  GH: { color: '#43A047', label: 'Fallmantelhydrant',  labelShort: 'Fallmantel H.' },
  TWB: { color: '#FB8C00', label: 'Trinkwasserbrunnen', labelShort: 'Trinkwasser B.' },
};

/** Haversine distance in metres. */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format distance for display. */
export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
