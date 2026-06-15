import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { fmtMonthYear, fmtMonthYearLong } from '../../lib/format';

function CustomTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div className="rounded-lg border bg-card2 p-2 text-[12px] shadow-card" style={{ borderColor: 'var(--gold)' }}>
      <div className="text-text2">{fmtMonthYearLong(date)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-text2">{p.dataKey}:</span>
          <span className="text-text font-semibold">₹{p.value.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

export function NavGrowthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="var(--border2)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="var(--text3)"
          tick={{ fontSize: 10 }}
          tickFormatter={fmtMonthYear}
          minTickGap={28}
        />
        <YAxis stroke="var(--text3)" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} iconSize={8} />
        <Line dataKey="nifty" stroke="var(--gold)" strokeWidth={1.4} strokeDasharray="4 3" dot={false} name="Nifty 50" />
        <Line dataKey="original" stroke="var(--blue)" strokeWidth={1.8} dot={false} name="Original" />
        <Line dataKey="sharia" stroke="var(--green)" strokeWidth={1.8} dot={false} name="Sharia" />
      </LineChart>
    </ResponsiveContainer>
  );
}
