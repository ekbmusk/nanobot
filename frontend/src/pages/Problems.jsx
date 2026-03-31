import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { CheckCircle2, XCircle, ChevronRight, Delete, Target, Atom, Orbit, Hexagon, Cpu } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import Button from '../components/Button'
import FormulaRenderer from '../components/FormulaRenderer'
import QuestionMedia from '../components/QuestionMedia'
import { SkeletonCard } from '../components/SkeletonLoader'
import { problemsAPI } from '../api/problems'

const LEVELS = [
  { id: '1', label: '1', color: '#10B981' },
  { id: '2', label: '2', color: '#34D399' },
  { id: '3', label: '3', color: '#F59E0B' },
  { id: '4', label: '4', color: '#F97316' },
  { id: '5', label: '5', color: '#EF4444' },
  { id: '6', label: '6', color: '#8B5CF6' },
  { id: null, label: 'Кездейсоқ', color: '#06B6D4', Icon: Target },
]
const TOPICS = [
  { id: null, label: 'Барлығы', Icon: null },
  { id: 'atomic_structure', label: 'Атом', Icon: Atom, color: '#06B6D4' },
  { id: 'quantum_basics', label: 'Кванттық', Icon: Orbit, color: '#10B981' },
  { id: 'nanomaterials', label: 'Наноматериал', Icon: Hexagon, color: '#38BDF8' },
  { id: 'nano_applications', label: 'Қолданыс', Icon: Cpu, color: '#F59E0B' },
]
const TOPIC_LABELS = {
  atomic_structure: 'Атом құрылысы',
  quantum_basics: 'Кванттық физика негіздері',
  nanomaterials: 'Наноматериалдар',
  nano_applications: 'Нанотехнология қолданыстары',
}
const NUMPAD = ['7','8','9','4','5','6','1','2','3','.','0','⌫']

function ResultCard({ result, onNext, hasNext }) {
  const Icon = result.correct ? CheckCircle2 : XCircle
  return (
    <div className={`card p-4 border-2 animate-scale-in ${result.correct ? 'border-success/40' : 'border-danger/40'}`}>
      <div className="text-center mb-3">
        <Icon size={44} strokeWidth={1.5} className={`mx-auto mb-1.5 ${result.correct ? 'text-success' : 'text-danger'}`} />
        <h3 className="text-base font-bold text-text-1">{result.correct ? 'Дұрыс!' : 'Қате'}</h3>
        <p className="text-xs text-text-2 mt-0.5">{result.message}</p>
      </div>
      {result.solution && (
        <div className="bg-surface-2 rounded-xl p-2.5 mb-3 border border-border">
          <p className="text-[10px] text-primary font-semibold mb-0.5">Шешімі:</p>
          <p className="text-xs text-text-2 leading-relaxed break-word"><FormulaRenderer text={result.solution} /></p>
        </div>
      )}
      {hasNext ? (
        <Button onClick={onNext} variant={result.correct ? 'success' : 'secondary'} icon={<ChevronRight size={14} />}>
          Келесі есеп
        </Button>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-success font-semibold">Барлық есептер шешілді!</p>
        </div>
      )}
    </div>
  )
}

