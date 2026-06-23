import { FUNDS } from '../data/funds';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { fetchNavSeries } from '../services/mfapi';
import { computeFromNav } from '../services/navAnalytics';
import { addMonths, startOfMonth } from '../lib/format';
import { getHoldings, holdingsToSecs } from '../data/holdings';

// Deterministic small variance for simulated metrics
function seeded(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };
}

function shariaScreen(rawSecs) {
  const halalW = rawSecs.filter((s) => s.h).reduce((a, s) => a + s.w, 0);
  const haramW = rawSecs.filter((s) => !s.h).reduce((a, s) => a + s.w, 0);
  const nf = halalW > 0 ? 100 / halalW : 1;
  const secs = rawSecs.map((s) => ({
    ...s,
    aw: s.h ? +(s.w * nf).toFixed(2) : 0,
  }));
  const removed = secs.filter((s) => !s.h).length;
  const sectorMap = {};
  secs.filter((s) => s.h).forEach((s) => {
    sectorMap[s.s] = (sectorMap[s.s] || 0) + s.aw;
  });
  const sectors = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value);

  // Original (pre-screening) sector breakdown, normalized to 100%
  const origSectorMap = {};
  for (const s of rawSecs) {
    origSectorMap[s.s || 'Other'] = (origSectorMap[s.s || 'Other'] || 0) + s.w;
  }
  const origTotal = rawSecs.reduce((a, s) => a + s.w, 0) || 1;
  const origSectors = Object.entries(origSectorMap)
    .map(([name, w]) => ({ name, value: +((w / origTotal) * 100).toFixed(2) }))
    .sort((a, b) => b.value - a.value);

  return { halalW, haramW, secs, removed, sectors, origSectors };
}

// Resolve the holdings list to use for a given fund: prefer the ingested AMFI
// JSON (when available) over the prototype's hardcoded secs[].
function resolveSecs(fund) {
  if (fund.schemeCode) {
    const ingested = getHoldings(fund.schemeCode);
    const live = holdingsToSecs(ingested);
    if (live) {
      return { rawSecs: live, holdingsSource: 'amfi', holdingsAsOf: ingested.asOf };
    }
  }
  return { rawSecs: fund.secs, holdingsSource: 'prototype', holdingsAsOf: null };
}

// --- Simulated path (used for funds without a schemeCode) ---
export function computeSimulated(fund, period, fundKey) {
  const rand = seeded(`${fundKey}-${period}`);
  const { rawSecs, holdingsSource, holdingsAsOf } = resolveSecs(fund);
  const { halalW, haramW, secs, removed, sectors, origSectors } = shariaScreen(rawSecs);

  const origC = fund.cagr[period] ?? fund.cagr[5] ?? fund.cagr[3];
  const sharC = +(origC + (fund.impact[period] ?? fund.impact[5] ?? fund.impact[3])).toFixed(1);
  const delta = +(sharC - origC).toFixed(1);
  const absR = +((Math.pow(1 + sharC / 100, period) - 1) * 100).toFixed(1);

  const vol = +(12 + rand() * 10).toFixed(1);
  const sVol = +(vol * (0.88 + rand() * 0.17)).toFixed(1);
  const sharpe = +((sharC - 7) / sVol).toFixed(2);
  const sortino = +(sharpe * (1.25 + rand() * 0.3)).toFixed(2);
  const beta = +(0.85 + rand() * 0.4).toFixed(2);
  const alpha = +(sharC - (7 + beta * (14.5 - 7))).toFixed(1);
  const maxdd = -(+(22 + rand() * 20).toFixed(1));
  const recov = Math.round(4 + rand() * 10);
  const ir = +(0.3 + rand() * 0.6).toFixed(2);
  const te = +(4 + rand() * 5).toFixed(1);
  const win = Math.round(55 + rand() * 17);

  const compScore = Math.max(
    30,
    Math.min(100, Math.round(100 - haramW * 1.8 - fund.debt * 0.3 - fund.intinc * 2))
  );
  const verdict = delta > -2 ? 'invest' : delta > -4 ? 'caution' : 'avoid';

  // NAV series — date-anchored ending this month, going back `period` years.
  const months = period * 12;
  const moOrig = Math.pow(1 + origC / 100, 1 / 12) - 1;
  const moShar = Math.pow(1 + sharC / 100, 1 / 12) - 1;
  const moNifty = Math.pow(1 + 13.5 / 100, 1 / 12) - 1;
  const today = startOfMonth(new Date());
  let oV = 100, sV = 100, nV = 100;
  const nav = Array.from({ length: months + 1 }, (_, i) => {
    if (i > 0) {
      const wob = (rand() - 0.5) * 0.02;
      oV *= 1 + moOrig + wob;
      sV *= 1 + moShar + wob * 0.95;
      nV *= 1 + moNifty + wob * 1.05;
    }
    return {
      m: i,
      date: addMonths(today, i - months),
      original: +oV.toFixed(2),
      sharia: +sV.toFixed(2),
      nifty: +nV.toFixed(2),
    };
  });
  let peak = nav[0].sharia;
  const dd = nav.map((p) => {
    peak = Math.max(peak, p.sharia);
    return { m: p.m, date: p.date, dd: +(((p.sharia - peak) / peak) * 100).toFixed(2) };
  });
  const monthlyAvg = Math.pow(1 + sharC / 100, 1 / 12) - 1;
  const heat = Array.from({ length: 12 }, (_, i) => {
    const ret = (monthlyAvg + (rand() - 0.42) * 0.04) * 100;
    return { i, ret: +ret.toFixed(2), date: addMonths(today, i - 11) };
  });
  const windows = [1, 2, 3, 5, 7].filter((w) => w <= period);
  const rolling = windows.map((w) => ({
    window: w,
    avg: +(sharC + (rand() - 0.5) * 3).toFixed(1),
    min: +(sharC - 6 - rand() * 4).toFixed(1),
    max: +(sharC + 8 + rand() * 5).toFixed(1),
  }));

  return {
    source: 'simulated',
    holdingsSource, holdingsAsOf,
    origC, sharC, delta, absR,
    vol, sVol, sharpe, sortino, beta, alpha, maxdd, recov, ir, te, win,
    compScore, secs, removed, haramW, halalW, sectors, origSectors, verdict,
    nav, dd, heat, rolling,
    period,
    aum: fund.aum,
    exp: fund.exp,
    turn: fund.turn,
    purif: fund.purif,
    debt: fund.debt,
    intinc: fund.intinc,
  };
}

