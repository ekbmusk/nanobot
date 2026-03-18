import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { CheckCircle2, XCircle, ChevronRight, Delete, Target } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import Button from '../components/Button'
import FormulaRenderer from '../components/FormulaRenderer'
import { SkeletonCard } from '../components/SkeletonLoader'
import { problemsAPI } from '../api/problems'

const LEVELS = [
  { id: 'easy', label: 'Жеңіл', color: '#43E97B' },
  { id: 'medium', label: 'Орташа', color: '#FFD93D' },
  { id: 'hard', label: 'Күрделі', color: '#FF6B6B' },
  { id: null, label: 'Кездейсоқ', color: '#6C63FF', Icon: Target },
]
const NUMPAD = ['7','8','9','4','5','6','1','2','3','.','0','⌫']

function ResultCard({ result, onNext }) {
  const Icon = result.correct ? CheckCircle2 : XCircle
  return (
    <div className={`card p-5 border-2 animate-scale-in ${result.correct ? 'border-success/40' : 'border-danger/40'}`}>
      <div className="text-center mb-4">
        <Icon size={52} strokeWidth={1.5} className={`mx-auto mb-2 ${result.correct ? 'text-success' : 'text-danger'}`} />
        <h3 className="text-lg font-bold text-text-1">{result.correct ? 'Дұрыс!' : 'Қате'}</h3>
        <p className="text-sm text-text-2 mt-1">{result.message}</p>
      </div>
      {result.solution && (
        <div className="bg-surface-2 rounded-xl p-3 mb-4 border border-border">
          <p className="text-xs text-primary font-semibold mb-1">Шешімі:</p>
          <p className="text-sm text-text-2 leading-relaxed">{result.solution}</p>
        </div>
      )}
      <Button onClick={onNext} variant={result.correct ? 'success' : 'secondary'} icon={<ChevronRight size={16} />}>
        Келесі есеп
      </Button>
    </div>
  )
}

export default function Problems() {
  const [level, setLevel] = useState('easy')
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchProblems() }, [level])

  const fetchProblems = async () => {
    setLoading(true); setSelected(null); setResult(null); setAnswer('')
    try {
      const data = await problemsAPI.getProblems(level ? { difficulty: level } : {})
      setProblems(data)
    } catch { setProblems([]) }
    finally { setLoading(false) }
  }

  const handleSelect = (p) => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(p); setAnswer(''); setResult(null) }

  const handleKey = (k) => {
    WebApp.HapticFeedback.impactOccurred('light')
    if (k === '⌫') setAnswer(v => v.slice(0, -1))
    else if (k === '.' && answer.includes('.')) return
    else setAnswer(v => v + k)
  }

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true); WebApp.HapticFeedback.impactOccurred('medium')
    try {
      const res = await problemsAPI.checkAnswer(selected.id, answer)
      setResult(res)
      WebApp.HapticFeedback.notificationOccurred(res.correct ? 'success' : 'error')
    } catch { setResult({ correct: false, message: 'Қате орын алды' }) }
    finally { setSubmitting(false) }
  }

  if (selected) {
    const lvl = LEVELS.find(l => l.id === selected.difficulty)
    return (
      <div className="min-h-screen bg-bg page-enter flex flex-col">
        <TopBar showBack onBack={() => { setSelected(null); setResult(null); setAnswer('') }} title="Есеп" />
        <div className="flex-1 px-4 pt-2 pb-6 flex flex-col gap-4">
          <Card className="p-4">
            {lvl && (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3" style={{ background: `${lvl.color}18`, color: lvl.color }}>
                {lvl.label}
              </span>
            )}
            <FormulaRenderer text={selected.question} />
            {selected.formula && (
              <div className="formula-block mt-3">
                <FormulaRenderer formula={`$$${selected.formula}$$`} glow />
              </div>
            )}
          </Card>

          {result ? (
            <ResultCard result={result} onNext={() => { setSelected(null); setResult(null); setAnswer('') }} />
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-surface border-2 border-primary/30 rounded-2xl px-4 py-4 text-center mb-2 min-h-[58px] flex items-center justify-center">
                <span className={`text-3xl font-bold tracking-widest ${answer ? 'text-text-1' : 'text-text-3'}`}>{answer || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD.map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    className="bg-surface-2 border border-border rounded-xl py-3.5 flex items-center justify-center text-lg font-semibold text-text-1 active:bg-primary/20 active:scale-95 transition-all">
                    {k === '⌫' ? <Delete size={20} strokeWidth={1.5} className="text-text-2" /> : k}
                  </button>
                ))}
              </div>
              <Button className="mt-3" onClick={handleSubmit} disabled={!answer.trim() || submitting}>
                {submitting ? 'Тексерілуде...' : 'Тексеру'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Есептер</h1>
        <p className="text-sm text-text-2 mb-4">Деңгей таңдаңыз</p>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {LEVELS.map(l => (
            <button key={String(l.id)} onClick={() => { setLevel(l.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`chip flex-shrink-0 border flex items-center gap-1.5 ${level === l.id ? 'text-white border-transparent' : 'bg-surface text-text-2 border-border'}`}
              style={level === l.id ? { background: l.color } : {}}>
              {l.Icon && <l.Icon size={14} strokeWidth={1.5} />}
              {l.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="space-y-2.5">
            {problems.map(p => {
              const lvl = LEVELS.find(l => l.id === p.difficulty)
              return (
                <button key={p.id} onClick={() => handleSelect(p)}
                  className="w-full card p-4 text-left pressable"
                  style={{ borderLeft: `3px solid ${lvl?.color || '#6C63FF'}` }}>
                  <p className="text-text-1 text-sm leading-relaxed line-clamp-2">{p.question}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-3">{p.topic}</span>
                    <ChevronRight size={14} strokeWidth={1.5} className="text-text-3" />
                  </div>
                </button>
              )
            })}
            {problems.length === 0 && (
              <div className="text-center py-16">
                <Target size={48} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
                <p className="text-text-3 text-sm">Есеп табылмады</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
