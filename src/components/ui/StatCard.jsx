import { InfoButton } from './InfoButton';

const COLORS = {
  blue: 'var(--blue)',
  green: 'var(--green)',
  red: 'var(--red)',
  gold: 'var(--gold)',
  purple: 'var(--purple)',
  orange: 'var(--orange)',
};

const VALUE_COLOR = {
  up: 'text-up',
  down: 'text-down',
  gold: 'text-gold',
  blue: 'text-blue',
  purple: 'text-purple',
  orange: 'text-orange',
  text: 'text-text',
};

export function StatCard({
  label,
  value,
  sub,
  color = 'gold',
  valueColor = 'text',
  tooltipKey,
  gauge,
  live = false,
}) {
  const stripe = COLORS[color];
  return (
    <div
      className="relative rounded-xl bg-card p-4 border shadow-card overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      <span
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: stripe }}
      />
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text2 font-medium">
        <span>{label}</span>
        {tooltipKey && <InfoButton tooltipKey={tooltipKey} />}
        {live && (
          <span
            title="Computed from real NAV history (mfapi.in)"
            className="ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[9px] font-bold tracking-wider"
            style={{
              color: 'var(--green)',
              background: 'rgba(46,204,113,0.12)',
              border: '1px solid rgba(46,204,113,0.32)',
            }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: 'var(--green)', boxShadow: '0 0 5px var(--green)' }}
            />
            LIVE
          </span>
        )}
      </div>
      <div className={`mt-1.5 font-playfair font-bold text-[28px] leading-none tabular-nums ${VALUE_COLOR[valueColor]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-text2">{sub}</div>}
      {typeof gauge === 'number' && (
        <div className="mt-3 h-1 rounded-full bg-border2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, gauge * 100))}%`, background: stripe }}
          />
        </div>
      )}
    </div>
  );
}
