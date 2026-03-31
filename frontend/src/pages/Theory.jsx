import { useState, useEffect, useRef, useCallback } from 'react'
import WebApp from '@twa-dev/sdk'
import { ChevronRight, ChevronDown, BookOpen, Atom, Orbit, Hexagon, Cpu, CheckCircle2, XCircle, RotateCcw, Zap, FlaskConical } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
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
  { id: 'atomic_structure', label: 'Атом құрылысы', accent: '#06B6D4', preview: 'E_n = -\\frac{13.6}{n^2}' },
  { id: 'quantum_basics', label: 'Кванттық физика негіздері', accent: '#10B981', preview: '\\lambda = \\frac{h}{mv}' },
  { id: 'nanomaterials', label: 'Наноматериалдар', accent: '#38BDF8', preview: 'S/V = 6/d' },
  { id: 'nano_applications', label: 'Нанотехнология қолданыстары', accent: '#F59E0B', preview: 'E = h\\nu - A' },
]

/* ─── Helper: localStorage progress ─── */
function getReadSubtopics(topicId) {
  try {
    const raw = localStorage.getItem(`theory_read_${topicId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function markSubtopicRead(topicId, index) {
  const read = getReadSubtopics(topicId)
  if (!read.includes(index)) {
    read.push(index)
    localStorage.setItem(`theory_read_${topicId}`, JSON.stringify(read))
  }
  return read
}

function getTopicProgress(topicId, total) {
  if (!total) return 0
  return Math.round((getReadSubtopics(topicId).length / total) * 100)
}

/* ─── Mini Quiz (unchanged logic) ─── */
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
      if (isCorrect) { setLocalCorrectCount(prev => prev + 1); WebApp.HapticFeedback.notificationOccurred('success') }
      else { WebApp.HapticFeedback.notificationOccurred('error') }

      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1); setSelectedAnswer(null); setCorrectAnswer(null)
        } else {
          setSubmitting(true)
          theoryAPI.submitQuiz({ telegram_id: user?.id, topic_id: topicId, answers: newAnswers })
            .then(setResult)
            .catch(() => { const c = localCorrectCount + (isCorrect ? 1 : 0); setResult({ correct: c, total: newAnswers.length, percentage: Math.round(c / newAnswers.length * 100), xp_earned: 15, results: [] }) })
            .finally(() => setSubmitting(false))
        }
      }, 1500)
    }).catch(() => {
      WebApp.HapticFeedback.impactOccurred('light')
      setTimeout(() => {
        if (currentIdx < questions.length - 1) { setCurrentIdx(currentIdx + 1); setSelectedAnswer(null); setCorrectAnswer(null) }
        else {
          setSubmitting(true)
          theoryAPI.submitQuiz({ telegram_id: user?.id, topic_id: topicId, answers: newAnswers })
            .then(setResult).catch(() => setResult({ correct: 0, total: newAnswers.length, percentage: 0, xp_earned: 0, results: [] }))
            .finally(() => setSubmitting(false))
        }
      }, 1500)
    })
  }

  const handleRetry = () => {
    setCurrentIdx(0); setSelectedAnswer(null); setAnswers([]); setResult(null); setLoading(true)
    theoryAPI.getQuiz(topicId).then(data => setQuestions(data?.questions || [])).catch(() => {}).finally(() => setLoading(false))
  }

  if (loading) return <div className="space-y-2.5">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
  if (!questions.length) return (
    <Card className="p-5 text-center">
      <BookOpen size={36} strokeWidth={1} className="text-text-3 mx-auto mb-2" />
      <p className="text-text-2 text-xs">Бұл тақырыпқа сұрақтар әлі қосылмаған</p>
    </Card>
  )

  if (result) {
    const passed = result.percentage >= 70
    const wrongResults = (result.results || []).filter(r => !r.correct)
    return (
      <div className="space-y-3 page-enter">
        <Card className="p-4 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center ${passed ? 'bg-success/10' : 'bg-danger/10'}`}>
            {passed ? <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" /> : <XCircle size={28} strokeWidth={1.5} className="text-danger" />}
          </div>
          <h3 className="text-lg font-bold text-text-1 mb-0.5">{passed ? 'Керемет!' : 'Тырысыңыз!'}</h3>
          <p className="text-sm text-text-2 mb-2">{result.correct} / {result.total} дұрыс</p>
          <div className="text-2xl font-extrabold mb-2" style={{ color: passed ? '#10B981' : '#EF4444' }}>{Math.round(result.percentage)}%</div>
          {result.xp_earned > 0 && (
            <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
              <Zap size={11} strokeWidth={2} className="text-primary" /><span className="text-[11px] font-bold text-primary">+{result.xp_earned} XP</span>
            </div>
          )}
        </Card>
        {wrongResults.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-1.5">Қателер</p>
            <div className="space-y-1.5">
              {wrongResults.map((r, i) => { const q = questions.find(q => q.id === r.question_id); return (
                <Card key={i} className="p-3 border-danger/15">
                  <p className="text-xs text-text-1 mb-1"><FormulaRenderer formula={q?.question || ''} /></p>
                  {r.explanation && <p className="text-[11px] text-text-2">{r.explanation}</p>}
                </Card>
              )})}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleRetry} className="flex-1 bg-surface border border-border rounded-xl py-2.5 text-xs font-semibold text-text-1 pressable flex items-center justify-center gap-1.5">
            <RotateCcw size={14} strokeWidth={1.5} /> Қайталау
          </button>
          <button onClick={onBack} className="flex-1 bg-primary rounded-xl py-2.5 text-xs font-semibold text-white pressable flex items-center justify-center gap-1.5">
            <BookOpen size={14} strokeWidth={1.5} /> Теорияға оралу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 page-enter">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">Сұрақ {currentIdx + 1} / {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i < currentIdx ? 'bg-success' : i === currentIdx ? 'bg-primary' : 'bg-surface'}`} />)}
        </div>
      </div>
      <Card className="p-4">
        <p className="text-sm font-medium text-text-1 leading-relaxed"><FormulaRenderer formula={currentQ.question} /></p>
        <QuestionMedia imageUrl={currentQ.image_url} tableData={currentQ.table_data} />
      </Card>
      <div className="space-y-2">
        {currentQ.options.map((opt, i) => {
          let style = 'bg-surface border-border text-text-1', badgeStyle = 'bg-bg text-text-2'
          if (selectedAnswer !== null && correctAnswer !== null) {
            if (i === correctAnswer) { style = 'bg-success/10 border-success text-text-1'; badgeStyle = 'bg-success text-white' }
            else if (i === selectedAnswer) { style = 'bg-danger/10 border-danger text-text-1'; badgeStyle = 'bg-danger text-white' }
          } else if (selectedAnswer === i) { style = 'bg-primary/10 border-primary text-text-1'; badgeStyle = 'bg-primary text-white' }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={selectedAnswer !== null}
              className={`w-full rounded-xl p-3 text-left border transition-all duration-300 ${style} ${selectedAnswer === null ? 'pressable' : ''}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all duration-300 ${badgeStyle}`}>
                  {selectedAnswer !== null && correctAnswer !== null && i === correctAnswer ? '✓' : selectedAnswer !== null && correctAnswer !== null && i === selectedAnswer ? '✕' : String.fromCharCode(65 + i)}
                </div>
                <span className="text-xs"><FormulaRenderer formula={opt} /></span>
              </div>
            </button>
          )
        })}
      </div>
      {submitting && <div className="text-center py-2"><div className="skeleton h-4 w-32 mx-auto rounded" /></div>}
    </div>
  )
}

/* ─── Subtopic Accordion Card ─── */
function SubtopicCard({ sub, index, isOpen, onToggle, accent }) {
  const formulaCount = sub.formulas?.length || 0
  return (
    <div className="rounded-xl border overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        borderColor: isOpen ? `${accent}30` : 'rgba(6,182,212,0.08)',
        background: isOpen ? `${accent}06` : 'transparent',
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'both',
      }}>
      <button onClick={onToggle} className="w-full p-3.5 text-left pressable flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
          style={{ background: `${accent}15`, color: accent }}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-text-1 truncate">{sub.title}</p>
          <p className="text-[10px] text-text-3 mt-0.5">{formulaCount} формула</p>
        </div>
        <ChevronDown size={16} strokeWidth={1.5} className={`text-text-3 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={isOpen ? { color: accent } : {}} />
      </button>

      {isOpen && (
        <div className="px-3.5 pb-4 space-y-3 animate-fade-in">
          <p className="text-[11px] text-text-2 leading-relaxed">{sub.description}</p>
          {sub.formulas?.map((f, fi) => (
            <div key={fi} className="formula-block">
              <p className="text-[10px] font-semibold mb-1.5" style={{ color: accent }}>{f.name}</p>
              <FormulaRenderer formula={`$$${f.latex}$$`} glow />
              <p className="text-[10px] text-text-3 mt-1.5">{f.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Topic Detail Page ─── */
function TopicDetail({ topic, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState(null)
  const [readSet, setReadSet] = useState(() => getReadSubtopics(topic.id))
  const [showQuiz, setShowQuiz] = useState(false)
  const pillsRef = useRef(null)

  useEffect(() => {
    theoryAPI.getTopicDetail(topic.id).then(setContent).catch(() => {}).finally(() => setLoading(false))
  }, [topic.id])

  const subtopics = content?.subtopics || []
  const total = subtopics.length
  const progress = total ? Math.round((readSet.length / total) * 100) : 0

  const handleToggle = useCallback((idx) => {
    WebApp.HapticFeedback.impactOccurred('light')
    if (openIdx === idx) {
      setOpenIdx(null)
    } else {
      setOpenIdx(idx)
      const newRead = markSubtopicRead(topic.id, idx)
      setReadSet([...newRead])
    }
  }, [openIdx, topic.id])

  const scrollToPill = useCallback((idx) => {
    if (pillsRef.current) {
      const pill = pillsRef.current.children[idx]
      if (pill) pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [])

  const handlePillClick = useCallback((idx) => {
    WebApp.HapticFeedback.impactOccurred('light')
    setOpenIdx(idx)
    const newRead = markSubtopicRead(topic.id, idx)
    setReadSet([...newRead])
    // Scroll to the subtopic card
    setTimeout(() => {
      const el = document.getElementById(`subtopic-${idx}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [topic.id])

  useEffect(() => {
    if (openIdx !== null) scrollToPill(openIdx)
  }, [openIdx, scrollToPill])

  if (showQuiz) {
    return (
      <div className="min-h-screen-safe bg-bg page-enter">
        <TopBar showBack onBack={() => setShowQuiz(false)} title="Мини-тест" />
        <div className="px-3 pt-2 pb-6">
          <MiniQuiz topicId={topic.id} onBack={() => setShowQuiz(false)} />
        </div>
      </div>
    )
  }

  const Icon = TOPIC_ICONS[topic.id] || BookOpen

  return (
    <div className="min-h-screen-safe bg-bg bg-grid page-enter">
      <TopBar showBack onBack={onBack} title={topic.label} />

      {/* Hero header */}
      <div className="mx-3 mt-1.5 rounded-2xl p-4 mb-3 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${topic.accent}15 0%, #111B2E 100%)`, border: `1px solid ${topic.accent}20` }}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl" style={{ background: `${topic.accent}15` }} />
        <div className="relative z-10">
          <Icon size={24} strokeWidth={1.5} style={{ color: topic.accent }} className="mb-2" />
          <h1 className="text-lg font-bold text-text-1">{topic.label}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1">
              <ProgressBar value={progress} max={100} color="primary" size="sm" />
            </div>
            <span className="text-[10px] font-mono font-semibold text-text-3 flex-shrink-0">
              {readSet.length}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation pills */}
      {!loading && total > 0 && (
        <div className="px-3 mb-3 sticky top-[44px] z-30 py-1.5"
          style={{ background: 'rgba(10,14,20,0.92)', backdropFilter: 'blur(12px)' }}>
          <div ref={pillsRef} className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {subtopics.map((_, i) => {
              const isActive = openIdx === i
              const isRead = readSet.includes(i)
              return (
                <button key={i} onClick={() => handlePillClick(i)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-200 pressable"
                  style={{
                    background: isActive ? topic.accent : isRead ? `${topic.accent}18` : 'rgba(6,182,212,0.06)',
                    color: isActive ? '#fff' : isRead ? topic.accent : '#4A5B70',
                    border: `1px solid ${isActive ? topic.accent : isRead ? `${topic.accent}25` : 'rgba(6,182,212,0.08)'}`,
                  }}>
                  {isRead && !isActive ? '✓' : i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-3 pb-6">
        {loading ? (
          <div className="space-y-2.5">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="space-y-2">
            {subtopics.map((sub, i) => (
              <div key={i} id={`subtopic-${i}`}>
                <SubtopicCard
                  sub={sub}
                  index={i}
                  isOpen={openIdx === i}
                  onToggle={() => handleToggle(i)}
                  accent={topic.accent}
                />
              </div>
            ))}

            {/* Mini-test button */}
            <button onClick={() => { WebApp.HapticFeedback.impactOccurred('medium'); setShowQuiz(true) }}
              className="w-full mt-4 rounded-xl p-3.5 pressable flex items-center justify-center gap-2 shadow-glow-primary"
              style={{ background: `linear-gradient(135deg, ${topic.accent} 0%, ${topic.accent}cc 100%)` }}>
              <FlaskConical size={16} strokeWidth={2} className="text-white" />
              <span className="text-sm font-bold text-white">Мини-тест · 5 сұрақ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Topic List (main screen) ─── */
export default function Theory() {
  const [selected, setSelected] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const topicId = params.get('topic')
    return topicId ? TOPICS.find(t => t.id === topicId) || null : null
  })
  const [subtopicCounts, setSubtopicCounts] = useState({})

  // Fetch subtopic counts for progress display
  useEffect(() => {
    TOPICS.forEach(t => {
      theoryAPI.getTopicDetail(t.id).then(data => {
        const count = data?.subtopics?.length || 0
        setSubtopicCounts(prev => ({ ...prev, [t.id]: count }))
      }).catch(() => {})
    })
  }, [])

  if (selected) return <TopicDetail topic={selected} onBack={() => setSelected(null)} />

  return (
    <div className="min-h-screen-safe bg-bg bg-grid page-enter">
      <TopBar />
      <div className="px-3 pt-2 pb-3">
        <h1 className="text-xl font-extrabold text-text-1 mb-0.5">Теория</h1>
        <p className="text-xs text-text-2 mb-4">Тақырыпты таңдаңыз</p>

        <div className="space-y-2.5">
          {TOPICS.map((topic, idx) => {
            const Icon = TOPIC_ICONS[topic.id] || BookOpen
            const total = subtopicCounts[topic.id] || 0
            const readCount = getReadSubtopics(topic.id).length
            const progress = total ? Math.round((readCount / total) * 100) : 0

            return (
              <button key={topic.id} onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(topic) }}
                className="w-full pressable text-left animate-slide-up"
                style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: 'both' }}>
                <div className="rounded-xl p-3.5 border shadow-card"
                  style={{ background: `linear-gradient(135deg, ${topic.accent}08 0%, #111B2E 100%)`, borderColor: `${topic.accent}15`, borderLeft: `3px solid ${topic.accent}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${topic.accent}12` }}>
                      <Icon size={20} strokeWidth={1.5} style={{ color: topic.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text-1 text-[13px] mb-0.5 truncate">{topic.label}</div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-text-3 font-mono">
                          {total > 0 ? `${readCount}/${total} тақырыпша` : '...'}
                        </span>
                        {progress > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${topic.accent}15`, color: topic.accent }}>
                            {progress}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70">
                        <FormulaRenderer formula={`$${topic.preview}$`} inline />
                      </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.5} style={{ color: topic.accent }} className="flex-shrink-0 opacity-50" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
