import { useState } from 'react';

export default function QuestScreen({ quest, professionId, onBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const questions = quest.questions;
  const total = questions.length;
  const q = questions[currentQ];

  const handleAnswer = (optIndex) => {
    if (selected !== null) return;
    setSelected(optIndex);

    const isCorrect = q.options[optIndex]?.correct === true;
    if (isCorrect) setCorrect(c => c + 1);

    // Авто-переход через 1.5с
    setTimeout(() => {
      if (currentQ + 1 < total) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 1500);
  };

  // Финальный экран
  if (finished) {
    const ratio = correct / total;
    const emoji = ratio >= 0.8 ? '🌟' : ratio >= 0.5 ? '👏' : '📚';
    const verdict = ratio >= 0.8
      ? 'Тамаша нәтиже! Сен осы салаға өте жақынсың!'
      : ratio >= 0.5
        ? 'Жақсы! Бұл сала саған сәйкес келеді!'
        : 'Қызықты! Бұл сала туралы көбірек біл!';

    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center gap-6 p-6">
        <div className="text-6xl animate-pop">{emoji}</div>
        <h2 className="text-2xl font-extrabold animate-fade-up">{quest.title}</h2>
        <div className="glass rounded-3xl px-8 py-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-4xl font-extrabold text-teal">{correct}/{total}</div>
          <div className="text-sm text-hint mt-1">дұрыс жауап</div>
        </div>
        <p className="text-hint text-sm max-w-[280px] leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {verdict}
        </p>
        <button onClick={onBack}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-base text-bg flex items-center justify-center gap-2 transition-transform active:scale-[0.97] animate-fade-up"
          style={{ background: 'linear-gradient(135deg, var(--color-teal), #20c997)', boxShadow: '0 4px 30px rgba(56,217,169,0.3)', animationDelay: '0.3s' }}>
          ← Нәтижелерге оралу
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-4 px-5">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-hint text-sm font-semibold">← Артқа</button>
          <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-gold">
            🎮 {quest.title}
          </span>
          <span className="text-sm font-bold text-text-primary/50">{currentQ + 1}/{total}</span>
        </div>
        {/* Progress */}
        <div className="w-full h-1 bg-bg-light rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((currentQ) / total) * 100}%`, background: 'linear-gradient(90deg, var(--color-gold), var(--color-teal))' }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col gap-5 pt-3 pb-6" key={currentQ}>
        <h2 className="text-xl font-bold leading-relaxed animate-slide-in">{q.text}</h2>

        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, i) => {
            let extra = '';
            if (selected !== null) {
              if (opt.correct) extra = 'border-2 border-teal bg-teal/10';
              else if (i === selected && !opt.correct) extra = 'border-2 border-danger bg-danger/10';
            }

            return (
              <button key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`w-full glass rounded-2xl p-4 text-left text-[15px] font-medium leading-snug
                  transition-all duration-300 select-none ${extra}
                  ${selected === null ? 'active:scale-[0.97]' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={selected !== null && opt.correct ? 'text-teal' : selected === i && !opt.correct ? 'text-danger' : ''}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {selected !== null && q.explanation && (
          <div className="glass rounded-2xl p-4 border-l-4 border-gold animate-fade-up">
            <div className="text-xs text-gold font-bold mb-1">💡 Түсіндірме</div>
            <div className="text-sm text-text-primary/80 leading-relaxed">{q.explanation}</div>
          </div>
        )}
      </div>
    </div>
  );
}
