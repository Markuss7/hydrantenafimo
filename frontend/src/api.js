const API_BASE = import.meta.env.VITE_API_URL || '';

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

export async function fetchHydrants(typ = null) {
  const url = buildApiUrl('/api/hydrants', { typ });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchNearest(lat, lng, typ = null, limit = 5) {
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
  const res = await fetch(buildApiUrl('/api/stats'));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
