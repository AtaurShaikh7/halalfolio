import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtMonthYear, fmtMonthYearLong } from '../../lib/format';

export function DrawdownChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="ddFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--red)" stopOpacity={0.05} />
            <stop offset="100%" stopColor="var(--red)" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border2)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="var(--text3)"
          tick={{ fontSize: 10 }}
          tickFormatter={fmtMonthYear}
          minTickGap={28}
        />
        <YAxis stroke="var(--text3)" tick={{ fontSize: 10 }} domain={['auto', 0]} unit="%" />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${v}%`, 'Drawdown']}
          labelFormatter={(l) => fmtMonthYearLong(l)}
        />
        <Area dataKey="dd" stroke="var(--red)" strokeWidth={1.5} fill="url(#ddFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
