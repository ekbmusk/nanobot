export default function Button({ children, onClick, variant = 'primary', disabled = false, className = '', size = 'md', icon }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
  const sizes = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3.5 px-6 text-sm w-full',
    lg: 'py-4 px-8 text-base w-full',
  }
  const variants = {
    primary: 'bg-primary text-white shadow-glow-primary hover:bg-primary/90',
    secondary: 'bg-surface-2 text-text-1 border border-border hover:bg-surface-2/70',
    ghost: 'text-primary hover:bg-primary-dim',
    danger: 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30',
    success: 'bg-success/20 text-success border border-success/30',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  )
}
