export default function RadarChart({ domainScores }) {
  const cx = 150, cy = 130, R = 100;
  const n = domainScores.length;

  const point = (i, r) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = domainScores.map((d, i) => point(i, R * (d.pct / 100)));
  const polygon = dataPoints.map(p => p.join(',')).join(' ');

  return (
    <div className="glass rounded-2xl p-4">
      <svg viewBox="0 0 300 260" className="w-full h-auto max-h-64">
        {/* Grid */}
        {gridLevels.map(level => (
          <polygon key={level}
            points={Array.from({ length: n }, (_, i) => point(i, R * level).join(',')).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {domainScores.map((_, i) => {
          const [x, y] = point(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
        })}
        {/* Data fill */}
        <polygon points={polygon}
          fill="rgba(56,217,169,0.12)" stroke="var(--color-teal)" strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(56,217,169,0.3))' }}
        />
        {/* Dots */}
        {dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="var(--color-teal)" stroke="var(--color-bg)" strokeWidth="2" />
        ))}
        {/* Labels */}
        {domainScores.map((d, i) => {
          const [x, y] = point(i, R + 22);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              className="fill-hint text-[11px] font-bold">{d.label}</text>
          );
        })}
      </svg>
    </div>
  );
}