// --- Live path (real NAV via mfapi.in) ---
export async function computeLive(fund, period, fundKey) {
  const { meta, series } = await fetchNavSeries(fund.schemeCode);
  const a = computeFromNav(series);
  const pp = a.perPeriod(period);
  if (!pp) {
    // Not enough history for this period — fall back gracefully
    const sim = computeSimulated(fund, period, fundKey);
    return { ...sim, source: 'simulated', warning: `Only ${(a.monthlyCount / 12).toFixed(1)}Y of NAV available — falling back to simulation.` };
  }

  const { rawSecs, holdingsSource, holdingsAsOf } = resolveSecs(fund);
  const { halalW, haramW, secs, removed, sectors, origSectors } = shariaScreen(rawSecs);

  // Live "original" CAGR comes from NAV. Sharia version applies the fund's per-period impact.
  const origC = +pp.cagr.toFixed(2);
  const impactDelta = fund.impact[period];
  const sharC = +(origC + impactDelta).toFixed(2);
  const delta = +(sharC - origC).toFixed(2);
  const absR = +((Math.pow(1 + sharC / 100, period) - 1) * 100).toFixed(2);

  const vol = +pp.vol.toFixed(2);
  const sVol = +(vol * 0.96).toFixed(2);
  const sharpe = +pp.sharpe.toFixed(2);
  const sortino = +(sharpe * 1.35).toFixed(2);
  // Without benchmark NAV: beta/alpha/te/ir are coarse estimates from vol.
  const beta = +Math.min(1.4, Math.max(0.6, vol / 14)).toFixed(2);
  const alpha = +(sharC - (7 + beta * (13.5 - 7))).toFixed(2);
  const ir = +(Math.abs(sharC - 13.5) / Math.max(1, vol * 0.4)).toFixed(2);
  const te = +(vol * 0.3).toFixed(2);
  const maxdd = pp.maxDd;
  const recov = pp.recovery ?? Math.round(Math.abs(maxdd) / 3);
  const win = pp.winRate;

  // NAV growth: live "sharia" line is the real NAV rebased to 100 with the impact applied geometrically.
  const impactPerMonth = Math.pow(1 + impactDelta / 100, 1 / 12) - 1;
  const niftyPerMonth = Math.pow(1 + 13.5 / 100, 1 / 12) - 1;
  const nav = pp.nav.map((p, i) => {
    const sharia = +(p.sharia * Math.pow(1 + impactPerMonth, i)).toFixed(2);
    const nifty = +(100 * Math.pow(1 + niftyPerMonth, i)).toFixed(2);
    return { m: p.m, date: p.date, original: p.sharia, sharia, nifty };
  });

  const compScore = Math.max(
    30,
    Math.min(100, Math.round(100 - haramW * 1.8 - fund.debt * 0.3 - fund.intinc * 2))
  );
  const verdict = delta > -2 ? 'invest' : delta > -4 ? 'caution' : 'avoid';

  return {
    source: 'live',
    holdingsSource, holdingsAsOf,
    meta,
    seriesStart: a.seriesStart,
    seriesEnd: a.seriesEnd,
    origC, sharC, delta, absR,
    vol, sVol, sharpe, sortino, beta, alpha, maxdd, recov, ir, te, win,
    compScore, secs, removed, haramW, halalW, sectors, origSectors, verdict,
    nav,
    dd: pp.drawdown,
    heat: a.last12,
    rolling: pp.rolling,
    period,
    aum: fund.aum,
    exp: fund.exp,
    turn: fund.turn,
    purif: fund.purif,
    debt: fund.debt,
    intinc: fund.intinc,
  };
}

export function useAnalyze() {
  const { fundKey, period, setResults, setLoading, setActiveTab } = useAnalysisStore();
  return async () => {
    if (!fundKey) return;
    setLoading(true);
    setResults(null);
    setActiveTab('t-ret');
    const fund = FUNDS[fundKey];

    try {
      const result = fund.schemeCode
        ? await computeLive(fund, period, fundKey)
        : await new Promise((r) => setTimeout(() => r(computeSimulated(fund, period, fundKey)), 1400));
      setResults(result);
    } catch (err) {
      console.error('Live analysis failed; falling back to simulation.', err);
      setResults({ ...computeSimulated(fund, period, fundKey), warning: `Live data unavailable (${err.message}). Showing simulated metrics.` });
    } finally {
      setLoading(false);
    }
  };
}
