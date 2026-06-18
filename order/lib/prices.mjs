// Live NSE last-traded price for a symbol root, via Yahoo Finance (free, no key).
// Used only to size quantities (₹ allocation → whole shares). The actual buy is
// a MARKET order, so the execution price isn't pinned to this — it's for sizing.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** @returns {Promise<number|null>} last price in INR, or null if unavailable */
export async function ltp(symbolRoot) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbolRoot
  )}.NS?interval=1d&range=1d`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const j = await res.json();
    const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

/** Fetch many prices with light concurrency. @returns {Promise<Record<string,number|null>>} */
export async function ltpMany(roots, concurrency = 5) {
  const out = {};
  const queue = [...new Set(roots)];
  async function worker() {
    while (queue.length) {
      const root = queue.shift();
      out[root] = await ltp(root);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}
