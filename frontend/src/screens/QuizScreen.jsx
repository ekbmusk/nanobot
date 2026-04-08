import { useState, useEffect, useRef } from 'react';
import ProgressBar from '../components/ProgressBar';
import OptionCard from '../components/OptionCard';

export default function QuizScreen({ questions, currentIndex, getShuffledOptions, onSelect, categories }) {
  const [timerSec, setTimerSec] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (currentIndex >= questions.length) return null;

  const q = questions[currentIndex];
  const shuffledOpts = getShuffledOptions(currentIndex);
  const catIndex = categories.findIndex(c => c.id === q.categoryId);
  const mm = Math.floor(timerSec / 60);
  const ss = String(timerSec % 60).padStart(2, '0');

  return (
    <div className="flex flex-col min-h-screen pt-4 px-5">
      {/* Header */}
      <div className="sticky top-0 z-10 pb-4" style={{ background: 'linear-gradient(to bottom, var(--color-bg), transparent)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-text-primary/50">{currentIndex + 1} / {questions.length}</span>
          <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-teal">
            {q.categoryEmoji} {q.categoryName}
          </span>
          <span className="text-sm font-semibold text-hint tabular-nums">{mm}:{ss}</span>
        </div>
        <ProgressBar value={currentIndex} max={questions.length} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col gap-5 pt-3 pb-6" key={currentIndex}>
        <h2 className="text-xl font-bold leading-relaxed animate-slide-in">{q.text}</h2>

        <div className="flex flex-col gap-2.5">
          {shuffledOpts.map((opt, i) => (
            <OptionCard
              key={`${currentIndex}-${i}`}
              text={opt.text}
              index={opt.originalIndex}
              onSelect={onSelect}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
