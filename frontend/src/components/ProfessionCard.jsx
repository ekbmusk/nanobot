import { FIELD_ICONS } from '../constants';

const rankStyles = [
  'bg-gold-soft text-gold',
  'bg-white/5 text-gray-400',
  'bg-amber-900/20 text-amber-600',
  'bg-bg-light text-hint',
  'bg-bg-light text-hint',
];

function getFieldEmoji(field) {
  if (!field) return '💼';
  for (const [key, emoji] of Object.entries(FIELD_ICONS)) {
    if (field.includes(key)) return emoji;
  }
  return '💼';
}

export default function ProfessionCard({ matched, rank, onClick, onQuest, hasQuest, delay = 0 }) {
  const p = matched.profession;

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={onClick}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3.5 text-left
          transition-all duration-200 active:scale-[0.98] active:border-teal/30 select-none"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${rankStyles[rank] || rankStyles[3]}`}>
          {rank + 1}
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-soft flex items-center justify-center text-xl shrink-0">
          {getFieldEmoji(p.field)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold leading-tight line-clamp-2">{p.name}</div>
          <div className="text-[11px] text-hint font-semibold uppercase tracking-wide mt-0.5">{p.field}</div>
        </div>
        <span className="text-hint/30 text-xs shrink-0">›</span>
      </button>

      {hasQuest && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuest(p.id); }}
          className="w-full mt-1.5 glass rounded-xl py-2.5 text-gold font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
        >
          🎮 Өзіңді сына
        </button>
      )}
    </div>
  );
}
