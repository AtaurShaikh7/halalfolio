import { StatCard } from '../ui/StatCard';
import { ChartFrame } from '../charts/ChartFrame';
import { DrawdownChart } from '../charts/DrawdownChart';
import { RiskReturnScatter } from '../charts/RiskReturnScatter';

export function RiskTab({ r }) {
  const live = r.source === 'live';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard live={live} label="Sharpe" value={r.sharpe} sub="risk-adj return" color="green" valueColor={r.sharpe > 1 ? 'up' : 'orange'} tooltipKey="sharpe" gauge={Math.min(r.sharpe / 2.5, 1)} />
        <StatCard label="Sortino" value={r.sortino} sub="downside-adj (est.)" color="blue" valueColor="blue" tooltipKey="sortino" gauge={Math.min(r.sortino / 3, 1)} />
        <StatCard live={live} label="Std. Dev." value={`${r.sVol}%`} sub="annualized vol" color="orange" valueColor="orange" tooltipKey="stddev" />
        <StatCard label="Beta" value={r.beta} sub="vs benchmark (est.)" color="purple" valueColor="purple" tooltipKey="beta" />
        <StatCard label="Alpha" value={`${r.alpha > 0 ? '+' : ''}${r.alpha}%`} sub="excess (est.)" color={r.alpha > 0 ? 'green' : 'red'} valueColor={r.alpha > 0 ? 'up' : 'down'} tooltipKey="alpha" />
        <StatCard live={live} label="Max DD" value={`${r.maxdd}%`} sub="peak-to-trough" color="red" valueColor="down" tooltipKey="maxdd" />
        <StatCard live={live} label="Recovery" value={`${r.recov} mo`} sub="back to peak" color="orange" valueColor="orange" tooltipKey="recov" />
        <StatCard label="Tracking Err." value={`${r.te}%`} sub={`IR ${r.ir} (est.)`} color="gold" valueColor="gold" tooltipKey="te" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame title="Drawdown Profile" tooltipKey="ddchart" height={240}>
          <DrawdownChart data={r.dd} />
        </ChartFrame>
        <ChartFrame title="Risk–Return Positioning" tooltipKey="rrchart" height={240}>
          <RiskReturnScatter vol={r.vol} sVol={r.sVol} origC={r.origC} sharC={r.sharC} />
        </ChartFrame>
      </div>
    </div>
  );
}
