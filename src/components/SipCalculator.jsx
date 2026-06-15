import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { fmtINR, fmtINRCompact } from '../lib/format';
import { InfoButton } from './ui/InfoButton';

// Walk the rebased NAV series, buying `sip` worth of units at the start of each
// month and measuring the portfolio value at the latest month.
function sipOnSeries(series, key, sip) {
  if (!series?.length) return { invested: 0, value: 0 };
  let units = 0;
  for (let i = 0; i < series.length - 1; i++) {
    const lvl = series[i][key];
    if (lvl > 0) units += sip / lvl;
  }
  const lastLvl = series[series.length - 1][key];
  const invested = sip * (series.length - 1);
  const value = units * lastLvl;
  return { invested, value };
}

const PRESETS = [1000, 5000, 10000, 25000];

export function SipCalculator({ r }) {
  const [amount, setAmount] = useState(5000);
  const live = r.source === 'live';

  const results = useMemo(() => {
    const sip = Math.max(0, +amount || 0);
    if (!sip) return null;
    return {
      sharia: sipOnSeries(r.nav, 'sharia', sip),
      original: sipOnSeries(r.nav, 'original', sip),
      nifty: sipOnSeries(r.nav, 'nifty', sip),
    };
  }, [amount, r.nav]);

  if (!results) return null;
  const invested = results.sharia.invested;
  const cards = [
    {
      key: 'sharia',
      label: 'Sharia Portfolio',
      sub: 'After screening',
      color: 'var(--green)',
      bg: 'rgba(46,204,113,0.10)',
      v: results.sharia.value,
    },
    {
      key: 'original',
      label: 'Original Fund',
      sub: 'Unscreened',
      color: 'var(--blue)',
      bg: 'rgba(91,141,239,0.10)',
      v: results.original.value,
    },
    {
      key: 'nifty',
      label: 'Nifty 50 ETF',
      sub: 'Index benchmark',
      color: 'var(--gold)',
      bg: 'var(--gold-dim)',
      v: results.nifty.value,
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={16} className="text-gold" />
            <h3 className="font-playfair text-[17px] font-semibold leading-tight">
              SIP Projection
            </h3>
            <InfoButton tooltipKey="navg" />
            {live && (
              <span
                className="ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[9px] font-bold tracking-wider"
                style={{
                  color: 'var(--green)',
                  background: 'rgba(46,204,113,0.12)',
                  border: '1px solid rgba(46,204,113,0.32)',
                }}
                title="Each month's units are bought at the actual historical NAV."
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: 'var(--green)', boxShadow: '0 0 5px var(--green)' }}
                />
                LIVE
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-text2 mt-0.5">
            If you'd invested every month for the last {r.period} years.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-text2">
            Monthly SIP
          </label>
          <div
            className="flex items-center rounded-lg border bg-card2 px-2.5 h-10"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-text2 mr-1">₹</span>
            <input
              type="number"
              inputMode="numeric"
              min={500}
              step={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 bg-transparent text-right text-[14px] font-semibold tabular-nums outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRESETS.map((p) => {
          const active = +amount === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors ${
                active ? 'text-[#1a1610]' : 'text-text2 hover:text-text'
              }`}
              style={
                active
                  ? { background: 'linear-gradient(135deg, var(--gold2), var(--gold))' }
                  : { background: 'var(--card2)', border: '1px solid var(--border)' }
              }
            >
              ₹{p.toLocaleString('en-IN')}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const gain = c.v - invested;
          const mult = invested > 0 ? c.v / invested : 0;
          return (
            <div
              key={c.key}
              className="relative rounded-xl border p-3.5 overflow-hidden"
              style={{ borderColor: c.color, background: c.bg }}
            >
              <span
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: c.color }}
              />
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: c.color }}>
                    {c.label}
                  </div>
                  <div className="text-[11px] text-text2">{c.sub}</div>
                </div>
                <div className="text-[11px] tabular-nums" style={{ color: c.color }}>
                  ×{mult.toFixed(2)}
                </div>
              </div>
              <div
                className="mt-2 font-playfair font-bold text-[24px] leading-none tabular-nums"
                style={{ color: c.color }}
              >
                {fmtINRCompact(c.v)}
              </div>
              <div className="mt-1.5 text-[11.5px] text-text2 tabular-nums">
                Gain{' '}
                <span className="font-semibold" style={{ color: c.color }}>
                  {fmtINR(gain)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text2">
        <div>
          You'd invest <span className="font-semibold text-text tabular-nums">{fmtINR(invested)}</span> over{' '}
          <span className="font-semibold text-text tabular-nums">{r.nav.length - 1}</span> months.
        </div>
        <div>
          Δ Sharia vs Original:{' '}
          <span
            className="font-semibold tabular-nums"
            style={{ color: results.sharia.value >= results.original.value ? 'var(--green)' : 'var(--red)' }}
          >
            {results.sharia.value >= results.original.value ? '+' : ''}
            {fmtINR(results.sharia.value - results.original.value)}
          </span>
        </div>
      </div>
    </div>
  );
}
