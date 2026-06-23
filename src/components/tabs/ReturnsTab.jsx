import { StatCard } from '../ui/StatCard';
import { ChartFrame } from '../charts/ChartFrame';
import { NavGrowthChart } from '../charts/NavGrowthChart';

export function ReturnsTab({ r }) {
  const live = r.source === 'live';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard live={live} label="Original CAGR" value={`${r.origC}%`} sub={`${r.period}Y · pre-screening`} color="blue" valueColor="blue" tooltipKey="cagr" gauge={Math.min(r.origC / 35, 1)} />
        <StatCard live={live} label="Sharia CAGR" value={`${r.sharC}%`} sub={`${r.period}Y · post-screening`} color="green" valueColor="up" tooltipKey="scagr" gauge={Math.min(r.sharC / 35, 1)} />
        <StatCard live={live} label="Return Δ" value={`${r.delta > 0 ? '+' : ''}${r.delta}%`} sub="cost of compliance" color={r.delta > -2 ? 'green' : r.delta > -4 ? 'orange' : 'red'} valueColor={r.delta >= 0 ? 'up' : 'down'} tooltipKey="delta" />
        <StatCard live={live} label="Absolute Return" value={`${r.absR}%`} sub={`over ${r.period}Y`} color="gold" valueColor="gold" tooltipKey="abs" />
      </div>
      <ChartFrame title="NAV Growth (₹100 invested)" tooltipKey="navg" height={240}>
        <NavGrowthChart data={r.nav} />
      </ChartFrame>
    </div>
  );
}
