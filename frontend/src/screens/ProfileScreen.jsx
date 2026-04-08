import Avatar from '../components/Avatar';
import RadarChart from '../components/RadarChart';
import { getHistory } from '../utils/history';
import { detectPersonalityType, computeDomainScores } from '../utils/scoring';

export default function ProfileScreen({ user, tagScores: propTagScores, onBack, onStart, onViewHistory }) {
  const history = getHistory();

  // tagScores — из props (свежий тест) или из последней записи истории
  const tagScores = (propTagScores && Object.keys(propTagScores).length > 0)
    ? propTagScores
    : history[0]?.tagScores || null;

  const personality = tagScores ? detectPersonalityType(tagScores) : null;
  const domainScores = tagScores ? computeDomainScores(tagScores) : null;

  const personalityEmojis = {
    technologist: '💻', researcher: '🔬', creative: '🎨',
    communicator: '🎓', entrepreneur: '💼', practitioner: '⚙️', healer: '🏥',
  };

  return (
    <div className="flex flex-col min-h-screen gap-4 px-5 pt-2 pb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between py-2">
        <button onClick={onBack} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-primary">←</button>
        <span className="text-base font-bold">Профиль</span>
        <div className="w-10" />
      </div>

      {/* User card */}
      <div className="glass rounded-3xl p-6 flex flex-col items-center gap-3 animate-fade-up">
        <Avatar user={user} size="md" />
        <h2 className="text-xl font-extrabold">{user?.first_name || 'Оқушы'}</h2>
        {user?.username && <p className="text-sm text-hint">@{user.username}</p>}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center">
            <span className="text-xl font-extrabold text-teal">{history.length}</span>
            <span className="text-[10px] text-hint font-bold uppercase tracking-wide">тест</span>
          </div>
          <div className="w-px h-8 bg-glass-border" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-extrabold text-teal">{history.length > 0 ? `${history[0].top5?.[0]?.matchPct || 0}%` : '—'}</span>
            <span className="text-[10px] text-hint font-bold uppercase tracking-wide">сәйкестік</span>
          </div>
        </div>
      </div>

      {/* Personality type */}
      {personality && (
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2 pl-1">🧠 Сенің типің</div>
          <div className="glass rounded-2xl p-4 flex items-center gap-4 border-l-4 border-gold">
            <div className="w-12 h-12 rounded-xl bg-gold-soft flex items-center justify-center text-2xl shrink-0">
              {personalityEmojis[personality.id] || '🧠'}
            </div>
            <div>
              <h3 className="text-base font-extrabold">{personality.name}</h3>
              <p className="text-xs text-hint leading-snug mt-1">{personality.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Radar chart */}
      {domainScores && (
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2 pl-1">📊 Доменлер бойынша скор</div>
          <RadarChart domainScores={domainScores} />
        </div>
      )}

      {/* History */}
      <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2 pl-1">🕐 Тест тарихы</div>
        {history.length === 0 ? (
          <p className="text-hint text-sm text-center py-6">Әлі тест тапсырылмаған</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((entry, i) => (
              <button key={i} onClick={() => onViewHistory(entry)}
                className="glass rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.98]">
                <div className="w-10 h-10 rounded-xl bg-teal-soft flex items-center justify-center text-xl shrink-0">
                  {entry.top5?.[0]?.emoji || '🎯'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{entry.top5?.[0]?.name || 'Тест'}</div>
                  <div className="text-[11px] text-hint mt-0.5">{entry.date}</div>
                </div>
                <span className="text-xs text-hint/30">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Start new test */}
      <button onClick={onStart}
        className="w-full max-w-xs mx-auto mt-auto py-4 rounded-2xl font-bold text-base text-bg flex items-center justify-center gap-2 transition-transform active:scale-[0.97]"
        style={{ background: 'linear-gradient(135deg, var(--color-teal), #20c997)', boxShadow: '0 4px 30px rgba(56,217,169,0.3)' }}>
        Жаңа тест бастау <span className="text-lg">→</span>
      </button>
    </div>
  );
}
