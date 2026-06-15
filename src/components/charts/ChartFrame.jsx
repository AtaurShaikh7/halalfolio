import { InfoButton } from '../ui/InfoButton';

export function ChartFrame({ title, tooltipKey, right, children, height = 220 }) {
  return (
    <div className="rounded-xl border bg-card p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="font-playfair text-[15px] font-semibold text-text">{title}</h3>
        {tooltipKey && <InfoButton tooltipKey={tooltipKey} />}
        <div className="ml-auto">{right}</div>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
