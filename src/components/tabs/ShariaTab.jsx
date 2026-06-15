import { InfoButton } from '../ui/InfoButton';
import { StatCard } from '../ui/StatCard';

function Ring({ score }) {
  const radius = 64;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--orange)' : 'var(--red)';
  return (
    <div className="relative inline-flex">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="var(--border2)" strokeWidth="10" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-playfair font-bold text-[34px] tabular-nums" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text2">Compliance</div>
      </div>
    </div>
  );
}

function Criterion({ label, value, pass, threshold, tt }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border bg-card2 px-3 py-2.5"
      style={{ borderColor: pass ? 'rgba(46,204,113,0.35)' : 'rgba(231,76,60,0.35)' }}
    >
      <div>
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
          {label}
          {tt && <InfoButton tooltipKey={tt} />}
        </div>
        <div className="text-[11px] text-text2">{threshold}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-playfair font-bold tabular-nums" style={{ color: pass ? 'var(--green)' : 'var(--red)' }}>
          {value}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            color: pass ? 'var(--green)' : 'var(--red)',
            background: pass ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)',
          }}
        >
          {pass ? 'Pass' : 'Fail'}
        </span>
      </div>
    </div>
  );
}

export function ShariaTab({ r }) {
  const debtPass = r.debt < 33;
  const intPass = r.intinc < 5;
  const haramPass = r.haramW < 33;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center" style={{ borderColor: 'var(--border)' }}>
          <Ring score={r.compScore} />
          <div className="mt-3 text-center text-[12px] text-text2 max-w-[200px]">
            Aggregate Sharia health from holdings, debt and income screens.
          </div>
        </div>
        <div className="lg:col-span-2 space-y-2.5">
          <Criterion label="Halal Equity Mix" value={`${r.halalW.toFixed(1)}%`} threshold="Min 67% compliant" pass={r.halalW > 67} tt="crit" />
          <Criterion label="Non-Halal Exposure" value={`${r.haramW.toFixed(1)}%`} threshold="Max 33% (AAOIFI)" pass={haramPass} tt="crit" />
          <Criterion label="Avg. Debt / Asset" value={`${r.debt}%`} threshold="Below 33%" pass={debtPass} tt="debt" />
          <Criterion label="Interest Income" value={`${r.intinc}%`} threshold="Below 5%" pass={intPass} tt="intinc" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatCard label="Purification" value={`${r.purif}%`} sub="of gains → charity" color="gold" valueColor="gold" tooltipKey="purif" />
        <StatCard label="Removed Holdings" value={r.removed} sub="non-compliant securities" color="red" valueColor="down" tooltipKey="crit" />
        <StatCard label="Sectors Retained" value={r.sectors.length} sub="post-screening" color="green" valueColor="up" tooltipKey="secalloc" />
      </div>
      <div
        className="rounded-xl border p-4 text-[13px]"
        style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gold">✺</span>
          <span className="font-semibold text-gold">Purification Reminder</span>
        </div>
        <p className="text-text2">
          A purification of <span className="font-semibold text-text">{r.purif}%</span> of your realised gains should
          be donated to charity to neutralise incidental non-compliant income.
        </p>
      </div>
    </div>
  );
}
