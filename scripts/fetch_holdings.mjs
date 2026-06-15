#!/usr/bin/env node
/**
 * Ingest a fund's monthly portfolio disclosure (XLSX) and write a normalized
 * JSON file under src/data/holdings/<scheme-code>.json.
 *
 * Usage:
 *   node scripts/fetch_holdings.mjs --file ./downloads/parag.xlsx --code 122639
 *   node scripts/fetch_holdings.mjs --file ./downloads/parag.xlsx --code 122639 --asof 2026-05-31 --name "Parag Parikh Flexi Cap"
 *
 * The script tries to be tolerant of varied AMC/AMFI sheet layouts. It scans
 * every sheet looking for a header row whose columns roughly match
 *   Name | ISIN | Industry/Sector | % to NAV
 * and then collects holdings until it hits a blank row or a totals/footer row.
 *
 * Output shape:
 *   {
 *     "schemeCode": 122639,
 *     "fundName": "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
 *     "asOf": "2026-05-31",
 *     "source": "manual",            // or "amfi", "amc" — set via --source
 *     "totalEquityWeight": 81.62,
 *     "holdings": [
 *       { "name": "HDFC Bank Ltd", "isin": "INE040A01034", "sector": "Banking", "weight": 8.21 },
 *       ...
 *     ]
 *   }
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// --- arg parser (no deps) ---
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || !args.code) {
  console.error(`Usage: node scripts/fetch_holdings.mjs --file <path.xlsx> --code <schemeCode> [--asof YYYY-MM-DD] [--name "Fund Name"] [--source manual|amfi|amc]`);
  process.exit(1);
}

const xlsxPath = path.resolve(process.cwd(), args.file);
if (!fs.existsSync(xlsxPath)) {
  console.error(`File not found: ${xlsxPath}`);
  process.exit(1);
}

// --- header detection ---
const HEADER_PATTERNS = {
  name: /^(name of (the )?instrument|name|security name|company)$/i,
  isin: /^isin$/i,
  sector: /^(industry( \/ rating)?|sector|industry\/sector|sector \/ rating|industry classification)$/i,
  weight: /^(% to (nav|net assets|net asset)|% of (nav|net assets|net asset)|weight( \(%\))?|allocation( \(%\))?)$/i,
};

// Collapse all whitespace (including \r\n inside cells) to a single space.
function cleanCell(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function matchHeader(row) {
  const map = {};
  for (let i = 0; i < row.length; i++) {
    const cell = cleanCell(row[i]);
    for (const [k, re] of Object.entries(HEADER_PATTERNS)) {
      if (re.test(cell) && map[k] == null) map[k] = i;
    }
  }
  if (map.name != null && map.weight != null) return map;
  return null;
}

// Section divider rows (skip, don't terminate). These have an empty weight cell.
function isSectionDivider(row, nameIdx, weightIdx) {
  const name = cleanCell(row[nameIdx]);
  const weight = row[weightIdx];
  if (!name) return false;
  if (weight !== '' && weight != null) return false;
  return /^(equity|\([a-z]\)\s|debt|cash|tri.?party repo|treps|commercial paper|certificate of deposit|treasury bill|government securities|mutual fund units|others?|corporate bonds?)/i.test(name);
}

// Rows that end the equity block.
function isFooterRow(row, nameIdx) {
  const name = nameIdx != null ? cleanCell(row[nameIdx]).toLowerCase() : '';
  if (/^(sub.?total|grand total|total|net (current )?assets|portfolio classification|notes?|disclaimer)\b/.test(name)) {
    return true;
  }
  return false;
}

// Drop non-equity instruments by sector/name.
function isEquityRow(row, nameIdx, sectorIdx) {
  const sector = sectorIdx != null ? cleanCell(row[sectorIdx]).toLowerCase() : '';
  const name = cleanCell(row[nameIdx]).toLowerCase();
  if (!name) return false;
  if (/(treps|t.?bill|repo|net (current )?assets|government sec|gov sec|state development loan|sdl)/.test(name)) return false;
  // Sector "Banks" is equity. Debt-instrument sectors look like CRISIL A1+ / ICRA AAA / Sovereign / "CARE …".
  if (/(crisil|icra|care |ind a|brickwork|sovereign)/i.test(sector)) return false;
  if (sector && /(cash|treps|t.?bill|sdl)/.test(sector)) return false;
  return true;
}

function pickWeight(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[^\d.+\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// --- main ---
const wb = XLSX.readFile(xlsxPath, { cellDates: true });
let extracted = null;

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  let headerMap = null;
  let headerRowIdx = -1;
  for (let r = 0; r < rows.length; r++) {
    const map = matchHeader(rows[r]);
    if (map) {
      headerMap = map;
      headerRowIdx = r;
      break;
    }
  }
  if (!headerMap) continue;

  const holdings = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (isFooterRow(row, headerMap.name)) break;
    if (isSectionDivider(row, headerMap.name, headerMap.weight)) continue;
    if (!isEquityRow(row, headerMap.name, headerMap.sector)) continue;
    const name = cleanCell(row[headerMap.name]);
    const weight = pickWeight(row[headerMap.weight]);
    if (!name || weight == null || weight <= 0) continue;
    // ISIN sanity check — equity ISINs are 12 chars starting with two letters then 10 alnum.
    const isinRaw = headerMap.isin != null ? cleanCell(row[headerMap.isin]) : '';
    if (isinRaw && !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isinRaw)) continue;
    holdings.push({
      name,
      isin: isinRaw || null,
      sector: headerMap.sector != null ? cleanCell(row[headerMap.sector]) || null : null,
      weight,
    });
  }

  // If weights look like fractions (0.0788 instead of 7.88), scale to percent.
  if (holdings.length) {
    const sum = holdings.reduce((a, h) => a + h.weight, 0);
    if (sum > 0 && sum < 5) {
      holdings.forEach((h) => { h.weight = +(h.weight * 100).toFixed(2); });
    } else {
      holdings.forEach((h) => { h.weight = +h.weight.toFixed(2); });
    }
  }

  if (holdings.length >= 5) {
    extracted = { sheetName, holdings };
    break;
  }
}

if (!extracted) {
  console.error('Could not detect a holdings table. Sheets scanned:', wb.SheetNames);
  process.exit(2);
}

const totalEquityWeight = +extracted.holdings.reduce((a, h) => a + h.weight, 0).toFixed(2);
const payload = {
  schemeCode: Number(args.code),
  fundName: args.name || null,
  asOf: args.asof || new Date().toISOString().slice(0, 10),
  source: args.source || 'manual',
  totalEquityWeight,
  holdingsCount: extracted.holdings.length,
  holdings: extracted.holdings.sort((a, b) => b.weight - a.weight),
};

const outDir = path.join(ROOT, 'src', 'data', 'holdings');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${args.code}.json`);
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

console.log(`✓ Wrote ${path.relative(ROOT, outFile)}`);
console.log(`  Sheet: ${extracted.sheetName}`);
console.log(`  Holdings: ${payload.holdingsCount}`);
console.log(`  Equity weight: ${payload.totalEquityWeight}%`);
console.log(`  As of: ${payload.asOf}`);
