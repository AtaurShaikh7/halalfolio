import { useAnalysisStore } from '../../store/useAnalysisStore';
import { FUNDS } from '../../data/funds';

const PERIODS = [1, 3, 5, 7, 10];

export function PeriodChips() {
  const { period, setPeriod, fundKey } = useAnalysisStore();
  const fund = fundKey ? FUNDS[fundKey] : null;

  return (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text2 font-semibold">
        Period
      </div>
      <div
        className="inline-flex rounded-lg border bg-card2 p-1"
        style={{ borderColor: 'var(--border)' }}
      >
        {PERIODS.map((p) => {
          const active = p === period;
          const unavailable = fund && fund.cagr[p] == null;
          return (
            <button
              key={p}
              type="button"
              onClick={() => !unavailable && setPeriod(p)}
              disabled={unavailable}
              title={unavailable ? `${fund.name} has insufficient history for ${p}Y` : undefined}
              className={`relative h-9 min-w-[52px] px-3 rounded-md text-[13px] font-semibold tabular-nums transition-all ${
                unavailable
                  ? 'opacity-30 cursor-not-allowed text-text3'
                  : active
                  ? 'text-[#1a1610]'
                  : 'text-text2 hover:text-text'
              }`}
              style={
                active && !unavailable
                  ? {
                      background: 'linear-gradient(135deg, var(--gold2), var(--gold))',
                      boxShadow: '0 6px 18px var(--gold-glow)',
                    }
                  : undefined
              }
            >
              {p}Y
            </button>
          );
        })}
      </div>
    </div>
  );
}
