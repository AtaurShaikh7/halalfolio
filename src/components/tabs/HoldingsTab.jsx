import { Badge } from '../ui/Badge';
import { InfoButton } from '../ui/InfoButton';
import { fmtDate } from '../../lib/format';

function WeightBar({ value, max, color }) {
  if (!value) return <span className="text-text3 text-[12px]">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border2 overflow-hidden min-w-[40px]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
        />
      </div>
      <span className="tabular-nums text-[12px] font-semibold text-text w-10 text-right">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function HoldingsSourceBadge({ source, asOf }) {
  if (source === 'amfi') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider"
        style={{
          color: 'var(--green)',
          background: 'rgba(46,204,113,0.12)',
          border: '1px solid rgba(46,204,113,0.35)',
        }}
        title={asOf ? `Portfolio disclosure as of ${asOf}` : ''}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}
        />
        Live · AMFI
        {asOf && (
          <span className="font-normal normal-case text-text2 -ml-0.5">
            · as of {fmtDate(asOf)}
          </span>
        )}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider"
      style={{
        color: 'var(--orange)',
        background: 'rgba(243,156,18,0.10)',
        border: '1px solid rgba(243,156,18,0.35)',
      }}
      title="No portfolio file ingested for this scheme yet. Run: node scripts/fetch_holdings.mjs --file <xlsx> --code <schemeCode>"
    >
      Sample · not yet ingested
    </span>
  );
}

export function HoldingsTab({ r }) {
  const max = Math.max(...r.secs.map((s) => Math.max(s.w, s.aw)));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12.5px] text-text2">
          <span className="font-playfair text-[15px] font-semibold text-text">Portfolio</span>
          <HoldingsSourceBadge source={r.holdingsSource} asOf={r.holdingsAsOf} />
        </div>
        <div className="text-[11.5px] text-text2 tabular-nums">
          <span className="text-up font-semibold">{r.halalW.toFixed(1)}%</span> halal ·{' '}
          <span className="text-down font-semibold">{r.haramW.toFixed(1)}%</span> removed
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-text2" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Holding</th>
                <th className="px-4 py-3 font-semibold">Sector</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1">Original <InfoButton tooltipKey="origw" /></div>
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1">Adjusted <InfoButton tooltipKey="adjw" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {r.secs.map((s, i) => (
                <tr
                  key={`${s.n}-${i}`}
                  className={`border-b transition-colors hover:bg-card2 ${s.h ? '' : 'opacity-50'}`}
                  style={{ borderColor: 'var(--border2)' }}
                >
                  <td className="px-4 py-2.5 text-text3 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-text">{s.n}</td>
                  <td className="px-4 py-2.5 text-text2">{s.s}</td>
                  <td className="px-4 py-2.5">
                    <Badge kind={s.h ? 'halal' : 'haram'}>{s.h ? 'Halal' : 'Removed'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 w-[160px]">
                    <WeightBar value={s.w} max={max} color="var(--blue)" />
                  </td>
                  <td className="px-4 py-2.5 w-[160px]">
                    <WeightBar value={s.aw} max={max} color="var(--green)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
