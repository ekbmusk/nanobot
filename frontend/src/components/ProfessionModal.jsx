import { useEffect, useRef } from 'react';
import { FIELD_ICONS } from '../constants';

function getFieldEmoji(field) {
  if (!field) return '💼';
  for (const [key, emoji] of Object.entries(FIELD_ICONS)) {
    if (field.includes(key)) return emoji;
  }
  return '💼';
}

export default function ProfessionModal({ matched, universities, uniMap, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => overlayRef.current?.classList.add('opacity-100'));
  }, []);

  if (!matched) return null;
  const p = matched.profession;
  const profUnis = (uniMap[p.id] || [])
    .map(uid => universities.find(u => u.id === uid))
    .filter(Boolean).slice(0, 5);

  const close = () => {
    overlayRef.current?.classList.remove('opacity-100');
    setTimeout(onClose, 300);
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center opacity-0 transition-opacity duration-300"
      onClick={e => e.target === e.currentTarget && close()}>
      <div className="w-full max-w-lg max-h-[85vh] bg-bg border-t border-glass-border rounded-t-3xl overflow-y-auto p-5 pb-8 translate-y-0 transition-transform duration-400">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />

        {/* Close */}
        <button onClick={close} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-bg-light flex items-center justify-center text-hint">✕</button>

        {/* Hero */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-soft border border-teal/15 flex items-center justify-center text-2xl shrink-0">
            {getFieldEmoji(p.field)}
          </div>
          <div>
            <h3 className="text-xl font-extrabold leading-tight">{p.name}</h3>
            <span className="text-[11px] text-teal font-bold uppercase tracking-wider">{p.field}</span>
          </div>
        </div>

        {/* Match bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-2 bg-bg-light rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-600"
              style={{ width: `${matched.matchPct}%`, background: 'linear-gradient(90deg, var(--color-teal), var(--color-gold))', boxShadow: '0 0 10px rgba(56,217,169,0.3)' }} />
          </div>
          <span className="text-xl font-extrabold text-teal">{matched.matchPct}%</span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-text-primary/75 mb-5">{p.description}</p>

        {/* Salary & Demand */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="glass rounded-xl p-3.5">
            <div className="text-[10px] text-hint font-bold uppercase tracking-wide">Жалақы</div>
            <div className="text-sm font-bold mt-1">{p.salary_range}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <div className="text-[10px] text-hint font-bold uppercase tracking-wide">Сұраныс</div>
            <div className="text-sm font-bold mt-1">{p.demand}</div>
          </div>
        </div>

        {/* ENT Subjects */}
        {p.ent_subjects?.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2">📚 ҰБТ пәндері</div>
            <div className="flex flex-wrap gap-1.5">
              {p.ent_subjects.map(s => (
                <span key={s} className="px-3.5 py-1.5 bg-teal-soft text-teal border border-teal/10 rounded-full text-xs font-semibold">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Universities */}
        {profUnis.length > 0 && (
          <div>
            <div className="text-[11px] text-hint font-bold uppercase tracking-wider mb-2">🏫 ЖОО-лар</div>
            <div className="flex flex-col gap-1.5">
              {profUnis.map(u => (
                <div key={u.id} className="glass rounded-xl px-3.5 py-3 flex items-center justify-between text-sm font-semibold">
                  <span>{u.name}</span>
                  <span className="text-[11px] text-hint">{u.city}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
