// Map a holding name → NSE symbol root for price/order routing.
// Same logic as order/lib/resolve.mjs but for the browser. Reads the canonical
// symbol-map.json so the web UI and the order script never diverge.

import rawMap from '../../order/symbol-map.json';

function normName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\b(ltd|limited|the|inc|plc|corp|corporation|company|co)\b/g, '')
    .replace(/[^a-z0-9&' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const lookup = {};
for (const [k, v] of Object.entries(rawMap)) {
  if (k.startsWith('_')) continue;
  lookup[normName(k)] = v;
}

/** @returns {{symbolRoot:string} | {unresolved:true, reason:string}} */
export function resolveSymbol(name) {
  const root = lookup[normName(name)];
  if (!root) return { unresolved: true, reason: 'not mapped' };
  if (root === 'FOREIGN') return { unresolved: true, reason: 'foreign listing' };
  return { symbolRoot: root };
}
