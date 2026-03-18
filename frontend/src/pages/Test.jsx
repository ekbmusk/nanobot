import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import confetti from 'canvas-confetti'
import { Trophy, RotateCcw, Home, ChevronRight, Lightbulb, BookOpen, Shuffle, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import Button from '../components/Button'
import { SkeletonCard } from '../components/SkeletonLoader'
import FormulaRenderer from '../components/FormulaRenderer'
import XPAnimation from '../components/XPAnimation'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'

const TIMER = 20

const TOPIC_ICONS = {
  mechanics: '⚙️',
  thermodynamics: '🌡️',
  electromagnetism: '⚡',
  optics: '🔭',
  quantum: '⚛️',
  nuclear: '☢️',
}

function TimerCircle({ seconds }) {
  const r = 22, c = 2 * Math.PI * r
  const color = seconds <= 5 ? '#FF6B6B' : seconds <= 10 ? '#FFD93D' : '#43E97B'
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#1A1A2E" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${c * (seconds / TIMER)} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>{seconds}</span>
    </div>
  )
}

function ResultScreen({ score, total, pct, xpEarned, bonusXp, isDaily, onRetry, onHome }) {
  const passed = pct >= 70
  const [showXP, setShowXP] = useState(xpEarned > 0)

  useEffect(() => {
    if (passed) confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#43E97B', '#FF6584', '#FFD93D'] })
  }, [passed])

  const r = 60, circ = 2 * Math.PI * r
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 page-enter">
      {showXP && (
        <XPAnimation xp={xpEarned} bonusXp={bonusXp} onDone={() => setShowXP(false)} />
      )}
      <Trophy size={64} strokeWidth={1} className={`mb-4 ${passed ? 'text-warning' : 'text-text-3'}`} />
      <h2 className="text-3xl font-extrabold text-text-1 mb-1">{passed ? 'Керемет!' : 'Тырысыңыз!'}</h2>
      <p className="text-text-2 mb-3">{score} / {total} дұрыс жауап</p>
      {xpEarned > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            <Zap size={13} strokeWidth={2} className="text-primary" />
            <span className="text-xs font-bold text-primary">+{xpEarned} XP</span>
          </div>
          {bonusXp > 0 && (
            <div className="flex items-center gap-1.5 bg-warning/10 border border-warning/20 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-warning">+{bonusXp} бонус 🔥</span>
            </div>
          )}
        </div>
      )}
      <div className="relative w-36 h-36 mx-auto mb-8">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={r} fill="none" stroke="#1A1A2E" strokeWidth="8" />
          <circle cx="72" cy="72" r={r} fill="none" stroke={passed ? '#43E97B' : '#FF6584'} strokeWidth="8"
            strokeDasharray={`${circ * (pct / 100)} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${passed ? 'text-success' : 'text-secondary'}`}>{pct}%</span>
        </div>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        {!isDaily && <Button variant="secondary" onClick={onRetry} icon={<RotateCcw size={16} />}>Қайтару</Button>}
        <Button onClick={onHome} icon={<Home size={16} />}>Басты бет</Button>
      </div>
    </div>
  )
}

function TopicSelect({ topics, loading, onSelect }) {
  if (loading) return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-4 space-y-3">
        {[0,1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-4 pb-6">
        <h2 className="text-lg font-bold text-text-1 mb-1">Тест тақырыбын таңда</h2>
        <p className="text-sm text-text-3 mb-4">Немесе барлық сұрақтардан кездейсоқ тест</p>

        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center gap-4 bg-gradient-primary rounded-2xl px-4 py-4 mb-4 pressable shadow-glow-primary"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
            <Shuffle size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Аралас тест</p>
            <p className="text-xs text-white/70">Барлық тақырыптардан кездейсоқ</p>
          </div>
          <ChevronRight size={18} className="text-white/70 ml-auto" />
        </button>

        <div className="space-y-2.5">
          {topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className="w-full flex items-center gap-4 bg-surface border border-border rounded-2xl px-4 py-4 pressable"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                {TOPIC_ICONS[topic.id] || <BookOpen size={20} className="text-primary" />}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-text-1">{topic.name}</p>
                <p className="text-xs text-text-3">{topic.count} сұрақ</p>
              </div>
              <ChevronRight size={18} className="text-text-3" />
            </button>
          ))}
        </div>

        {topics.length === 0 && (
          <p className="text-center text-text-3 text-sm mt-8">Тест сұрақтары жоқ</p>
        )}
      </div>
    </div>
  )
}

