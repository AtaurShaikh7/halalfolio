import { useMemo, useState } from 'react';
import { ShoppingBasket, ExternalLink, Copy, Check } from 'lucide-react';
import { fmtINR } from '../lib/format';

const PRESETS = [25000, 50000, 100000, 500000];

// Groww has no public per-stock slug we can derive reliably, but its search
// route resolves a company name straight to the stock page. Strip corporate
// suffixes / footnote markers so the query is clean.
function growwSearchUrl(name) {
  const q = String(name)
    .replace(/\b(ltd|limited|the)\b/gi, '')
    .replace(/[^a-zA-Z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://groww.in/search?q=${encodeURIComponent(q)}`;
}

// Holdings the basket can't route to an individual stock (e.g. ICICI's
// aggregated "sub-1% holdings" bucket).
function isActionable(name) {
  return !/sub-1%|aggregated|other equity/i.test(name);
}

export function HalalBasket({ r }) {
  const [amount, setAmount] = useState(100000);
  const [copied, setCopied] = useState(false);

  // Halal holdings carry an adjusted weight (aw) re-normalised to 100% after
  // the haram names are dropped — that's the "Sharia version" allocation.
  const halal = useMemo(
    () => r.secs.filter((s) => s.h && s.aw > 0).sort((a, b) => b.aw - a.aw),
    [r.secs]
  );

  const rows = useMemo(() => {
    const amt = Math.max(0, +amount || 0);
    return halal.map((s) => ({
      ...s,
      alloc: +(amt * (s.aw / 100)).toFixed(0),
      actionable: isActionable(s.n),
    }));
  }, [halal, amount]);

  if (!halal.length) return null;

  const totalWeight = halal.reduce((a, s) => a + s.aw, 0);
  const totalAlloc = rows.reduce((a, x) => a + x.alloc, 0);

  function copyBasket() {
    const lines = [
      'Stock,Sector,Adjusted Weight %,Allocation (INR)',
      ...rows.map((x) => `"${x.n}","${x.s}",${x.aw},${x.alloc}`),
    ];
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <ShoppingBasket size={16} className="text-gold" />
            <h3 className="font-playfair text-[17px] font-semibold leading-tight">Halal Basket</h3>
          </div>
          <div className="text-[12.5px] text-text2 mt-0.5">
            Own the screened portfolio directly — buy these {rows.length} halal stocks at the
            adjusted weights. Removed holdings' weight is redistributed here.
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
          className="ml-auto inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11.5px] font-semibold text-text2 hover:text-text transition-colors"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
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
                <th className="px-4 py-3 font-semibold">Sector</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Weight</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Allocation</th>
                <th className="px-4 py-3 font-semibold text-right">Buy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, i) => (
                <tr
                  key={`${x.n}-${i}`}
                  className="border-b transition-colors hover:bg-card2"
                  style={{ borderColor: 'var(--border2)' }}
                >
                  <td className="px-4 py-2.5 text-text3 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-text">{x.n}</td>
                  <td className="px-4 py-2.5 text-text2">{x.s}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text">{x.aw.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-text">
                    {fmtINR(x.alloc)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {x.actionable ? (
                      <a
                        href={growwSearchUrl(x.n)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold transition-colors"
                        style={{ color: 'var(--green)', background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.30)' }}
                      >
                        Groww <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-text3">spread across small caps</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-text2">
        <div>
          <span className="font-semibold text-text tabular-nums">{rows.length}</span> halal stocks ·
          covers <span className="font-semibold text-text tabular-nums">{totalWeight.toFixed(1)}%</span>{' '}
          adjusted weight · allocating{' '}
          <span className="font-semibold text-text tabular-nums">{fmtINR(totalAlloc)}</span>
        </div>
        <div className="text-text3">
          ₹ allocations only — share quantity depends on live price at order time.
        </div>
      </div>
    </div>
  );
}
