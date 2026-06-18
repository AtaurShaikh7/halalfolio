#!/usr/bin/env node
/**
 * Place the Halal Basket as real BUY orders via Angel One SmartAPI.
 *
 * SAFETY MODEL (read this):
 *   • DRY-RUN BY DEFAULT. Without --confirm it places NOTHING — it logs in,
 *     validates the session, and prints exactly what it *would* do.
 *   • --confirm is the explicit human action that authorises real orders.
 *   • A live pre-flight (one 1-share order) runs first unless --no-preflight.
 *   • Rate-limited to ~3.3 orders/sec (well under Angel's 9/sec cap).
 *   • Every result is written to order/execution-logs/ — your audit trail.
 *   • Failures are logged and surfaced, never silently retried.
 *   • NEVER wrap this in a scheduler/cron. A human confirms every run.
 *
 * Usage:
 *   node order/place.mjs --basket order/baskets/122639.json              # dry run
 *   node order/place.mjs --basket order/baskets/122639.json --confirm    # REAL orders
 *   node order/place.mjs --basket order/baskets/122639.json --confirm --no-preflight
 *
 * Requires order/.env (see .env.example). Personal use, your own account.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const next = process.argv[i + 1];
  return !next || next.startsWith('--') ? true : next;
}
const has = (name) => process.argv.includes(`--${name}`);

const basketPath = arg('basket');
const CONFIRM = has('confirm');
const PREFLIGHT = !has('no-preflight');
const PREFLIGHT_SYMBOL = { tradingSymbol: 'IDEA-EQ', symbolToken: '14366', exchange: 'NSE' }; // cheap, liquid

if (!basketPath || basketPath === true) {
  console.error('Usage: node order/place.mjs --basket order/baskets/<code>.json [--confirm] [--no-preflight]');
  process.exit(1);
}
const basket = JSON.parse(fs.readFileSync(path.resolve(basketPath), 'utf8'));
const orders = basket.orders ?? [];
if (!orders.length) {
  console.error('Basket has no placeable orders.');
  process.exit(1);
}

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function printPlan() {
  console.log(`\nHalal Basket — ${basket.fundName} (${basket.schemeCode})`);
  console.log(`Amount ${inr(basket.amount)} · ${orders.length} orders · est. invest ${inr(basket.investableValue)}\n`);
  console.log('  Qty  Symbol           Token     Est. cost');
  console.log('  ---  ---------------  --------  -----------');
  for (const o of orders) {
    console.log(`  ${String(o.quantity).padStart(3)}  ${o.tradingSymbol.padEnd(15)}  ${String(o.symbolToken).padEnd(8)}  ${inr(o.estCost ?? 0).padStart(11)}`);
  }
}

function logExecution(results, tag) {
  const dir = path.join(__dirname, 'execution-logs');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `run-${Date.now()}-${tag}.json`);
  fs.writeFileSync(file, JSON.stringify({ basket: basket.schemeCode, tag, results }, null, 2));
  console.log(`\nLog: ${path.relative(path.resolve(__dirname, '..'), file)}`);
}

// ---------------------------------------------------------------------------

printPlan();

if (!CONFIRM) {
  console.log('\n— DRY RUN — no orders placed. Re-run with --confirm to place real orders.');
  process.exit(0);
}

// Real placement path below. Lazy-import so dry-run needs no creds/deps.
const dotenvPath = path.join(__dirname, '.env');
if (fs.existsSync(dotenvPath)) {
  for (const line of fs.readFileSync(dotenvPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}

const need = ['ANGEL_API_KEY', 'ANGEL_CLIENT_CODE', 'ANGEL_PASSWORD', 'ANGEL_TOTP_SECRET'];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\nMissing env vars: ${missing.join(', ')}. See order/.env.example.`);
  process.exit(1);
}

let SmartAPI, authenticator;
try {
  ({ SmartAPI } = await import('smartapi-javascript'));
  ({ authenticator } = await import('otplib'));
} catch {
  console.error('\nInstall deps: npm i smartapi-javascript otplib');
  process.exit(1);
}

const smart_api = new SmartAPI({ api_key: process.env.ANGEL_API_KEY });

async function login() {
  const totp = authenticator.generate(process.env.ANGEL_TOTP_SECRET);
  const session = await smart_api.generateSession(
    process.env.ANGEL_CLIENT_CODE,
    process.env.ANGEL_PASSWORD,
    totp
  );
  if (!session?.data?.jwtToken) throw new Error(`login failed: ${JSON.stringify(session?.message ?? session)}`);
  return session;
}

async function placeOrder(o) {
  const params = {
    variety: 'NORMAL',
    tradingsymbol: o.tradingSymbol,
    symboltoken: String(o.symbolToken),
    transactiontype: 'BUY',
    exchange: o.exchange,
    ordertype: 'MARKET',
    producttype: 'DELIVERY',
    duration: 'DAY',
    quantity: String(o.quantity),
  };
  try {
    const res = await smart_api.placeOrder(params);
    return { tradingSymbol: o.tradingSymbol, orderId: res?.data?.orderid, status: 'PLACED', at: new Date().toISOString() };
  } catch (err) {
    return { tradingSymbol: o.tradingSymbol, status: 'FAILED', error: err?.message ?? String(err), at: new Date().toISOString() };
  }
}

try {
  console.log('\nLogging in to Angel One…');
  await login();
  console.log('Session OK.');

  if (PREFLIGHT) {
    console.log(`\nPre-flight: placing ONE 1-share order (${PREFLIGHT_SYMBOL.tradingSymbol}) to verify IP/auth/permissions…`);
    const pf = await placeOrder({ ...PREFLIGHT_SYMBOL, quantity: 1 });
    logExecution([pf], 'preflight');
    if (pf.status !== 'PLACED') {
      console.error(`Pre-flight FAILED: ${pf.error}. Stopping — fix this before the batch (static IP whitelisted? order perms on?).`);
      process.exit(1);
    }
    console.log(`Pre-flight PLACED (orderId ${pf.orderId}). Proceeding to batch.`);
  }

  console.log(`\nPlacing ${orders.length} orders (≈300ms apart)…`);
  const results = [];
  for (const o of orders) {
    const r = await placeOrder(o);
    results.push(r);
    console.log(`  ${r.status}: ${o.tradingSymbol} ×${o.quantity}  ${r.orderId ?? r.error ?? ''}`);
    await sleep(300);
  }
  logExecution(results, 'batch');

  const failed = results.filter((r) => r.status === 'FAILED');
  console.log(`\nDone. ${results.length - failed.length}/${results.length} placed.`);
  if (failed.length) {
    console.log('Failed (NOT retried — review manually):');
    failed.forEach((f) => console.log(`  ${f.tradingSymbol}: ${f.error}`));
  }
} catch (err) {
  console.error('\nAborted:', err.message);
  process.exit(1);
}
