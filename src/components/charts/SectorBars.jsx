const COLOR_GRADIENT = {
  gold: 'linear-gradient(90deg, var(--gold), var(--gold2))',
  blue: 'linear-gradient(90deg, var(--blue), #7ba8f5)',
  green: 'linear-gradient(90deg, var(--green), #55e695)',
};

export function SectorBars({ sectors, color = 'gold', maxVal }) {
  const max = maxVal ?? Math.max(...sectors.map((s) => s.value), 1);
  const gradient = COLOR_GRADIENT[color] || COLOR_GRADIENT.gold;
  return (
    <div className="space-y-2">
      {sectors.map((s) => (
        <div key={s.name} className="flex items-center gap-3 text-[12.5px]">
          <div className="w-28 truncate text-text2">{s.name}</div>
          <div className="flex-1 h-2.5 rounded-full bg-border2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(s.value / max) * 100}%`,
                background: gradient,
              }}
            />
          </div>
          <div className="w-12 text-right font-semibold tabular-nums text-text">
            {s.value.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}
