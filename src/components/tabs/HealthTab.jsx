import { StatCard } from '../ui/StatCard';
import { ChartFrame } from '../charts/ChartFrame';
import { AUMGrowthChart } from '../charts/AUMGrowthChart';
import { InfoButton } from '../ui/InfoButton';

export function HealthTab({ r, fund }) {
  const aumLatest = r.aum[r.aum.length - 1];
  const aumStart = r.aum[0];
  const aumGrowth = (((aumLatest - aumStart) / aumStart) * 100).toFixed(1);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="AUM" value={`₹${(aumLatest / 1000).toFixed(1)}k Cr`} sub={`+${aumGrowth}% YoY`} color="gold" valueColor="gold" tooltipKey="aum" />
        <StatCard label="Expense Ratio" value={`${r.exp}%`} sub="annual" color="blue" valueColor="blue" tooltipKey="expr" gauge={1 - r.exp / 2.5} />
        <StatCard label="Turnover" value={`${r.turn}%`} sub="portfolio" color={r.turn > 100 ? 'red' : 'green'} valueColor={r.turn > 100 ? 'down' : 'up'} tooltipKey="turn" />
        <StatCard label="Vintage" value={fund.since} sub="inception year" color="purple" valueColor="purple" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartFrame title="AUM Growth (12 months)" tooltipKey="aum" height={220}>
            <AUMGrowthChart aum={r.aum} />
          </ChartFrame>
        </div>
        <div className="rounded-xl border bg-card p-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-playfair text-[15px] font-semibold mb-3">Operational Snapshot</h3>
          <dl className="space-y-2 text-[13px]">
            <Row k="AMC" v={fund.amc} />
            <Row k="Manager" v={fund.mgr} />
            <Row k="Tenure" v={fund.tenure} />
            <Row k="Inception" v={fund.since} />
            <Row k="Expense" v={`${r.exp}%`} tt="expr" />
            <Row k="Turnover" v={`${r.turn}%`} tt="turn" />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, tt }) {
  return (
    <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'var(--border2)' }}>
      <span className="flex items-center gap-1 text-text2">
        {k}
        {tt && <InfoButton tooltipKey={tt} />}
      </span>
      <span className="font-semibold text-text">{v}</span>
    </div>
  );
}
