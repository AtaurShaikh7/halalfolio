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

// GitHub Pages can't reach Yahoo directly (CORS), and any single free CORS
// proxy rate-limits aggressively (the symptom: 2–3 prices succeed, the rest
// fail). So per stock we walk a list of endpoints in order and return the
// first one that returns a valid price. The list mixes Yahoo direct + two
// passthrough proxies so we degrade gracefully when any one is throttled.
const YAHOO = (s) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}.NS?interval=1d&range=1d`;

const ENDPOINTS = [
  (s) => YAHOO(s),                                                  // direct
  (s) => `https://corsproxy.io/?${encodeURIComponent(YAHOO(s))}`,   // proxy 1
  (s) => `https://api.allorigins.win/raw?url=${encodeURIComponent(YAHOO(s))}`, // proxy 2
];

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
  for (const makeUrl of ENDPOINTS) {
    const px = await tryFetch(makeUrl(symbolRoot));
    if (px != null) return px;
  }
  return null;
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

  // Concurrency 2 (was 4) — free CORS proxies throttle aggressively above this.
  // Adds a small jitter between calls to spread load across the proxies' windows.
  const CONCURRENCY = 2;
  const queue = [...need];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function worker() {
    while (queue.length) {
      const root = queue.shift();
      out[root] = await fetchOne(root);
      await sleep(120 + Math.random() * 80);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  // Only cache *real* prices — caching nulls makes a transient proxy hiccup
  // stick around for an hour. A re-render will retry the null ones.
  const cacheable = Object.fromEntries(Object.entries(out).filter(([, v]) => v != null));
  writeCache({ ...cache, ...cacheable });
  return out;
}
