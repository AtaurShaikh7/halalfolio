// Thin client for api.mfapi.in
// Caches each scheme's NAV in sessionStorage for 6 hours.

const TTL_MS = 6 * 60 * 60 * 1000;

function cacheKey(code) {
  return `mfapi:${code}`;
}

function readCache(code) {
  try {
    const raw = sessionStorage.getItem(cacheKey(code));
    if (!raw) return null;
    const { t, payload } = JSON.parse(raw);
    if (Date.now() - t > TTL_MS) return null;
    // Rehydrate Date objects — JSON round-trip turned them into strings.
    if (payload?.series) {
      payload.series = payload.series.map((p) => ({ ...p, date: new Date(p.date) }));
    }
    return payload;
  } catch {
    return null;
  }
}

function writeCache(code, payload) {
  try {
    sessionStorage.setItem(cacheKey(code), JSON.stringify({ t: Date.now(), payload }));
  } catch {
    /* quota errors swallowed */
  }
}

// Parse "DD-MM-YYYY" to a Date (UTC noon to avoid TZ rollover).
function parseDate(s) {
  const [d, m, y] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export async function fetchNavSeries(schemeCode) {
  const cached = readCache(schemeCode);
  if (cached) return cached;

  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) throw new Error(`mfapi ${schemeCode} → HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.data?.length) throw new Error(`mfapi ${schemeCode} → empty data`);

  // API returns newest-first; reverse to chronological.
  const series = json.data
    .map((d) => ({ date: parseDate(d.date), nav: parseFloat(d.nav) }))
    .filter((p) => Number.isFinite(p.nav) && p.nav > 0 && !Number.isNaN(p.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const payload = {
    meta: json.meta,
    series, // [{date: Date, nav: number}, ...]
  };
  writeCache(schemeCode, payload);
  return payload;
}
