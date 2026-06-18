#!/usr/bin/env node
/**
 * Bridge: fund holdings  →  concrete buy orders for the Halal Basket.
 *
 *   1. Load the fund's ingested holdings (src/data/holdings/<code>.json).
 *   2. Keep the halal names (shariaList screen), re-weight to 100%.
 *   3. Resolve each to an Angel One { tradingSymbol, symbolToken }.
 *   4. Fetch a live price and size whole-share quantities for --amount.
 *   5. Write order/baskets/<code>.json — the reviewed input for place.mjs.
 *
 * This NEVER places an order. It only computes and writes the plan.
 *
 * Usage:
 *   node order/build-basket.mjs --code 122639 --amount 100000
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve as resolveSymbol } from './lib/resolve.mjs';
import { ltpMany } from './lib/prices.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
const code = Number(arg('code'));
const amount = Number(arg('amount', '100000'));
if (!code) {
  console.error('Usage: node order/build-basket.mjs --code <schemeCode> --amount <INR>');
  process.exit(1);
}

const { isHalal } = await import('../src/data/shariaList.js');

const holdingsPath = path.join(ROOT, 'src', 'data', 'holdings', `${code}.json`);
if (!fs.existsSync(holdingsPath)) {
  console.error(`No holdings file for ${code} at ${path.relative(ROOT, holdingsPath)}`);
  process.exit(1);
}
const fund = JSON.parse(fs.readFileSync(holdingsPath, 'utf8'));

// Halal names + adjusted (re-normalised to 100%) weights.
const halal = fund.holdings.filter((h) => isHalal(h.name, h.sector) && h.weight > 0);
const halalW = halal.reduce((a, h) => a + h.weight, 0);
const weighted = halal.map((h) => ({
  name: h.name,
  sector: h.sector || null,
  adjWeight: +((h.weight / halalW) * 100).toFixed(2),
  alloc: Math.round(amount * (h.weight / halalW)),
}));

// Resolve symbols + prices.
const resolved = [];
const unresolved = [];
for (const w of weighted) {
  const r = await resolveSymbol(w.name);
  if (r.unresolved) {
    unresolved.push({ ...w, reason: r.reason });
  } else {
    resolved.push({ ...w, ...r });
  }
}

const prices = await ltpMany(resolved.map((r) => r.symbolRoot));

const orders = [];
let priced = 0;
for (const r of resolved) {
  const px = prices[r.symbolRoot];
  const quantity = px ? Math.floor(r.alloc / px) : 0;
  if (px) priced++;
  orders.push({
    name: r.name,
    tradingSymbol: r.tradingSymbol,
    symbolToken: r.symbolToken,
    exchange: r.exchange,
    sector: r.sector,
    adjWeight: r.adjWeight,
    targetAlloc: r.alloc,
    price: px ?? null,
    quantity,
    estCost: px ? +(quantity * px).toFixed(2) : null,
  });
}

const placeable = orders.filter((o) => o.quantity > 0);
const investable = placeable.reduce((a, o) => a + o.estCost, 0);
const skippedWeight = [
  ...unresolved.map((u) => u.adjWeight),
  ...orders.filter((o) => o.quantity === 0).map((o) => o.adjWeight),
].reduce((a, w) => a + w, 0);

const basket = {
  schemeCode: code,
  fundName: fund.fundName,
  asOf: fund.asOf,
  builtAt: new Date().toISOString(),
  amount,
  currency: 'INR',
  placeableCount: placeable.length,
  investableValue: +investable.toFixed(2),
  leftoverCash: +(amount - investable).toFixed(2),
  skippedAdjWeightPct: +skippedWeight.toFixed(2),
  orders: placeable,
  zeroQty: orders.filter((o) => o.quantity === 0),
  unresolved,
};

const outDir = path.join(__dirname, 'baskets');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${code}.json`);
fs.writeFileSync(outFile, JSON.stringify(basket, null, 2) + '\n');

// --- report ---
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
console.log(`\n${fund.fundName} — Halal Basket for ${inr(amount)} (holdings as of ${fund.asOf})\n`);
console.log('  Qty  Symbol           Weight  Alloc        Price     Est. cost');
console.log('  ---  ---------------  ------  -----------  --------  -----------');
for (const o of placeable.sort((a, b) => b.adjWeight - a.adjWeight)) {
  console.log(
    `  ${String(o.quantity).padStart(3)}  ${o.tradingSymbol.padEnd(15)}  ${String(o.adjWeight).padStart(5)}%  ${inr(o.targetAlloc).padStart(11)}  ${(o.price ? o.price.toFixed(1) : '—').padStart(8)}  ${inr(o.estCost).padStart(11)}`
  );
}
console.log(
  `\n  Placeable: ${placeable.length} stocks · investing ${inr(investable)} · leftover ${inr(basket.leftoverCash)}`
);
if (basket.zeroQty.length)
  console.log(`  Zero-qty (alloc < 1 share or no price): ${basket.zeroQty.map((o) => o.tradingSymbol).join(', ')}`);
if (unresolved.length) {
  console.log(`\n  ⚠ Unresolved (${unresolved.length}) — add to order/symbol-map.json or accept as skipped:`);
  unresolved.forEach((u) => console.log(`     ${u.name}  — ${u.reason}  (${u.adjWeight}%)`));
}
console.log(`  Skipped weight (unresolved + zero-qty): ${basket.skippedAdjWeightPct}%`);
console.log(`\n  ✓ Wrote ${path.relative(ROOT, outFile)} — review it, then run place.mjs.\n`);
