const API_BASE = import.meta.env.VITE_API_URL || '';
const LOCAL_ASSETS = `${import.meta.env.BASE_URL || '/'}hydrants.json`;

function buildApiUrl(path, params = null) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE || window.location.origin;
  const url = new URL(normalizedPath, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
}

async function loadLocalHydrants() {
  if (!window.__hydrantsCache) {
    const res = await fetch(LOCAL_ASSETS);
    if (!res.ok) throw new Error(`Failed to load local hydrants (${res.status})`);
    window.__hydrantsCache = await res.json();
  }
  return window.__hydrantsCache;
}

export async function fetchHydrants(typ = null) {
  if (!API_BASE) {
    const hydrants = await loadLocalHydrants();
    if (!typ) return hydrants;
    return hydrants.filter((h) => h.typ === typ.toUpperCase());
  }

  const url = buildApiUrl('/api/hydrants', { typ });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchNearest(lat, lng, typ = null, limit = 5) {
  if (!API_BASE) {
    const hydrants = await loadLocalHydrants();
    const pool = typ ? hydrants.filter((h) => h.typ === typ.toUpperCase()) : hydrants;
    const withDistance = pool.map((h) => ({
      ...h,
      distance_m: haversineDistance(lat, lng, h.latitude, h.longitude),
    }));
    withDistance.sort((a, b) => a.distance_m - b.distance_m);
    return withDistance.slice(0, limit);
  }

  const url = buildApiUrl('/api/hydrants/nearest', {
    lat,
    lng,
    typ,
    limit,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchStats() {
  if (!API_BASE) {
    const hydrants = await loadLocalHydrants();
    const types = {};
    const ortsteile = {};
    hydrants.forEach((h) => {
      types[h.typ] = (types[h.typ] || 0) + 1;
      ortsteile[h.ortsteil] = (ortsteile[h.ortsteil] || 0) + 1;
    });
    return {
      total: hydrants.length,
      by_type: types,
      by_ortsteil: ortsteile,
    };
  }

  const res = await fetch(buildApiUrl('/api/stats'));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
