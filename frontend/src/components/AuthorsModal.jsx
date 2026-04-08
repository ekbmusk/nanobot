import { useEffect, useRef } from 'react';

export default function AuthorsModal({ onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => overlayRef.current?.classList.add('opacity-100'));
  }, []);

  const close = () => {
    overlayRef.current?.classList.remove('opacity-100');
    setTimeout(onClose, 300);
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center opacity-0 transition-opacity duration-300"
      onClick={e => e.target === e.currentTarget && close()}>
      <div className="w-full max-w-lg max-h-[70vh] bg-bg border-t border-glass-border rounded-t-3xl overflow-y-auto p-5 pb-8">
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />
        <button onClick={close} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-bg-light flex items-center justify-center text-hint">✕</button>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">👩‍🎓</span>
          <h3 className="text-xl font-extrabold">Жоба авторлары</h3>
        </div>

        <div className="flex flex-col gap-3">
          <Card label="📌 Тақырып" value="Telegram-бот «Кім боламын?» — кәсіби бағдар" />
          <Card label="👤 Оқушы" value="Алимжанова Фарангиз Гуламжановна" meta="9А сынып" />
          <Card label="👩‍🏫 Жетекшісі" value="Асаева Фатима Альмуратовна" />
          <Card label="🏫 Мектеп" value="Ақын-тұма #11 жалпы білім беретін мектеп" />
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, meta }) {
  return (
    <div className="glass rounded-xl p-3.5 flex flex-col gap-1">
      <div className="text-[11px] text-hint font-bold uppercase tracking-wide">{label}</div>
      <div className="text-[15px] font-bold leading-snug">{value}</div>
      {meta && <div className="text-sm text-teal font-semibold">{meta}</div>}
    </div>
  );
}
