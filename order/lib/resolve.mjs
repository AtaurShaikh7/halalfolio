// Resolve a holding name → { tradingSymbol, symbolToken, exchange } for Angel One.
//
// Two-step:
//   1. holding name → NSE symbol root (e.g. "Infosys Ltd." → "INFY") via the
//      curated symbol-map.json (extend it when build-basket reports a miss).
//   2. symbol root → token via Angel One's public instrument master
//      (OpenAPIScripMaster.json), matching exch_seg=NSE and symbol "<ROOT>-EQ".
//
// No auth needed here — the master file is public. Cached locally for a day.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDER_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ORDER_DIR, 'cache');
const MASTER_URL =
  'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
const MASTER_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function normName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\b(ltd|limited|the|inc|plc|corp|corporation|company|co)\b/g, '')
    .replace(/[^a-z0-9&' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let _symbolMap = null;
function symbolMap() {
  if (_symbolMap) return _symbolMap;
  const raw = JSON.parse(fs.readFileSync(path.join(ORDER_DIR, 'symbol-map.json'), 'utf8'));
  // Re-key by normalised name so lookups are robust to suffixes/punctuation.
  _symbolMap = {};
  for (const [k, v] of Object.entries(raw)) _symbolMap[normName(k)] = v;
  return _symbolMap;
}

async function loadMaster() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, 'scrip-master.json');
  if (fs.existsSync(cacheFile) && Date.now() - fs.statSync(cacheFile).mtimeMs < MASTER_TTL_MS) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  const res = await fetch(MASTER_URL);
  if (!res.ok) throw new Error(`instrument master fetch failed: HTTP ${res.status}`);
  const all = await res.json();
  // Keep only NSE cash-equity rows to shrink the cache.
  const nseEq = all.filter((r) => r.exch_seg === 'NSE' && /-EQ$/.test(r.symbol || ''));
  fs.writeFileSync(cacheFile, JSON.stringify(nseEq));
  return nseEq;
}

let _bySymbol = null;
async function tokenIndex() {
  if (_bySymbol) return _bySymbol;
  const rows = await loadMaster();
  _bySymbol = {};
  for (const r of rows) _bySymbol[r.symbol] = r.token; // "INFY-EQ" → "1594"
  return _bySymbol;
}

/**
 * @returns {Promise<{tradingSymbol,symbolToken,exchange} | {unresolved:true, reason}>}
 */
export async function resolve(name) {
  const root = symbolMap()[normName(name)];
  if (!root) return { unresolved: true, reason: 'no symbol mapping' };
  if (root === 'FOREIGN') return { unresolved: true, reason: 'foreign listing — not on NSE' };

  const idx = await tokenIndex();
  const tradingSymbol = `${root}-EQ`;
  const symbolToken = idx[tradingSymbol];
  if (!symbolToken) return { unresolved: true, reason: `symbol ${tradingSymbol} not in NSE master` };
  return { tradingSymbol, symbolToken, exchange: 'NSE', symbolRoot: root };
}
