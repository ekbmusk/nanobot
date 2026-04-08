export default function CompletionScreen({ totalQuestions, totalTimeMs, onSubmit }) {
  const mm = Math.floor(totalTimeMs / 60000);
  const ss = String(Math.floor((totalTimeMs % 60000) / 1000)).padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-6 p-6">
      {/* Burst */}
      <div className="absolute w-60 h-60 rounded-full animate-pulse-glow -z-10"
        style={{ background: 'radial-gradient(circle, rgba(56,217,169,0.12) 0%, transparent 70%)' }} />

      {/* Icon */}
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl animate-pop"
        style={{ background: 'linear-gradient(135deg, rgba(56,217,169,0.15), rgba(56,217,169,0.05))', border: '1px solid rgba(56,217,169,0.2)', boxShadow: '0 0 60px rgba(56,217,169,0.12)' }}>
        ✅
      </div>

      <h2 className="text-3xl font-extrabold animate-fade-up" style={{ animationDelay: '0.15s' }}>
        Тест аяқталды!
      </h2>

      {/* Stats */}
      <div className="glass rounded-3xl flex items-center gap-6 px-7 py-5 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">📋</span>
          <span className="text-3xl font-extrabold">{totalQuestions}</span>
          <span className="text-[10px] text-hint font-bold uppercase tracking-wider">сұрақ</span>
        </div>
        <div className="w-px h-11 bg-glass-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">⏱</span>
          <span className="text-3xl font-extrabold">{mm}:{ss}</span>
          <span className="text-[10px] text-hint font-bold uppercase tracking-wider">уақыт</span>
        </div>
      </div>

      <p className="text-hint text-sm max-w-[280px] leading-relaxed animate-fade-up" style={{ animationDelay: '0.35s' }}>
        Нәтижені ботқа жіберіп, ТОП-5 мамандығыңды біл
      </p>

      <button onClick={onSubmit}
        className="w-full max-w-xs py-4.5 rounded-2xl font-bold text-base text-bg flex items-center justify-center gap-2 transition-transform active:scale-[0.97] animate-fade-up"
        style={{ background: 'linear-gradient(135deg, var(--color-teal), #20c997)', boxShadow: '0 4px 30px rgba(56,217,169,0.3)', animationDelay: '0.45s' }}>
        Нәтижені жіберу <span className="text-lg">→</span>
      </button>
    </div>
  );
}
