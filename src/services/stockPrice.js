// Live last-traded prices for NSE stocks, from the browser.
//
// Yahoo Finance's chart endpoint serves CORS-permissive responses and needs no
// key — same source the local order/build-basket.mjs uses. Results are cached
// in sessionStorage for an hour so flipping amounts doesn't re-fetch.

const CACHE_KEY = 'halalfolio-prices';
const TTL_MS = 60 * 60 * 1000; // 1h

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const { at, prices } = JSON.parse(raw);
    if (!at || Date.now() - at > TTL_MS) return {};
    return prices || {};
  } catch {
    return {};
  }
}

function writeCache(prices) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), prices }));
  } catch {
    /* quota exceeded — ignore */
  }
}

// Yahoo direct works from some origins but its CORS headers are inconsistent —
// in particular GitHub Pages gets blocked. Strategy: try Yahoo directly; on any
// failure (CORS / network / 4xx) retry through AllOrigins, a free passthrough
// proxy that re-adds permissive CORS headers.
const YAHOO_DIRECT = (s) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}.NS?interval=1d&range=1d`;
const ALLORIGINS = (target) =>
  `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;

function extractPrice(json) {
  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  return Number.isFinite(price) ? price : null;
}

async function tryFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    return extractPrice(j);
  } catch {
    return null;
  }
}

async function fetchOne(symbolRoot) {
  const direct = YAHOO_DIRECT(symbolRoot);
  const viaDirect = await tryFetch(direct);
  if (viaDirect != null) return viaDirect;
  // Direct hit failed (almost always CORS on GitHub Pages) — fall back.
  return await tryFetch(ALLORIGINS(direct));
}

/** Returns {symbolRoot: priceOrNull}. Cached per session. */
export async function fetchPrices(symbolRoots) {
  const unique = [...new Set(symbolRoots)];
  const cache = readCache();
  const out = {};
  const need = [];
  for (const r of unique) {
    if (r in cache) out[r] = cache[r];
    else need.push(r);
  }
  if (!need.length) return out;

  // Light concurrency — 4 in flight at a time.
  const CONCURRENCY = 4;
  const queue = [...need];
  async function worker() {
    while (queue.length) {
      const root = queue.shift();
      out[root] = await fetchOne(root);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeCache({ ...cache, ...out });
  return out;
}
