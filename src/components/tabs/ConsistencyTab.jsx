import { StatCard } from '../ui/StatCard';
import { ChartFrame } from '../charts/ChartFrame';
import { RollingReturnsGrid } from '../charts/RollingReturnsGrid';
import { MonthlyHeatmap } from '../charts/MonthlyHeatmap';

export function ConsistencyTab({ r }) {
  const live = r.source === 'live';
  // Pick the longest rolling window we have — usually the most informative annualized stat.
  const longest = r.rolling?.length ? r.rolling[r.rolling.length - 1] : null;
  const bestVal = live && longest ? longest.max : r.sharC + 12;
  const worstVal = live && longest ? longest.min : r.sharC - 14;
  const avgVal = live && longest ? longest.avg : r.sharC;
  const winLabel = live ? '% positive months' : 'vs benchmark';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard live={live} label="Win Rate" value={`${r.win}%`} sub={winLabel} color="green" valueColor="up" tooltipKey="winrate" gauge={r.win / 100} />
        <StatCard live={live} label="Best Period" value={`+${bestVal.toFixed(1)}%`} sub={longest ? `${longest.window}Y rolling max` : 'rolling annual'} color="gold" valueColor="up" tooltipKey="rolling" />
        <StatCard live={live} label="Worst Period" value={`${worstVal.toFixed(1)}%`} sub={longest ? `${longest.window}Y rolling min` : 'rolling annual'} color="red" valueColor="down" tooltipKey="rolling" />
        <StatCard live={live} label="Avg. Rolling" value={`${avgVal.toFixed(1)}%`} sub={longest ? `${longest.window}Y avg` : `${r.period}Y avg`} color="blue" valueColor="blue" tooltipKey="rolling" />
      </div>
      <ChartFrame title="Rolling Returns" tooltipKey="rolling" height={120}>
        <RollingReturnsGrid rolling={r.rolling} />
      </ChartFrame>
      <ChartFrame title="Monthly Returns Heatmap (last 12 months)" tooltipKey="heat" height={140}>
        <MonthlyHeatmap heat={r.heat} />
      </ChartFrame>
    </div>
  );
}
