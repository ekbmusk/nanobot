export default function ProgressBar({ value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-1 bg-bg-light rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--color-teal), var(--color-gold))',
          boxShadow: '0 0 12px rgba(56,217,169,0.4)',
        }}
      />
    </div>
  );
}
