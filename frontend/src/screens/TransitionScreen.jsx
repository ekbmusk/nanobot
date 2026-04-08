import { useEffect } from 'react';

export default function TransitionScreen({ category, catIndex, totalCategories, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4 p-6">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl animate-pop"
        style={{ background: 'linear-gradient(135deg, rgba(56,217,169,0.12), rgba(240,180,41,0.08))', border: '1px solid rgba(56,217,169,0.15)', boxShadow: '0 0 50px rgba(56,217,169,0.08)' }}>
        {category.emoji}
      </div>

      <h2 className="text-2xl font-extrabold animate-fade-up">{category.name}</h2>
      <p className="text-hint text-sm max-w-[260px] leading-relaxed">{category.description}</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-2">
        {Array.from({ length: totalCategories }, (_, i) => (
          <div key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < catIndex ? 'bg-teal shadow-[0_0_8px_rgba(56,217,169,0.4)]'
              : i === catIndex ? 'bg-gold shadow-[0_0_8px_rgba(240,180,41,0.4)] animate-[dotPop_0.8s_ease-in-out_infinite_alternate]'
              : 'bg-bg-light'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
