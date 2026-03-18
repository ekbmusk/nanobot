import { useEffect, useState } from 'react'

export default function XPAnimation({ xp, bonusXp, onDone }) {
  const [phase, setPhase] = useState('enter') // enter -> hold -> exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('exit'), 1800)
    const t3 = setTimeout(() => onDone?.(), 2300)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  const base = phase === 'enter'
    ? 'opacity-0 translate-y-4'
    : phase === 'hold'
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 -translate-y-6'

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center gap-2 transition-all duration-500 ${base}`}>
      <div className="bg-primary/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-glow-primary flex items-center gap-2">
        <span className="text-2xl font-extrabold text-white">+{xp} XP</span>
      </div>
      {bonusXp > 0 && (
        <div className="bg-warning/90 backdrop-blur-sm rounded-xl px-4 py-1.5 shadow flex items-center gap-1.5">
          <span className="text-sm font-bold text-white">+{bonusXp} бонус XP 🔥</span>
        </div>
      )}
    </div>
  )
}
