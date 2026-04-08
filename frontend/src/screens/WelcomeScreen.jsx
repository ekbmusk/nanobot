import { getHistory } from '../utils/history';
import Avatar from '../components/Avatar';

export default function WelcomeScreen({ user, hasQuests, onStart, onProfile, onQuests, onAuthors }) {
  const history = getHistory();
  const hasHistory = history.length > 0;
  const lastTop = hasHistory ? history[0].top5?.[0] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-7 p-6">
      {/* Ambient glow */}
      <div className="absolute w-44 h-44 rounded-full animate-pulse-glow -z-10"
        style={{ background: 'radial-gradient(circle, rgba(56,217,169,0.15) 0%, transparent 70%)' }} />

      {/* Hero icon */}
      <div className="w-22 h-22 rounded-3xl flex items-center justify-center animate-float border border-teal/20 text-5xl"
        style={{ background: 'linear-gradient(135deg, rgba(56,217,169,0.15), rgba(240,180,41,0.1))', boxShadow: '0 0 60px rgba(56,217,169,0.1)' }}>
        🧭
      </div>

      {/* Title */}
      <div className="text-center animate-fade-up">
        <h1 className="text-4xl font-extrabold tracking-tight"
          style={{ background: 'linear-gradient(135deg, var(--color-text-primary), var(--color-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Кім боламын<span style={{ WebkitTextFillColor: 'var(--color-gold)' }}>?</span>
        </h1>
        <p className="text-hint text-sm font-semibold tracking-[3px] uppercase mt-2">Кәсіби бағдар тесті</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {[
          { val: '30', label: 'сұрақ', icon: '📋' },
          { val: '6', label: 'блок', icon: '📦' },
          { val: '65+', label: 'мамандық', icon: '💼' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
            <span className="text-xl">{s.icon}</span>
            <span className="text-2xl font-extrabold">{s.val}</span>
            <span className="text-[10px] text-hint font-bold uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button onClick={onStart}
        className="w-full max-w-xs py-4.5 rounded-2xl font-bold text-base text-bg flex items-center justify-center gap-2 transition-transform active:scale-[0.97] animate-fade-up"
        style={{ background: 'linear-gradient(135deg, var(--color-teal), #20c997)', boxShadow: '0 4px 30px rgba(56,217,169,0.3)', animationDelay: '0.3s' }}>
        {hasHistory ? 'Қайта тест тапсыру' : 'Тестті бастау'} <span className="text-lg">→</span>
      </button>

      {/* Profile card — always visible */}
      <button onClick={onProfile}
        className="w-full max-w-xs glass rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] active:border-teal/20 animate-fade-up"
        style={{ animationDelay: '0.4s' }}>
        <Avatar user={user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{user?.first_name || 'Оқушы'}</div>
          {hasHistory ? (
            <div className="text-xs text-hint mt-0.5">
              {history.length} тест · Соңғы: {lastTop?.name?.split(' ')[0] || '—'}
            </div>
          ) : (
            <div className="text-xs text-hint mt-0.5">Профиль мен тарих</div>
          )}
        </div>
        <span className="text-teal text-xs font-bold">›</span>
      </button>

      {/* Quests */}
      {hasQuests && (
        <button onClick={onQuests}
          className="w-full max-w-xs glass rounded-2xl py-3.5 text-gold font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] animate-fade-up"
          style={{ animationDelay: '0.45s' }}>
          🎮 Өзіңді сына
        </button>
      )}

      {/* Authors */}
      <button onClick={onAuthors}
        className="text-hint text-sm font-semibold border border-glass-border rounded-full px-5 py-2.5 transition-all active:text-teal active:border-teal/30 animate-fade-up"
        style={{ animationDelay: '0.5s' }}>
        👩‍🎓 Авторлар
      </button>

      <p className="text-hint text-xs animate-fade-up" style={{ animationDelay: '0.55s' }}>Шамамен 5-7 минут</p>
    </div>
  );
}
