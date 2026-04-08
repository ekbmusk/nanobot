import { useState } from 'react';

export default function OptionCard({ text, index, onSelect, delay = 0 }) {
  const [selected, setSelected] = useState(false);
  const [ripple, setRipple] = useState(null);

  const handleClick = (e) => {
    if (selected) return;

    // Ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    setSelected(true);

    // Delay before advancing to next question
    setTimeout(() => {
      onSelect(index);
      setSelected(false);
      setRipple(null);
    }, 400);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full rounded-2xl p-4 flex items-center gap-3.5 text-left text-[15px] font-medium leading-snug
        select-none relative overflow-hidden
        transition-all duration-300 ease-out
        animate-fade-up
        ${selected
          ? 'bg-teal/10 border-2 border-teal shadow-[0_0_20px_rgba(56,217,169,0.15)] scale-[0.98]'
          : 'glass active:scale-[0.97]'
        }
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Ripple */}
      {ripple && (
        <span
          className="absolute rounded-full bg-teal/20 animate-[ripple_0.6s_ease-out_forwards] pointer-events-none"
          style={{ left: ripple.x, top: ripple.y, width: 0, height: 0 }}
        />
      )}

      {/* Indicator */}
      <span className={`
        w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center
        transition-all duration-300
        ${selected ? 'bg-teal border-teal scale-110' : 'border-white/15'}
      `}>
        {selected && (
          <svg className="w-3.5 h-3.5 text-bg animate-pop" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,8 7,12 13,4" />
          </svg>
        )}
      </span>

      <span className={`transition-colors duration-300 ${selected ? 'text-teal' : ''}`}>{text}</span>
    </button>
  );
}
