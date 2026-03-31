import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { ChevronRight, BookOpen, Atom, Orbit, Hexagon, Cpu, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import FormulaRenderer from '../components/FormulaRenderer'
import QuestionMedia from '../components/QuestionMedia'
import { SkeletonCard } from '../components/SkeletonLoader'
import { theoryAPI } from '../api/theory'
import { useUserStore } from '../store/userStore'

const TOPIC_ICONS = {
  atomic_structure: Atom,
  quantum_basics: Orbit,
  nanomaterials: Hexagon,
  nano_applications: Cpu,
}

const TOPICS = [
  { id: 'atomic_structure', label: 'Атом құрылысы', accent: '#06B6D4', lessons: 10, preview: 'E_n = -\\frac{13.6}{n^2}' },
  { id: 'quantum_basics', label: 'Кванттық физика негіздері', accent: '#10B981', lessons: 10, preview: '\\lambda = \\frac{h}{mv}' },
  { id: 'nanomaterials', label: 'Наноматериалдар', accent: '#38BDF8', lessons: 8, preview: 'S/V = 6/d' },
  { id: 'nano_applications', label: 'Нанотехнология қолданыстары', accent: '#F59E0B', lessons: 8, preview: 'E = h\\nu - A' },
]
const TABS = ['Түсіндірме', 'Формулалар', 'Мини-тест']

function MiniQuiz({ topicId, onBack }) {
  const { user } = useUserStore()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswer, setCorrectAnswer] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [localCorrectCount, setLocalCorrectCount] = useState(0)

  useEffect(() => {
    theoryAPI.getQuiz(topicId).then(data => {
      setQuestions(data?.questions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [topicId])

  const currentQ = questions[currentIdx]

  const handleSelect = (idx) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)

    const newAnswers = [...answers, { question_id: currentQ.id, answer: idx }]
    setAnswers(newAnswers)

    // Check answer immediately (no XP/mastery update)
    theoryAPI.submitQuiz({
      telegram_id: user?.id,
      topic_id: topicId,
      answers: [{ question_id: currentQ.id, answer: idx }],
      check_only: true,
    }).then(res => {
      const qResult = res?.results?.[0]
      const correctIdx = qResult?.correct_answer ?? null
      const isCorrect = qResult?.correct ?? false
      setCorrectAnswer(correctIdx)

      if (isCorrect) {
        setLocalCorrectCount(prev => prev + 1)
        WebApp.HapticFeedback.notificationOccurred('success')
      } else {
        WebApp.HapticFeedback.notificationOccurred('error')
      }

      // Auto-advance after 1.5s
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1)
          setSelectedAnswer(null)
          setCorrectAnswer(null)
        } else {
          // Final result — submit all answers together for proper XP/mastery
          setSubmitting(true)
          theoryAPI.submitQuiz({
            telegram_id: user?.id,
            topic_id: topicId,
            answers: newAnswers,
          }).then(setResult).catch(() => {
            const total = newAnswers.length
            const correct = localCorrectCount + (isCorrect ? 1 : 0)
            setResult({ correct, total, percentage: Math.round(correct / total * 100), xp_earned: 15, results: [] })
          }).finally(() => setSubmitting(false))
        }
      }, 1500)
    }).catch(() => {
      // If check fails, just highlight selection and move on
      WebApp.HapticFeedback.impactOccurred('light')
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1)
          setSelectedAnswer(null)
          setCorrectAnswer(null)
        } else {
          setSubmitting(true)
          theoryAPI.submitQuiz({
            telegram_id: user?.id,
            topic_id: topicId,
            answers: newAnswers,
          }).then(setResult).catch(() => {
            setResult({ correct: 0, total: newAnswers.length, percentage: 0, xp_earned: 0, results: [] })
          }).finally(() => setSubmitting(false))
        }
      }, 1500)
    })
  }

  const handleRetry = () => {
    setCurrentIdx(0)
    setSelectedAnswer(null)
    setAnswers([])
    setResult(null)
    setLoading(true)
    theoryAPI.getQuiz(topicId).then(data => {
      setQuestions(data?.questions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  if (loading) return <div className="space-y-2.5 px-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>

  if (!questions.length) return (
    <Card className="p-5 text-center">
      <BookOpen size={36} strokeWidth={1} className="text-text-3 mx-auto mb-2" />
      <p className="text-text-2 text-xs">Бұл тақырыпқа сұрақтар әлі қосылмаған</p>
    </Card>
  )

  // Result screen
  if (result) {
    const passed = result.percentage >= 70
    const wrongResults = (result.results || []).filter(r => !r.correct)

    return (
      <div className="space-y-3 page-enter">
        <Card className="p-4 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
            {passed
              ? <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
              : <XCircle size={28} strokeWidth={1.5} className="text-error" />
            }
          </div>
          <h3 className="text-lg font-bold text-text-1 mb-0.5">{passed ? 'Керемет!' : 'Тырысыңыз!'}</h3>
          <p className="text-sm text-text-2 mb-2">{result.correct} / {result.total} дұрыс</p>
          <div className="text-2xl font-extrabold mb-2" style={{ color: passed ? '#10B981' : '#EF4444' }}>
            {Math.round(result.percentage)}%
          </div>
          {result.xp_earned > 0 && (
            <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
              <Zap size={11} strokeWidth={2} className="text-primary" />
              <span className="text-[11px] font-bold text-primary">+{result.xp_earned} XP</span>
            </div>
          )}
        </Card>

        {wrongResults.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-1.5">Қателер</p>
            <div className="space-y-1.5">
              {wrongResults.map((r, i) => {
                const q = questions.find(q => q.id === r.question_id)
                return (
                  <Card key={i} className="p-3 border-error/15">
                    <p className="text-xs text-text-1 mb-1"><FormulaRenderer formula={q?.question || ''} /></p>
                    {r.explanation && <p className="text-[11px] text-text-2">{r.explanation}</p>}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleRetry}
            className="flex-1 bg-surface border border-border rounded-xl py-2.5 text-xs font-semibold text-text-1 pressable flex items-center justify-center gap-1.5">
            <RotateCcw size={14} strokeWidth={1.5} />
            Қайталау
          </button>
          <button onClick={onBack}
            className="flex-1 bg-primary rounded-xl py-2.5 text-xs font-semibold text-white pressable flex items-center justify-center gap-1.5">
            <BookOpen size={14} strokeWidth={1.5} />
            Теорияға оралу
          </button>
        </div>
      </div>
    )
  }

  // Question screen
  return (
    <div className="space-y-3 page-enter">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">
          Сұрақ {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < currentIdx ? 'bg-success' : i === currentIdx ? 'bg-primary' : 'bg-surface'}`} />
          ))}
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm font-medium text-text-1 leading-relaxed">
          <FormulaRenderer formula={currentQ.question} />
        </p>
        <QuestionMedia imageUrl={currentQ.image_url} tableData={currentQ.table_data} />
      </Card>

      <div className="space-y-2">
        {currentQ.options.map((opt, i) => {
          let style = 'bg-surface border-border text-text-1'
          let badgeStyle = 'bg-bg text-text-2'
          if (selectedAnswer !== null && correctAnswer !== null) {
            if (i === correctAnswer) {
              style = 'bg-success/10 border-success text-text-1'
              badgeStyle = 'bg-success text-white'
            } else if (i === selectedAnswer && i !== correctAnswer) {
              style = 'bg-error/10 border-error text-text-1'
              badgeStyle = 'bg-error text-white'
            }
          } else if (selectedAnswer === i && correctAnswer === null) {
            style = 'bg-primary/10 border-primary text-text-1'
            badgeStyle = 'bg-primary text-white'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selectedAnswer !== null}
              className={`w-full rounded-xl p-3 text-left border transition-all duration-300 ${style} ${selectedAnswer === null ? 'pressable' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all duration-300 ${badgeStyle}`}>
                  {selectedAnswer !== null && correctAnswer !== null && i === correctAnswer
                    ? '✓'
                    : selectedAnswer !== null && correctAnswer !== null && i === selectedAnswer && i !== correctAnswer
                    ? '✕'
                    : String.fromCharCode(65 + i)
                  }
                </div>
                <span className="text-xs"><FormulaRenderer formula={opt} /></span>
              </div>
            </button>
          )
        })}
      </div>

      {submitting && (
        <div className="text-center py-2">
          <div className="skeleton h-4 w-32 mx-auto rounded" />
        </div>
      )}
    </div>
  )
}

function TopicDetail({ topic, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    theoryAPI.getTopicDetail(topic.id).then(setContent).catch(() => {}).finally(() => setLoading(false))
  }, [topic.id])

  const formulas = content?.subtopics?.flatMap(s => s.formulas || []) || []

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar showBack onBack={onBack} title={topic.label} />
      <div className="mx-3 mt-1.5 rounded-2xl p-4 mb-3" style={{ background: `linear-gradient(135deg, ${topic.accent}20 0%, #1A1A2E 100%)`, border: `1px solid ${topic.accent}25` }}>
        {(() => { const Icon = TOPIC_ICONS[topic.id] || BookOpen; return <Icon size={28} strokeWidth={1.5} style={{ color: topic.accent }} className="mb-1.5" /> })()}
        <h1 className="text-lg font-bold text-text-1">{topic.label}</h1>
        <p className="text-xs text-text-2 mt-0.5">{topic.lessons} сабақ</p>
      </div>

      <div className="flex gap-1 px-3 mb-3">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${i === tab ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface text-text-2 border border-border'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-3 pb-6">
        {loading ? (
          <div className="space-y-2.5">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : tab === 0 ? (
          <div className="space-y-2.5">
            {content?.subtopics?.map((sub, i) => (
              <Card key={i} className="p-3.5">
                <h3 className="font-bold text-text-1 text-sm mb-1.5">{sub.title}</h3>
                <p className="text-xs text-text-2 leading-relaxed break-word">{sub.description}</p>
              </Card>
            ))}
          </div>
        ) : tab === 1 ? (
          <div className="space-y-2.5">
            {formulas.map((f, i) => (
              <div key={i} className="formula-block">
                <p className="text-[11px] text-primary font-semibold mb-1.5">{f.name}</p>
                <FormulaRenderer formula={`$$${f.latex}$$`} glow />
                <p className="text-[11px] text-text-2 mt-1.5 break-word">{f.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <MiniQuiz topicId={topic.id} onBack={() => setTab(0)} />
        )}
      </div>
    </div>
  )
}

export default function Theory() {
  const [selected, setSelected] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const topicId = params.get('topic')
    return topicId ? TOPICS.find(t => t.id === topicId) || null : null
  })

  if (selected) return <TopicDetail topic={selected} onBack={() => setSelected(null)} />

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar />
      <div className="px-3 pt-1.5 pb-3">
        <h1 className="text-xl font-extrabold text-text-1 mb-0.5">Теория</h1>
        <p className="text-xs text-text-2 mb-4">Тақырыпты таңдаңыз</p>

        <div className="space-y-2.5">
          {TOPICS.map((topic) => (
            <button key={topic.id} onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(topic) }}
              className="w-full pressable text-left">
              <div className="rounded-xl p-3.5 border shadow-card" style={{ background: `linear-gradient(135deg, ${topic.accent}12 0%, #1A1A2E 100%)`, borderColor: `${topic.accent}25`, borderLeft: `3px solid ${topic.accent}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${topic.accent}18` }}>
                    {(() => { const Icon = TOPIC_ICONS[topic.id] || BookOpen; return <Icon size={18} strokeWidth={1.5} style={{ color: topic.accent }} /> })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-text-1 text-xs mb-0.5 truncate">{topic.label}</div>
                    <div className="text-[10px] text-text-3 mb-1.5">{topic.lessons} сабақ</div>
                    <div className="text-xs">
                      <FormulaRenderer formula={`$${topic.preview}$`} inline />
                    </div>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} style={{ color: topic.accent }} className="flex-shrink-0" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
