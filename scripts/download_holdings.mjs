#!/usr/bin/env node
/**
 * Auto-download monthly portfolio disclosures via a real (headless) browser.
 *
 * Why a browser and not fetch()? The AMC sites are JS-rendered SPAs behind
 * anti-bot (Cloudflare) and session-gated AJAX services. A scripted fetch gets
 * 403/302; a real Chromium that runs the page JS and clicks the link does not.
 *
 * Strategy per fund:
 *   1. Open the AMC disclosure page.
 *   2. Find the download link/row whose text matches `match` (the fund name).
 *   3. Capture the file via Playwright's download event → downloads/<code>.xlsx.
 *
 * This is best-effort. Any fund that fails (timeout, blocked, link not found)
 * is reported back so the orchestrator can ask a human to grab it manually.
 *
 * Usage:
 *   node scripts/download_holdings.mjs                # all funds
 *   node scripts/download_holdings.mjs --only 118955  # one fund
 *
 * Output: writes downloads/<schemeCode>.xlsx and prints a JSON summary line:
 *   __RESULT__{"ok":[122639],"failed":[{"code":118955,"name":"...","page":"...","reason":"..."}]}
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DL_DIR = path.join(ROOT, 'downloads');

const args = process.argv.slice(2);
const onlyCode = args.includes('--only') ? Number(args[args.indexOf('--only') + 1]) : null;
const HEADLESS = !args.includes('--headed');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'funds.config.json'), 'utf8'));
let funds = cfg.funds;
if (onlyCode) funds = funds.filter((f) => f.schemeCode === onlyCode);

fs.mkdirSync(DL_DIR, { recursive: true });

// --- per-AMC recipes -------------------------------------------------------
// Each recipe receives a Playwright `page` already navigated to fund.page, and
// must trigger a download. It returns the captured download or throws.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function clickMatchingDownload(page, match) {
  // Generic: find an <a> whose text or href contains an xlsx/xls and whose
  // row/label text includes `match`. Works for most listing-style pages.
  const re = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const links = await page.locator('a').all();
  for (const a of links) {
    const text = ((await a.textContent()) || '').replace(/\s+/g, ' ').trim();
    const href = (await a.getAttribute('href')) || '';
    const isFile = /\.(xlsx|xls)(\?|$)/i.test(href) || /portfolio/i.test(href);
    if (isFile && (re.test(text) || re.test(href))) {
      return a;
    }
  }
  return null;
}

const RECIPES = {
  // PPFAS: a clean listing page; the latest monthly link is at the top.
  async ppfas(page, fund) {
    const link = await clickMatchingDownload(page, fund.match);
    if (!link) throw new Error('PPFAS: monthly portfolio link not found');
    return link;
  },
  // The big AMCs all render a table of funds; pick the row matching the name.
  async hdfc(page, fund) {
    const link = await clickMatchingDownload(page, fund.match);
    if (!link) throw new Error('HDFC: fund row not found (likely Cloudflare or layout change)');
    return link;
  },
  async icici(page, fund) {
    const link = await clickMatchingDownload(page, fund.match);
    if (!link) throw new Error('ICICI: fund row not found');
    return link;
  },
  async invesco(page, fund) {
    const link = await clickMatchingDownload(page, fund.match);
    if (!link) throw new Error('Invesco: fund row not found');
    return link;
  },
  async mirae(page, fund) {
    const link = await clickMatchingDownload(page, fund.match);
    if (!link) throw new Error('Mirae: fund row not found');
    return link;
  },
};

async function run() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      'Playwright not installed. Run:\n  npm i -D playwright\n  npx playwright install chromium'
    );
    // Treat every fund as failed-needs-manual so the pipeline still notifies.
    const failed = funds.map((f) => ({
      code: f.schemeCode,
      name: f.name,
      page: f.page,
      reason: 'playwright-not-installed',
    }));
    console.log('__RESULT__' + JSON.stringify({ ok: [], failed }));
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const ctx = await browser.newContext({ userAgent: UA, acceptDownloads: true });
  const ok = [];
  const failed = [];

  for (const fund of funds) {
    const page = await ctx.newPage();
    try {
      await page.goto(fund.page, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500); // let SPA hydrate

      const recipe = RECIPES[fund.amc];
      if (!recipe) throw new Error(`no recipe for amc "${fund.amc}"`);

      const link = await recipe(page, fund);
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        link.click(),
      ]);

      const out = path.join(DL_DIR, `${fund.schemeCode}.xlsx`);
      await download.saveAs(out);
      const size = fs.statSync(out).size;
      if (size < 2000) throw new Error(`downloaded file too small (${size} bytes)`);

      console.error(`✓ ${fund.name} → downloads/${fund.schemeCode}.xlsx (${size} bytes)`);
      ok.push(fund.schemeCode);
    } catch (err) {
      console.error(`✗ ${fund.name}: ${err.message}`);
      failed.push({ code: fund.schemeCode, name: fund.name, page: fund.page, reason: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('__RESULT__' + JSON.stringify({ ok, failed }));
}

run().catch((e) => {
  console.error(e);
  console.log('__RESULT__' + JSON.stringify({ ok: [], failed: funds.map((f) => ({ code: f.schemeCode, name: f.name, page: f.page, reason: String(e) })) }));
  process.exit(0);
});
