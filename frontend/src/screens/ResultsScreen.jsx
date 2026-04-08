import { useState, useEffect } from 'react';
import ProfessionCard from '../components/ProfessionCard';
import ProfessionModal from '../components/ProfessionModal';
import { fetchCard } from '../api/client';

export default function ResultsScreen({ matchedResults, universities, uniMap, totalTimeMs, totalQuestions, userName, availableQuests, onSend, onShare, onStartQuest, onQuests, onProfile, isHistoryView }) {
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [cardUrl, setCardUrl] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const mm = totalTimeMs ? Math.floor(totalTimeMs / 60000) : 0;
  const ss = totalTimeMs ? String(Math.floor((totalTimeMs % 60000) / 1000)).padStart(2, '0') : '00';

  // Автоматически генерируем карточку
  useEffect(() => {
    if (matchedResults.length > 0 && !isHistoryView) {
      setCardLoading(true);
      const profs = matchedResults.map(m => ({
        id: m.profession.id,
        name: m.profession.name,
        name_ru: m.profession.name_ru || '',
        demand: m.profession.demand || '',
        salary_range: m.profession.salary_range || '',
        score: m.score,
      }));
      fetchCard(userName || '👤', profs, 'kk')
        .then(url => setCardUrl(url))
        .catch(() => {})
        .finally(() => setCardLoading(false));
    }
  }, [matchedResults, userName, isHistoryView]);

  return (
    <div className="flex flex-col min-h-screen px-5 pb-5">
      {/* Header */}
      <div className="text-center py-5 animate-fade-up">
        <h2 className="text-2xl font-extrabold"
          style={{ background: 'linear-gradient(135deg, var(--color-text-primary), var(--color-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isHistoryView ? 'Тест нәтижесі' : '🎉 Сенің нәтижең'}
        </h2>
        <p className="text-hint text-sm mt-1">ТОП-5 мамандық ұсынысы</p>
      </div>

      {/* Stats bar */}
      {!isHistoryView && totalTimeMs > 0 && (
        <div className="glass rounded-2xl flex items-center justify-center gap-6 px-5 py-3 mb-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <span className="text-sm font-bold">{totalQuestions} сұрақ</span>
          </div>
          <div className="w-px h-5 bg-glass-border" />
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱</span>
            <span className="text-sm font-bold">{mm}:{ss}</span>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pb-4">
        {matchedResults.map((m, i) => (
          <ProfessionCard
            key={m.profession.id}
            matched={m}
            rank={i}
            onClick={() => setSelectedProfession(m)}
            hasQuest={!!availableQuests?.[m.profession.id]}
            onQuest={onStartQuest}
            delay={i * 80 + 100}
          />
        ))}
      </div>

      {/* Card preview */}
      {cardUrl && (
        <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2 pl-1">📸 Сенің карточкаң</div>
          <div className="glass rounded-2xl p-3 flex flex-col items-center gap-3">
            <img src={cardUrl} alt="Result card" className="w-full max-w-[280px] rounded-xl shadow-lg" />
            <p className="text-xs text-hint">Суретті басып тұрып сақта 👆</p>
          </div>
        </div>
      )}
      {cardLoading && (
        <div className="flex items-center justify-center gap-2 mb-4 text-hint text-sm">
          <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          Карточка жасалуда...
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-glass-border">
        {!isHistoryView && (
          <button onClick={onSend}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-base text-bg flex items-center justify-center gap-2.5 transition-transform active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, var(--color-teal), #20c997)', boxShadow: '0 4px 30px rgba(56,217,169,0.3)' }}>
            📤 Ботқа жіберу <span className="text-lg">→</span>
          </button>
        )}
        <div className="flex gap-2.5 w-full max-w-xs">
          <button onClick={onShare}
            className="flex-1 glass rounded-2xl py-3 text-gold font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
            📤 Бөлісу
          </button>
          <button onClick={onQuests}
            className="flex-1 glass rounded-2xl py-3 text-gold font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
            🎮 Квесттер
          </button>
          <button onClick={onProfile}
            className="flex-1 glass rounded-2xl py-3 text-teal font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
            👤 Профиль
          </button>
        </div>
      </div>

      {/* Modal */}
      {selectedProfession && (
        <ProfessionModal
          matched={selectedProfession}
          universities={universities}
          uniMap={uniMap}
          onClose={() => setSelectedProfession(null)}
        />
      )}
    </div>
  );
}
