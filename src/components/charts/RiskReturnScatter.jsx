import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ZAxis,
  Label,
} from 'recharts';

function Dot({ cx, cy, payload }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={payload.fill} stroke="var(--card)" strokeWidth={2} />
      <text
        x={cx + 12}
        y={cy + 3}
        fontSize={10}
        fill="var(--text)"
        style={{ fontWeight: 600 }}
      >
        {payload.name}
      </text>
    </g>
  );
}

export function RiskReturnScatter({ vol, sVol, origC, sharC }) {
  const data = [
    { name: 'Nifty 50', risk: 14.2, ret: 13.5, fill: 'var(--gold)' },
    { name: 'Category', risk: 15.5, ret: 14.2, fill: 'var(--text3)' },
    { name: 'Original', risk: vol, ret: origC, fill: 'var(--blue)' },
    { name: 'Sharia', risk: sVol, ret: sharC, fill: 'var(--green)' },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 24, bottom: 22, left: -10 }}>
        <CartesianGrid stroke="var(--border2)" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="risk" stroke="var(--text3)" tick={{ fontSize: 10 }} unit="%">
          <Label value="Risk (σ)" position="insideBottom" offset={-8} fill="var(--text2)" fontSize={11} />
        </XAxis>
        <YAxis type="number" dataKey="ret" stroke="var(--text3)" tick={{ fontSize: 10 }} unit="%">
          <Label value="Return" angle={-90} position="insideLeft" offset={18} fill="var(--text2)" fontSize={11} />
        </YAxis>
        <ZAxis range={[100, 100]} />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter data={data} shape={<Dot />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
