// Loads any holdings JSON files emitted by scripts/fetch_holdings.mjs.
// Vite eagerly bundles every src/data/holdings/*.json at build time.

import { isHalal } from './shariaList';

// Glob path is relative to THIS file: src/data/holdings.js → ./holdings/*.json
const modules = import.meta.glob('./holdings/*.json', { eager: true });

const byCode = {};
for (const [filepath, mod] of Object.entries(modules)) {
  const payload = mod.default ?? mod;
  // Skip the placeholder (schemeCode === 0) and anything else without a real code.
  if (payload?.schemeCode && payload.schemeCode > 0) byCode[payload.schemeCode] = payload;
}

/** Get the latest ingested portfolio for a scheme, or null if none. */
export function getHoldings(schemeCode) {
  return byCode[schemeCode] ?? null;
}

/**
 * Convert ingested holdings to the shape the analyzer expects (matches fund.secs):
 *   [{ n: name, s: sector, w: weight, h: halal }]
 * Halal flag comes from the shariaList lookup; sector falls back to "Other".
 */
export function holdingsToSecs(payload) {
  if (!payload?.holdings?.length) return null;
  return payload.holdings.map((h) => ({
    n: h.name,
    s: h.sector || 'Other',
    w: h.weight,
    h: isHalal(h.name, h.sector),
    isin: h.isin || null,
  }));
}
