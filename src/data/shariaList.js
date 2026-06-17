// Centralized Sharia screening lookup. Two-pass resolution:
//   1. Exact name match in NON_COMPLIANT_NAMES / COMPLIANT_NAMES.
//   2. Sector fallback in NON_COMPLIANT_SECTORS.
//
// Standard AAOIFI sector screens treat the following as non-compliant by core
// business activity: conventional banks, NBFCs, insurance, alcohol, tobacco,
// gambling, adult entertainment, pork, and interest-based instruments.

// Stocks that fail the screen regardless of sector text.
const NON_COMPLIANT_NAMES = new Set([
  'hdfc bank', 'hdfc bank ltd',
  'icici bank', 'icici bank ltd',
  'axis bank', 'axis bank ltd',
  'state bank of india', 'sbi',
  'kotak mahindra bank', 'kotak mahindra bank ltd', 'kotak bank',
  'indusind bank',
  'punjab national bank',
  'bank of baroda',
  'federal bank',
  'idfc first bank',
  'au small finance bank',
  'yes bank',
  'bandhan bank',
  'bajaj finance', 'bajaj finserv',
  'bajaj holdings', 'bajaj holdings & investment',
  'cholamandalam investment', 'cholamandalam financial',
  'shriram finance', 'shriram transport finance',
  'muthoot finance',
  'manappuram finance',
  'l&t finance', 'lt finance', 'l&t finance holdings',
  'mahindra & mahindra financial', 'm&m financial',
  'piramal enterprises',
  'jio financial', 'jio financial services',
  'pfc', 'power finance corp', 'rec ltd', 'irfc',
  'sbi life insurance', 'sbi life',
  'hdfc life', 'hdfc life insurance',
  'icici prudential', 'icici prudential life',
  'max life insurance', 'max financial',
  'new india assurance',
  'general insurance corp', 'gic re',
  'united spirits', 'usl', 'radico khaitan', 'globus spirits',
  'itc', 'itc ltd', // tobacco core business
  'godfrey phillips', 'vst industries',
  'delta corp', // gaming/casinos
  // Credit rating agencies — core business is rating riba instruments (bonds, CPs, NCDs)
  'icra', 'icra ltd',
  'crisil', 'crisil ltd',
  'care ratings', 'care ratings ltd',
  'brickwork ratings',
  'india ratings', 'india ratings & research',
  'acuite ratings', 'acuite ratings & research',
]);

// Things that pass the sector screen even if the sector string looks ambiguous.
const COMPLIANT_NAMES = new Set([
  'infosys', 'tcs', 'tata consultancy services', 'wipro', 'hcl technologies',
  'tech mahindra', 'mphasis', 'persistent systems', 'coforge',
  'reliance', 'reliance industries',
  'ongc', 'oil & natural gas corp',
  'coal india',
  'power grid', 'power grid corp', 'ntpc',
  'sun pharma', 'cipla', "dr. reddy's labs", "dr reddy's labs", "dr reddys", 'lupin', "divi's labs", 'abbott india',
  'maruti suzuki', 'tata motors', 'mahindra & mahindra', 'm&m', 'bajaj auto', 'hero motocorp',
  'l&t', 'larsen & toubro', 'larsen and toubro',
  'asian paints', 'pidilite industries', 'pidilite',
  'titan', 'titan company',
  'nestle india', 'britannia', 'britannia industries', 'hul', 'hindustan unilever',
  'godrej consumer', 'dabur', 'marico', 'colgate-palmolive',
  'adani ports', 'tata steel', 'jsw steel', 'sail', 'hindalco', 'vedanta',
  'ultratech cement', 'shree cement', 'ambuja cements', 'acc',
  'bharti airtel', 'airtel',
  'alphabet inc', 'microsoft corp', 'amazon.com', 'apple inc', 'meta platforms',
  'motherson sumi', 'havells india', 'voltas',
  'trent', 'avenue supermarts', 'dmart',
]);

// Core-business keywords applied to the *instrument name* itself. AMFI/AMC
// sheets often ship without a sector column, so we can't rely on enumerating
// every bank/NBFC. Any holding whose name carries one of these (e.g.
// "The Federal Bank", "Karur Vysya Bank", "Cholamandalam Financial Holdings")
// fails the screen — unless it's explicitly allow-listed in COMPLIANT_NAMES.
const NON_COMPLIANT_NAME_PATTERNS = [
  /\bbank\b/,
  /\bbanking\b/,
  /\bfinance\b/,
  /\bfinancial\b/,
  /\bnbfc\b/,
  /\binsurance\b/,
  /\bassurance\b/,
  /\bspirits\b/,
  /\bbreweries\b/,
  /\bbrewing\b/,
  /\bdistilleries\b/,
  /\bwines?\b/,
  /\bliquor\b/,
  /\btobacco\b/,
  /\bcigarettes?\b/,
];

// Sector terms that fail by default.
const NON_COMPLIANT_SECTORS = [
  /^banking$/i,
  /^bank /i,
  /\bbank\b/i,
  /^finance$/i,
  /^financial services$/i,
  /^nbfc$/i,
  /\bnbfc\b/i,
  /^insurance$/i,
  /^alcohol/i,
  /^tobacco/i,
  /^gaming|casino|gambling/i,
  /^pork/i,
  /^conventional finance/i,
  /^credit rating/i,
];

function norm(s) {
  // Lowercase, then drop footnote markers (£ # * ^ ~ † @ …) and punctuation that
  // AMFI/AMC sheets append to instrument names, keeping only letters, digits,
  // ampersand and apostrophe. "HDFC Bank Ltd.£" → "hdfc bank ltd".
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9&' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Return true if the stock is Sharia-compliant.
 * @param {string} name   Stock name (case-insensitive)
 * @param {string} [sector]
 */
export function isHalal(name, sector) {
  const n = norm(name);
  if (!n) return true; // empty — treat as compliant placeholder
  // Drop a leading article and common corporate suffixes for fuzzy comparison.
  const stripped = n
    .replace(/^the\s+/, '')
    .replace(/\b(ltd|limited|inc|plc|corp|corporation|company|co|nv|sa)\b/g, '')
    .trim();

  if (NON_COMPLIANT_NAMES.has(n) || NON_COMPLIANT_NAMES.has(stripped)) return false;
  if (COMPLIANT_NAMES.has(n) || COMPLIANT_NAMES.has(stripped)) return true;

  // Name-based core-business screen (works even with no sector column).
  for (const re of NON_COMPLIANT_NAME_PATTERNS) {
    if (re.test(n)) return false;
  }

  if (sector) {
    for (const re of NON_COMPLIANT_SECTORS) {
      if (re.test(sector)) return false;
    }
  }
  // Default: pass unless we explicitly flag.
  return true;
}

export function summarize(holdings) {
  let halalW = 0;
  let haramW = 0;
  for (const h of holdings) {
    if (h.h) halalW += h.w;
    else haramW += h.w;
  }
  return { halalW: +halalW.toFixed(2), haramW: +haramW.toFixed(2) };
}