export default function Test() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDaily = searchParams.get('mode') === 'daily'
  const { user, setUser } = useUserStore()

  const [topics, setTopics] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(isDaily ? null : undefined)

  const [qs, setQs] = useState([])
  const [cur, setCur] = useState(0)
  const [sel, setSel] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(null)
  const [timer, setTimer] = useState(TIMER)
  const timerRef = useRef(null)

  useEffect(() => {
    testsAPI.getTopics()
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false))
  }, [])

  const load = useCallback(async (topic) => {
    setLoading(true); setCur(0); setAnswers([]); setSel(null); setDone(false); setScore(null); setTimer(TIMER)
    try {
      const d = isDaily
        ? await testsAPI.getDailyTest()
        : await testsAPI.getTest(topic ? { topic, count: 10 } : { count: 10 })
      setQs(d.questions)
    } catch { setQs([]) }
    finally { setLoading(false) }
  }, [isDaily])

  useEffect(() => {
    if (isDaily) load(null)
  }, [isDaily])

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId)
    load(topicId)
  }

  const handleRetry = () => {
    load(selectedTopic)
  }

  const handleBackToTopics = () => {
    if (isDaily) { navigate('/'); return }
    setSelectedTopic(undefined)
    setDone(false)
    setScore(null)
  }

  useEffect(() => {
    if (loading || done || sel !== null || selectedTopic === undefined) return
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); setSel(-1); WebApp.HapticFeedback.notificationOccurred('warning'); return TIMER }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [cur, loading, done, sel, selectedTopic])

  const handleAnswer = (i) => {
    if (sel !== null) return
    clearInterval(timerRef.current); setSel(i); WebApp.HapticFeedback.impactOccurred('light')
  }

  const handleNext = async () => {
    const newAns = [...answers, { question_id: qs[cur].id, answer: sel ?? -1 }]
    setAnswers(newAns)
    if (cur + 1 < qs.length) { setCur(c => c + 1); setSel(null); setTimer(TIMER) }
    else {
      try {
        const r = await testsAPI.submitTest({ telegram_id: user?.id, answers: newAns, is_daily: isDaily })
        setScore(r); WebApp.HapticFeedback.notificationOccurred(r.percentage >= 70 ? 'success' : 'warning')
        if (user && (r.xp_earned || r.bonus_xp)) {
          setUser({ ...user, score: (user.score || 0) + (r.xp_earned || 0) + (r.bonus_xp || 0) })
        }
      } catch { setScore({ correct: newAns.length, total: qs.length, percentage: 0, xp_earned: 0, bonus_xp: 0 }) }
      setDone(true)
    }
  }

  // Topic selection screen
  if (selectedTopic === undefined) {
    return <TopicSelect topics={topics} loading={topicsLoading} onSelect={handleTopicSelect} />
  }

  if (loading) return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-2 space-y-4">
        <SkeletonCard lines={2} />
        {[0,1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}
      </div>
    </div>
  )

  if (done && score) return (
    <ResultScreen
      score={score.correct}
      total={score.total}
      pct={Math.round(score.percentage)}
      xpEarned={score.xp_earned || 0}
      bonusXp={score.bonus_xp || 0}
      isDaily={isDaily}
      onRetry={handleRetry}
      onHome={handleBackToTopics}
    />
  )

  const q = qs[cur]
  if (!q) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <p className="text-text-2 text-sm mb-4">Сұрақтар жүктелмеді. Қайтадан көріңіз.</p>
      <Button variant="secondary" onClick={handleBackToTopics}>Артқа</Button>
    </div>
  )

  const topicName = selectedTopic
    ? (topics.find(t => t.id === selectedTopic)?.name ?? selectedTopic)
    : 'Аралас тест'

  return (
    <div className="min-h-screen bg-bg flex flex-col page-enter">
      <TopBar />
      <div className="flex-1 px-4 pt-3 pb-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="text-xs text-text-2 mb-0.5">{topicName}</p>
            <p className="text-xs text-text-3 mb-1.5">Сұрақ {cur + 1} / {qs.length}</p>
            <ProgressBar value={cur + 1} max={qs.length} color="primary" size="lg" />
          </div>
          <TimerCircle seconds={timer} />
        </div>

        <div className="card p-5 mb-4 flex-shrink-0 animate-slide-up">
          <FormulaRenderer text={q.question} />
        </div>

        <div className="space-y-2.5 flex-1">
          {q.options.map((opt, i) => {
            let cls = 'border-border text-text-1 bg-surface'
            if (sel !== null) {
              if (i === q.correct_answer) cls = 'border-success bg-success/10 text-success'
              else if (i === sel) cls = 'border-danger bg-danger/10 text-danger'
              else cls = 'border-border text-text-3 bg-surface opacity-60'
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                className={`w-full text-left px-4 py-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium flex items-center gap-3 ${cls} ${sel === null ? 'pressable' : ''}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  sel === null ? 'bg-surface-2 text-text-2' : i === q.correct_answer ? 'bg-success text-bg' : i === sel ? 'bg-danger text-white' : 'bg-surface-2 text-text-3'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span><FormulaRenderer text={opt} /></span>
              </button>
            )
          })}
        </div>

        {sel !== null && (
          <div className="mt-4 animate-slide-up">
            {q.explanation && (
              <div className="bg-primary-dim border border-primary/20 rounded-2xl p-3 mb-3 flex gap-2.5">
                <Lightbulb size={16} strokeWidth={1.5} className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-2">{q.explanation}</p>
              </div>
            )}
            <Button onClick={handleNext} icon={<ChevronRight size={16} />}>
              {cur + 1 < qs.length ? 'Келесі' : 'Аяқтау'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
