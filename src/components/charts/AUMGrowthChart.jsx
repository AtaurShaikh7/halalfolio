import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export function AUMGrowthChart({ aum }) {
  const data = aum.map((v, i) => ({ m: MONTHS[i], aum: v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="aumFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border2)" strokeDasharray="3 3" />
        <XAxis dataKey="m" stroke="var(--text3)" tick={{ fontSize: 10 }} />
        <YAxis stroke="var(--text3)" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`₹${v.toLocaleString()} Cr`, 'AUM']}
        />
        <Area dataKey="aum" stroke="var(--gold)" strokeWidth={1.8} fill="url(#aumFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
