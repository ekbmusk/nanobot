export default function Card({ children, className = '', onClick, accent }) {
  const accentStyle = accent ? { borderLeft: `3px solid ${accent}` } : {}
  const base = 'bg-surface rounded-2xl border border-border shadow-card overflow-hidden'
  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={accentStyle}
        className={`${base} w-full text-left pressable ${className}`}
      >
        {children}
      </button>
    )
  }
  return (
    <div className={`${base} ${className}`} style={accentStyle}>
      {children}
    </div>
  )
}
