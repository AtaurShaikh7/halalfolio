import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const MAP = {
  invest: {
    icon: CheckCircle2,
    color: 'var(--green)',
    bg: 'rgba(46,204,113,0.08)',
    title: 'Recommended — Sharia-compliant version is investable',
    body: 'The Sharia-screened portfolio retains most of the fund\'s return while passing all key compliance filters.',
  },
  caution: {
    icon: AlertTriangle,
    color: 'var(--orange)',
    bg: 'rgba(243,156,18,0.08)',
    title: 'Caution — Material return drag after screening',
    body: 'A meaningful slice of holdings is removed. Review sector concentration and tracking error before investing.',
  },
  avoid: {
    icon: XCircle,
    color: 'var(--red)',
    bg: 'rgba(231,76,60,0.08)',
    title: 'Avoid — Heavy Sharia drag on this fund',
    body: 'Compliance trims a large share of holdings, eroding alpha. Consider funds with more Sharia-friendly portfolios.',
  },
};

export function Verdict({ verdict, delta }) {
  const v = MAP[verdict];
  const Icon = v.icon;
  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3"
      style={{ borderColor: v.color, background: v.bg }}
    >
      <Icon size={22} style={{ color: v.color }} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-playfair font-semibold text-[15px]" style={{ color: v.color }}>
          {v.title}
        </div>
        <div className="text-[13px] text-text2 mt-0.5">{v.body}</div>
      </div>
      <div className="text-right">
        <div className="text-[11px] uppercase tracking-wider text-text2">Δ Return</div>
        <div className="font-playfair font-bold text-lg tabular-nums" style={{ color: v.color }}>
          {delta > 0 ? '+' : ''}
          {delta}%
        </div>
      </div>
    </div>
  );
}
