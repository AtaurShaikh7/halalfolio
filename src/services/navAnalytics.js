// Compute the analyzer's metrics from a chronological NAV series.
// Input: series = [{date: Date, nav: number}, ...] (oldest → newest)

const RISK_FREE = 0.07; // 7% — standard Indian risk-free proxy

// Find the NAV point closest to (target Date), searching from the end backward.
function navAt(series, target) {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].date <= target) return series[i];
  }
  return series[0];
}

function cagr(startNav, endNav, years) {
  if (startNav <= 0 || endNav <= 0 || years <= 0) return null;
  return (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
}

// Reduce daily series → monthly samples (last NAV of each calendar month).
function monthlySamples(series) {
  const out = [];
  let curKey = null;
  let curPoint = null;
  for (const p of series) {
    const key = `${p.date.getUTCFullYear()}-${p.date.getUTCMonth()}`;
    if (key !== curKey) {
      if (curPoint) out.push(curPoint);
      curKey = key;
    }
    curPoint = p;
  }
  if (curPoint) out.push(curPoint);
  return out;
}

function stddev(xs) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, x) => a + x, 0) / xs.length;
  const v = xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function computeFromNav(series, periods = [1, 3, 5, 7, 10]) {
  const end = series[series.length - 1];
  const endNav = end.nav;
  const endDate = end.date;

  // CAGR by period
  const cagrByYears = {};
  const navByYears = {};
  for (const y of periods) {
    const target = new Date(endDate);
    target.setUTCFullYear(target.getUTCFullYear() - y);
    const startPt = navAt(series, target);
    const startDate = startPt.date;
    const actualYears = (endDate - startDate) / (365.25 * 24 * 3600 * 1000);
    if (actualYears >= y * 0.9) {
      cagrByYears[y] = +cagr(startPt.nav, endNav, actualYears).toFixed(2);
      navByYears[y] = { start: startPt, end, years: actualYears };
    } else {
      cagrByYears[y] = null;
    }
  }

  // Monthly returns (geometric % change)
  const monthly = monthlySamples(series);
  const mret = [];
  for (let i = 1; i < monthly.length; i++) {
    mret.push((monthly[i].nav - monthly[i - 1].nav) / monthly[i - 1].nav);
  }

  // Period-bound monthly returns (used for risk metrics)
  function monthlyForYears(years) {
    const n = Math.min(mret.length, Math.round(years * 12));
    return mret.slice(-n);
  }

  // Annualized vol from monthly std
  function volFor(years) {
    const sub = monthlyForYears(years);
    return +(stddev(sub) * Math.sqrt(12) * 100).toFixed(2);
  }

  // Win rate: % of positive months
  function winRateFor(years) {
    const sub = monthlyForYears(years);
    if (!sub.length) return null;
    const wins = sub.filter((r) => r > 0).length;
    return Math.round((wins / sub.length) * 100);
  }

  // Max drawdown over the period (on monthly series)
  function maxDrawdownFor(years) {
    const sub = monthly.slice(-Math.round(years * 12 + 1));
    let peak = -Infinity;
    let maxDd = 0;
    for (const p of sub) {
      peak = Math.max(peak, p.nav);
      const dd = (p.nav - peak) / peak;
      if (dd < maxDd) maxDd = dd;
    }
    return +(maxDd * 100).toFixed(2);
  }

  // Recovery time in months: from the trough of the max drawdown back to its peak.
  function recoveryFor(years) {
    const sub = monthly.slice(-Math.round(years * 12 + 1));
    let peak = -Infinity;
    let peakIdx = 0;
    let maxDd = 0;
    let troughIdx = 0;
    sub.forEach((p, i) => {
      if (p.nav > peak) {
        peak = p.nav;
        peakIdx = i;
      }
      const dd = (p.nav - peak) / peak;
      if (dd < maxDd) {
        maxDd = dd;
        troughIdx = i;
      }
    });
    // Find recovery: first index after trough where nav ≥ peak
    for (let i = troughIdx + 1; i < sub.length; i++) {
      if (sub[i].nav >= sub[peakIdx].nav) return i - troughIdx;
    }
    return null; // not yet recovered
  }

  // Sharpe (annualized) for the period
  function sharpeFor(years, periodCagrPct) {
    const v = volFor(years);
    if (!v) return null;
    return +(((periodCagrPct - RISK_FREE * 100) / v)).toFixed(2);
  }

  // Monthly heatmap — last 12 months as percentages, with real month labels.
  // mret[k] is the return that took us from monthly[k] to monthly[k+1] → label by monthly[k+1].
  const lastIdx = monthly.length - 1;
  const last12 = mret.slice(-12).map((r, i) => {
    const idxInMonthly = lastIdx - (12 - 1 - i); // align: oldest of the 12 → newest
    const d = monthly[idxInMonthly]?.date ?? endDate;
    return { i, ret: +(r * 100).toFixed(2), date: d };
  });

  // NAV growth series rebased to ₹100 at period start (returns by period)
  function navSeriesFor(years) {
    const target = new Date(endDate);
    target.setUTCFullYear(target.getUTCFullYear() - years);
    const startIdx = monthly.findIndex((p) => p.date >= target);
    const start = startIdx >= 0 ? startIdx : 0;
    const baseNav = monthly[start].nav;
    return monthly.slice(start).map((p, i) => ({
      m: i,
      date: p.date,
      sharia: +((p.nav / baseNav) * 100).toFixed(2),
    }));
  }

  // Drawdown series for the period
  function drawdownSeriesFor(years) {
    const target = new Date(endDate);
    target.setUTCFullYear(target.getUTCFullYear() - years);
    const startIdx = monthly.findIndex((p) => p.date >= target);
    const start = startIdx >= 0 ? startIdx : 0;
    const sub = monthly.slice(start);
    let peak = -Infinity;
    return sub.map((p, i) => {
      peak = Math.max(peak, p.nav);
      return { m: i, date: p.date, dd: +(((p.nav - peak) / peak) * 100).toFixed(2) };
    });
  }

  // Rolling returns: for a given period, compute multiple rolling windows ≤ period
  function rollingFor(years) {
    const windows = [1, 2, 3, 5, 7].filter((w) => w <= years);
    return windows.map((w) => {
      const stepMonths = Math.round(w * 12);
      const rets = [];
      for (let i = 0; i + stepMonths < monthly.length; i++) {
        const s = monthly[i].nav;
        const e = monthly[i + stepMonths].nav;
        rets.push((Math.pow(e / s, 1 / w) - 1) * 100);
      }
      if (!rets.length) return { window: w, avg: null, min: null, max: null };
      const avg = rets.reduce((a, x) => a + x, 0) / rets.length;
      return {
        window: w,
        avg: +avg.toFixed(1),
        min: +Math.min(...rets).toFixed(1),
        max: +Math.max(...rets).toFixed(1),
      };
    });
  }

  return {
    end,
    cagrByYears,
    navByYears,
    monthlyCount: mret.length,
    seriesStart: series[0].date,
    seriesEnd: endDate,
    perPeriod: (years) => {
      const cagrPct = cagrByYears[years];
      if (cagrPct == null) return null;
      return {
        cagr: cagrPct,
        vol: volFor(years),
        sharpe: sharpeFor(years, cagrPct),
        winRate: winRateFor(years),
        maxDd: maxDrawdownFor(years),
        recovery: recoveryFor(years),
        nav: navSeriesFor(years),
        drawdown: drawdownSeriesFor(years),
        rolling: rollingFor(years),
      };
    },
    last12,
  };
}
