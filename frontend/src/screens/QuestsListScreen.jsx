import { FIELD_ICONS } from '../constants';

const QUEST_CATEGORIES = [
  { id: 'it', label: '💻 IT', professions: ['software_engineer', 'ai_specialist'] },
  { id: 'med', label: '🏥 Медицина', professions: ['doctor'] },
  { id: 'eng', label: '⚙️ Инженерия', professions: ['architect'] },
  { id: 'art', label: '🎨 Өнер / Дизайн', professions: ['graphic_designer'] },
  { id: 'biz', label: '💼 Бизнес / Экономика', professions: ['economist', 'journalist'] },
  { id: 'law', label: '⚖️ Құқық / Психология', professions: ['lawyer', 'psychologist'] },
  { id: 'food', label: '🍳 Тағам', professions: ['chef'] },
];

export default function QuestsListScreen({ quests, professions, onStartQuest, onBack }) {
  const profMap = {};
  (professions || []).forEach(p => { profMap[p.id] = p; });

  // Тек квесті бар категорияларды көрсету
  const visibleCategories = QUEST_CATEGORIES.filter(cat =>
    cat.professions.some(pid => quests[pid])
  );

  return (
    <div className="flex flex-col min-h-screen px-5 pt-2 pb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between py-3">
        <button onClick={onBack} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-primary">←</button>
        <span className="text-base font-bold">🎮 Өзіңді сына</span>
        <div className="w-10" />
      </div>

      <p className="text-hint text-sm mb-5 text-center">Мамандықты таңдап, білімніңді тексер!</p>

      <div className="flex flex-col gap-5">
        {visibleCategories.map((cat, ci) => (
          <div key={cat.id} className="animate-fade-up" style={{ animationDelay: `${ci * 0.08}s` }}>
            <div className="text-sm font-bold mb-2.5 pl-1">{cat.label}</div>
            <div className="flex flex-col gap-2">
              {cat.professions.filter(pid => quests[pid]).map(pid => {
                const prof = profMap[pid];
                const quest = quests[pid];
                if (!prof || !quest) return null;

                return (
                  <button key={pid}
                    onClick={() => onStartQuest(pid)}
                    className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] active:border-teal/20"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-soft flex items-center justify-center text-2xl shrink-0">
                      {prof.emoji || '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight">{prof.name}</div>
                      <div className="text-xs text-hint mt-0.5">{quest.questions.length} сұрақ</div>
                    </div>
                    <div className="text-gold text-xs font-bold shrink-0">Бастау →</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {visibleCategories.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-hint text-sm">Квесттер жақында қосылады!</p>
        </div>
      )}
    </div>
  );
}