export default function Problems() {
  const [level, setLevel] = useState('1')
  const [topic, setTopic] = useState(null)
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [problemIndex, setProblemIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchProblems() }, [level, topic])

  const fetchProblems = async () => {
    setLoading(true); setSelected(null); setResult(null); setAnswer(''); setProblemIndex(0)
    try {
      const params = {}
      if (level) params.difficulty = level
      if (topic) params.topic = topic
      const data = await problemsAPI.getProblems(params)
      setProblems(data)
    } catch { setProblems([]) }
    finally { setLoading(false) }
  }

  const handleSelect = (p, idx) => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(p); setProblemIndex(idx); setAnswer(''); setResult(null) }

  const handleNext = () => {
    const nextIdx = problemIndex + 1
    if (nextIdx < problems.length) {
      setSelected(problems[nextIdx])
      setProblemIndex(nextIdx)
      setAnswer('')
      setResult(null)
      WebApp.HapticFeedback.impactOccurred('light')
    }
  }

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
    const hasNext = problemIndex + 1 < problems.length
    return (
      <div className="h-screen-safe bg-bg page-enter flex flex-col">
        <TopBar showBack onBack={() => { setSelected(null); setResult(null); setAnswer('') }} title={`Есеп ${problemIndex + 1}/${problems.length}`} />
        <div className="flex-1 px-3 pt-1.5 pb-4 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <Card className="p-3.5">
            {lvl && (
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2" style={{ background: `${lvl.color}18`, color: lvl.color }}>
                {lvl.label}-деңгей
              </span>
            )}
            <FormulaRenderer text={selected.question} />
            <QuestionMedia imageUrl={selected.image_url} tableData={selected.table_data} />
            {selected.formula && (
              <div className="formula-block mt-2.5">
                <FormulaRenderer formula={`$$${selected.formula}$$`} glow />
              </div>
            )}
          </Card>

          {result ? (
            <ResultCard result={result} onNext={handleNext} hasNext={hasNext} />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="bg-surface border-2 border-primary/30 rounded-xl px-3 py-3 text-center mb-2 flex items-center justify-center">
                <span className={`text-2xl font-bold tracking-widest ${answer ? 'text-text-1' : 'text-text-3'}`}>{answer || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD.map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    className="bg-surface-2 border border-border rounded-lg py-2.5 flex items-center justify-center text-base font-semibold text-text-1 active:bg-primary/20 active:scale-95 transition-all">
                    {k === '⌫' ? <Delete size={18} strokeWidth={1.5} className="text-text-2" /> : k}
                  </button>
                ))}
              </div>
              <Button className="mt-2" onClick={handleSubmit} disabled={!answer.trim() || submitting}>
                {submitting ? 'Тексерілуде...' : 'Тексеру'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar />
      <div className="px-3 pt-1.5 pb-3">
        <h1 className="text-xl font-extrabold text-text-1 mb-0.5">Есептер</h1>
        <p className="text-xs text-text-2 mb-3">Тақырып пен деңгейді таңдаңыз</p>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
          {TOPICS.map(t => (
            <button key={String(t.id)} onClick={() => { setTopic(t.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`chip flex-shrink-0 border flex items-center gap-1 ${topic === t.id ? 'text-white border-transparent bg-primary' : 'bg-surface text-text-2 border-border'}`}
              style={topic === t.id && t.color ? { background: t.color } : {}}>
              {t.Icon && <t.Icon size={12} strokeWidth={1.5} />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4">
          {LEVELS.map(l => (
            <button key={String(l.id)} onClick={() => { setLevel(l.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`chip flex-shrink-0 border flex items-center gap-1 ${level === l.id ? 'text-white border-transparent' : 'bg-surface text-text-2 border-border'}`}
              style={level === l.id ? { background: l.color } : {}}>
              {l.Icon && <l.Icon size={12} strokeWidth={1.5} />}
              {l.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2.5">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="space-y-2">
            {problems.map((p, idx) => {
              const lvl = LEVELS.find(l => l.id === p.difficulty)
              return (
                <button key={p.id} onClick={() => handleSelect(p, idx)}
                  className="w-full card p-3 text-left pressable"
                  style={{ borderLeft: `3px solid ${lvl?.color || '#06B6D4'}` }}>
                  <div className="text-text-1 text-xs leading-relaxed line-clamp-2 break-word"><FormulaRenderer text={p.question} /></div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-text-3 truncate">{TOPIC_LABELS[p.topic] || p.topic}</span>
                    <ChevronRight size={12} strokeWidth={1.5} className="text-text-3 flex-shrink-0" />
                  </div>
                </button>
              )
            })}
            {problems.length === 0 && (
              <div className="text-center py-12">
                <Target size={40} strokeWidth={1} className="text-text-3 mx-auto mb-2" />
                <p className="text-text-3 text-xs">Есеп табылмады</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
