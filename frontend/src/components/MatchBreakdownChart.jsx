import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = { exact: '#C9A227', subset: '#8C93A6', exceptions: '#C15B4A' };

export default function MatchBreakdownChart({ exact, subset, exceptions }) {
  const data = [
    { name: 'Exact (Pass 1)', value: exact, color: COLORS.exact },
    { name: 'Subset-sum (Pass 2)', value: subset, color: COLORS.subset },
    { name: 'Exceptions', value: exceptions, color: COLORS.exceptions },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <p className="empty-state">Run reconciliation to see the breakdown.</p>;
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            animationDuration={700}
          >
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#161D2C',
              border: '1px solid #2A3346',
              borderRadius: 8,
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 12,
              color: '#E8E6DE',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {data.map(d => (
          <span key={d.name} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: d.color }} />
            {d.name} — {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
