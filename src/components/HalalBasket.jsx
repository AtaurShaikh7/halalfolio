import { useEffect, useMemo, useState } from 'react';
import { ShoppingBasket, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { fmtINR } from '../lib/format';
import { resolveSymbol } from '../services/symbolResolver';
import { fetchPrices } from '../services/stockPrice';

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
          : { ...s, kind: 'stock', symbolRoot: sym.symbolRoot };
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

  const rows = useMemo(() => {
    const amt = Math.max(0, +amount || 0);
    return halal.map((s) => {
      const alloc = +(amt * (s.aw / 100)).toFixed(0);
      if (s.kind !== 'stock') return { ...s, alloc, quantity: 0, price: null, estCost: 0 };
      const price = prices[s.symbolRoot];
      const quantity = price ? Math.floor(alloc / price) : 0;
      const estCost = price ? +(quantity * price).toFixed(0) : 0;
      const minAmountToInclude = price ? Math.ceil((price / (s.aw / 100)) * 1.0) : null;
      return { ...s, alloc, price: price ?? null, quantity, estCost, minAmountToInclude };
    });
  }, [halal, prices, amount]);

  const placeable = rows.filter((x) => x.quantity > 0);
  const skipped = rows.filter((x) => x.quantity === 0);
  const investedValue = placeable.reduce((a, x) => a + x.estCost, 0);
  const placeableWeight = placeable.reduce((a, x) => a + x.aw, 0);
  const skippedWeight = skipped.reduce((a, x) => a + x.aw, 0);

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
            Own the screened portfolio directly — quantities sized at live NSE prices.
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
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Qty</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Est. cost</th>
                <th className="px-4 py-3 font-semibold text-right">Buy</th>
              </tr>
            </thead>
            <tbody>
              {placeable.map((x, i) => (
                <tr
                  key={`${x.n}-${i}`}
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
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-text">{x.quantity}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!!skipped.length && (
        <details className="mt-3 rounded-lg border bg-card2 px-3 py-2 text-[12px]" style={{ borderColor: 'var(--border)' }}>
          <summary className="cursor-pointer text-text2 select-none">
            <span className="font-semibold text-text">{skipped.length}</span> stock{skipped.length === 1 ? '' : 's'}{' '}
            won't fit at <span className="tabular-nums">{fmtINR(amount)}</span>
            {' '}<span className="text-text3">— combined weight {skippedWeight.toFixed(1)}%</span>
          </summary>
          <div className="mt-2 space-y-1">
            {skipped
              .sort((a, b) => b.aw - a.aw)
              .map((x, i) => (
                <div key={`${x.n}-${i}`} className="flex flex-wrap items-center gap-2 text-text2">
                  <span className="font-medium text-text">{x.n}</span>
                  <span className="tabular-nums text-text3">{x.aw.toFixed(2)}%</span>
                  {x.kind === 'stock' && x.price && x.minAmountToInclude ? (
                    <span className="text-text3">
                      · price ₹{x.price.toFixed(1)} · needs ≥{' '}
                      <span className="text-text">{fmtINR(x.minAmountToInclude)}</span> to fit 1 share
                    </span>
                  ) : (
                    <span className="text-text3">· {x.reason}</span>
                  )}
                </div>
              ))}
          </div>
        </details>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text2">
        <div>
          <span className="font-semibold text-text tabular-nums">{placeable.length}</span> stocks ·
          covers <span className="font-semibold text-text tabular-nums">{placeableWeight.toFixed(1)}%</span>{' '}
          adjusted weight · investing{' '}
          <span className="font-semibold text-text tabular-nums">{fmtINR(investedValue)}</span> · leftover{' '}
          <span className="tabular-nums text-text">{fmtINR(amount - investedValue)}</span>
        </div>
        <div className="text-text3">
          Prices via Yahoo · cached 1h · executed price may differ (MARKET orders).
        </div>
      </div>
    </div>
  );
}
