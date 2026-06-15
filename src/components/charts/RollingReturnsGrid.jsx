export function RollingReturnsGrid({ rolling }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${rolling.length}, minmax(0,1fr))` }}
    >
      {rolling.map((r) => (
        <div
          key={r.window}
          className="rounded-lg border bg-card2 p-3 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] uppercase tracking-wider text-text2">{r.window}Y rolling</div>
          <div className="mt-1 font-playfair font-bold text-[20px] text-gold tabular-nums">
            {r.avg}%
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums">
            <span className="text-down">min {r.min}%</span>
            <span className="text-up">max {r.max}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
