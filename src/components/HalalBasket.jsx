import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBasket,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { fmtINR } from '../lib/format';
import { resolveSymbol } from '../services/symbolResolver';
import { fetchPrices } from '../services/stockPrice';

const SECTOR_COLORS = [
  '#c9a84c', '#5b8def', '#2ecc71', '#9b59b6',
  '#f39c12', '#e74c3c', '#1abc9c', '#e91e63',
  '#00bcd4', '#ff9800', '#607d8b', '#8bc34a',
];

const PRESETS = [25000, 50000, 100000, 500000];

function growwSearchUrl(name) {
  const q = String(name)
    .replace(/\b(ltd|limited|the)\b/gi, '')
    .replace(/[^a-zA-Z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://groww.in/search?q=${encodeURIComponent(q)}`;
}

function isAggregateBucket(name) {
  return /sub-1%|aggregated|other equity/i.test(name);
}

export function HalalBasket({ r }) {
  const [amount, setAmount] = useState(100000);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  // User overrides on top of the auto-computed quantities. Keyed by symbolRoot.
  // Cleared whenever the auto baseline shifts (new fund, new amount, new prices).
  const [quantities, setQuantities] = useState({});

  // Halal holdings re-weighted to 100%, with a resolved NSE symbol where we have one.
  const halal = useMemo(() => {
    return r.secs
      .filter((s) => s.h && s.aw > 0)
      .map((s) => {
        if (isAggregateBucket(s.n)) {
          return { ...s, kind: 'bucket', reason: 'aggregated holdings — not actionable' };
        }
        const sym = resolveSymbol(s.n);
        return sym.unresolved
          ? { ...s, kind: 'unresolved', reason: sym.reason }
          : { ...s, kind: 'stock', symbolRoot: sym.symbolRoot, sec: s.s || 'Other' };
      })
      .sort((a, b) => b.aw - a.aw);
  }, [r.secs]);

  // Fetch prices whenever the resolvable symbol set changes (i.e. on a new fund).
  useEffect(() => {
    let active = true;
    const roots = halal.filter((h) => h.kind === 'stock').map((h) => h.symbolRoot);
    if (!roots.length) {
      setPrices({});
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPrices(roots).then((p) => {
      if (active) {
        setPrices(p);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [halal]);

  // Auto-quantities — derived purely from inputs (amount, weight, price). Whenever
  // these change, the user's manual edits should reset to keep the basket sane.
  const autoQuantities = useMemo(() => {
    const amt = Math.max(0, +amount || 0);
    const map = {};
    for (const s of halal) {
      if (s.kind !== 'stock') continue;
      const price = prices[s.symbolRoot];
      if (!price) continue;
      const alloc = amt * (s.aw / 100);
      map[s.symbolRoot] = Math.floor(alloc / price);
    }
    return map;
  }, [halal, prices, amount]);

  // Reset user overrides whenever the auto baseline shifts.
  useEffect(() => {
    setQuantities({});
  }, [autoQuantities]);

  const rows = useMemo(() => {
    const amt = Math.max(0, +amount || 0);
    return halal.map((s) => {
      const alloc = +(amt * (s.aw / 100)).toFixed(0);
      if (s.kind !== 'stock') {
        return { ...s, alloc, quantity: 0, price: null, estCost: 0 };
      }
      const price = prices[s.symbolRoot] ?? null;
      const qty = quantities[s.symbolRoot] ?? autoQuantities[s.symbolRoot] ?? 0;
      const estCost = price ? +(qty * price).toFixed(0) : 0;
      const minAmountToInclude = price ? Math.ceil(price / (s.aw / 100)) : null;
      return { ...s, alloc, price, quantity: qty, estCost, minAmountToInclude };
    });
  }, [halal, prices, amount, quantities, autoQuantities]);

  const placeable = rows.filter((x) => x.quantity > 0);
  const skipped = rows.filter((x) => x.quantity === 0);
  const investedValue = placeable.reduce((a, x) => a + x.estCost, 0);
  const placeableWeight = placeable.reduce((a, x) => a + x.aw, 0);
  const skippedWeight = skipped.reduce((a, x) => a + x.aw, 0);
  const leftover = Math.max(0, (+amount || 0) - investedValue);
  const hasManualEdits = Object.keys(quantities).length > 0;

  const sectorData = useMemo(() => {
    if (!placeable.length || investedValue === 0) return [];
    const map = {};
    for (const x of placeable) {
      const sector = x.sec || 'Other';
      if (!map[sector]) map[sector] = 0;
      map[sector] += x.estCost;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: +((value / investedValue) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);
  }, [placeable, investedValue]);

  const resolvedCount = halal.filter((h) => h.kind === 'stock').length;
  const pricedCount = halal.filter((h) => h.kind === 'stock' && prices[h.symbolRoot] != null).length;
  const priceServiceDown = !loading && resolvedCount > 0 && pricedCount === 0;

  function setQty(symbolRoot, next) {
    setQuantities((prev) => ({ ...prev, [symbolRoot]: Math.max(0, Math.floor(next)) }));
  }
  function bump(symbolRoot, currentQty, delta) {
    setQty(symbolRoot, currentQty + delta);
  }
  function resetToAuto() {
    setQuantities({});
  }

  function copyBasket() {
    const lines = [
      'Symbol,Action,Quantity,LimitPrice',
      ...placeable.map((x) => `${x.symbolRoot},BUY,${x.quantity},`),
    ];
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  if (!halal.length) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <ShoppingBasket size={16} className="text-gold" />
            <h3 className="font-playfair text-[17px] font-semibold leading-tight">Halal Basket</h3>
            {loading && <Loader2 size={13} className="text-text2 animate-spin" />}
          </div>
          <div className="text-[12.5px] text-text2 mt-0.5">
            Cart-style: tweak any quantity with + / −, or add a "won't fit" stock using leftover cash.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-text2">Amount</label>
          <div
            className="flex items-center rounded-lg border bg-card2 px-2.5 h-10"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-text2 mr-1">₹</span>
            <input
              type="number"
              inputMode="numeric"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 bg-transparent text-right text-[14px] font-semibold tabular-nums outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {PRESETS.map((p) => {
          const active = +amount === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`h-7 rounded-full px-3 text-[11.5px] font-semibold tabular-nums transition-colors ${
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
        {hasManualEdits && (
          <button
            type="button"
            onClick={resetToAuto}
            className="inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11.5px] font-semibold text-text2 hover:text-text transition-colors"
            style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
            title="Reset every quantity to the auto-computed allocation."
          >
            <RotateCcw size={12} />
            Reset to auto
          </button>
        )}
        <button
          type="button"
          onClick={copyBasket}
          disabled={!placeable.length}
          className="ml-auto inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11.5px] font-semibold text-text2 hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
          title="CSV with Symbol,Action,Quantity columns — Starfolio-compatible core fields."
        >
          {copied ? <Check size={13} className="text-up" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy basket (CSV)'}
        </button>
      </div>

      {priceServiceDown && (
        <div
          className="mb-3 rounded-lg border px-3 py-2 text-[12.5px]"
          style={{
            borderColor: 'var(--orange)',
            background: 'rgba(243,156,18,0.08)',
            color: 'var(--orange)',
          }}
        >
          ⚠ Live prices unavailable right now (price source unreachable from this network).
          Quantities can't be computed. Try refreshing in a minute, or use the local{' '}
          <code className="font-mono">order/build-basket.mjs</code> which fetches prices server-side.
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="border-b text-left text-[11px] uppercase tracking-wider text-text2"
                style={{ borderColor: 'var(--border)' }}
              >
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Symbol</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Weight</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Price</th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Qty</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Est. cost</th>
                <th className="px-4 py-3 font-semibold text-right">Buy</th>
              </tr>
            </thead>
            <tbody>
              {placeable.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text2 text-[12.5px]">
                    Basket is empty. Add stocks from "won't fit" below, or raise the amount.
                  </td>
                </tr>
              )}
              {placeable.map((x, i) => {
                const canAddOne = !!x.price && leftover >= x.price;
                return (
                  <tr
                    key={x.symbolRoot ?? `${x.n}-${i}`}
                    className="border-b transition-colors hover:bg-card2"
                    style={{ borderColor: 'var(--border2)' }}
                  >
                    <td className="px-4 py-2.5 text-text3 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-text">{x.n}</td>
                    <td className="px-4 py-2.5 text-text2 tabular-nums">{x.symbolRoot}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text">{x.aw.toFixed(2)}%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text2">
                      {x.price ? `₹${x.price.toFixed(1)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => bump(x.symbolRoot, x.quantity, -1)}
                          className="grid h-6 w-6 place-items-center rounded-md text-text2 hover:text-text hover:bg-card2 transition-colors"
                          style={{ border: '1px solid var(--border)' }}
                          aria-label={`decrease ${x.symbolRoot} quantity`}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={x.quantity}
                          onChange={(e) => setQty(x.symbolRoot, +e.target.value || 0)}
                          className="w-12 bg-transparent text-center text-[13px] font-semibold tabular-nums outline-none"
                          style={{ border: '1px solid transparent' }}
                        />
                        <button
                          type="button"
                          onClick={() => bump(x.symbolRoot, x.quantity, +1)}
                          disabled={!canAddOne}
                          className="grid h-6 w-6 place-items-center rounded-md text-text2 hover:text-text hover:bg-card2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ border: '1px solid var(--border)' }}
                          title={canAddOne ? '' : `Not enough leftover (need ₹${x.price?.toFixed(0)})`}
                          aria-label={`increase ${x.symbolRoot} quantity`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-text">
                      {fmtINR(x.estCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={growwSearchUrl(x.n)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold transition-colors"
                        style={{
                          color: 'var(--green)',
                          background: 'rgba(46,204,113,0.12)',
                          border: '1px solid rgba(46,204,113,0.30)',
                        }}
                      >
                        Groww <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sectorData.length > 0 && (
        <div className="mt-4 rounded-xl border bg-card2 p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-text2">
            Sector Allocation · live
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={SECTOR_COLORS[idx % SECTOR_COLORS.length]}
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(val, _name, entry) => [
                    `${fmtINR(val)} (${entry.payload.pct}%)`,
                    entry.payload.name,
                  ]}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--text)',
                  }}
                  itemStyle={{ color: 'var(--text)' }}
                  labelStyle={{ display: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center gap-1.5">
              {sectorData.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-2 text-[12.5px]">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                    style={{ background: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                  />
                  <span className="flex-1 text-text truncate">{s.name}</span>
                  <span className="tabular-nums text-text2">{fmtINR(s.value)}</span>
                  <span
                    className="w-10 text-right tabular-nums font-semibold"
                    style={{ color: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                  >
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!!skipped.length && (
        <details className="mt-3 rounded-lg border bg-card2 px-3 py-2 text-[12px]" style={{ borderColor: 'var(--border)' }}>
          <summary className="cursor-pointer text-text2 select-none">
            <span className="font-semibold text-text">{skipped.length}</span> stock{skipped.length === 1 ? '' : 's'}{' '}
            won't fit at the auto allocation
            {' '}<span className="text-text3">— combined weight {skippedWeight.toFixed(1)}%</span>
          </summary>
          <div className="mt-2 space-y-1.5">
            {skipped
              .sort((a, b) => b.aw - a.aw)
              .map((x, i) => {
                const addable = x.kind === 'stock' && x.price && leftover >= x.price;
                return (
                  <div
                    key={x.symbolRoot ?? `${x.n}-${i}`}
                    className="flex flex-wrap items-center gap-2 text-text2"
                  >
                    <span className="font-medium text-text">{x.n}</span>
                    <span className="tabular-nums text-text3">{x.aw.toFixed(2)}%</span>
                    {x.kind === 'stock' && x.price ? (
                      <>
                        <span className="text-text3">
                          · price <span className="tabular-nums text-text2">₹{x.price.toFixed(1)}</span>
                          {x.minAmountToInclude && (
                            <>
                              {' '}· needs ≥{' '}
                              <span className="tabular-nums text-text">{fmtINR(x.minAmountToInclude)}</span>{' '}
                              for auto-fit
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(x.symbolRoot, 0, +1)}
                          disabled={!addable}
                          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            color: 'var(--green)',
                            background: 'rgba(46,204,113,0.10)',
                            border: '1px solid rgba(46,204,113,0.30)',
                          }}
                          title={
                            addable
                              ? `Use leftover to buy 1 share — costs ₹${x.price.toFixed(0)}`
                              : `Not enough leftover (need ₹${x.price?.toFixed(0)}, have ₹${leftover.toFixed(0)})`
                          }
                        >
                          <Plus size={11} /> Add 1
                        </button>
                      </>
                    ) : (
                      <span className="text-text3">· {x.reason}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </details>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text2">
        <div>
          <span className="font-semibold text-text tabular-nums">{placeable.length}</span> stocks ·
          covers <span className="font-semibold text-text tabular-nums">{placeableWeight.toFixed(1)}%</span>{' '}
          adjusted weight · investing{' '}
          <span className="font-semibold text-text tabular-nums">{fmtINR(investedValue)}</span> · leftover{' '}
          <span
            className="tabular-nums"
            style={{ color: leftover > 0 ? 'var(--gold)' : 'var(--text)' }}
          >
            {fmtINR(leftover)}
          </span>
          {hasManualEdits && (
            <span className="ml-1.5 text-text3">· edited</span>
          )}
        </div>
        <div className="text-text3">
          Prices via Yahoo · cached 1h · executed price may differ (MARKET orders).
        </div>
      </div>
    </div>
  );
}
