import { useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import {
  BookOpen, Brain, Bot, Calculator, Trophy,
  CheckCircle2, Flame, Star, Zap, MessageCircle,
  BarChart2, ChevronRight, Sparkles, Atom,
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import Button from '../components/Button'

const LEVELS = [
  { id: 'easy',   emoji: '🟢', title: 'Бастауыш',  desc: 'Физиканы жаңа бастадым',      sub: '7–8 сынып деңгейі',     color: '#43E97B' },
  { id: 'medium', emoji: '🟡', title: 'Орташа',     desc: 'Негіздерді білемін',           sub: '9–10 сынып деңгейі',    color: '#FFD93D' },
  { id: 'hard',   emoji: '🔴', title: 'Жоғары',     desc: 'ЕНТ-ге дайындалып жатырмын',  sub: '11 сынып / олимпиада',  color: '#FF6584' },
]

const FEATURES = [
  {
    Icon: BookOpen,
    title: 'Теория',
    tag: 'Оқу',
    desc: 'Механика, оптика, термодинамика және т.б. — формулалар мен түсіндірмелер қазақ тілінде.',
    color: '#6C63FF',
    bg: 'rgba(108,99,255,0.12)',
    hint: 'Теория бөліміне өтіп тақырып таңда',
  },
  {
    Icon: Calculator,
    title: 'Есептер',
    tag: 'Тәжірибе',
    desc: 'Жеңілден күрделіге дейін есептер. Шешімді қадам-қадам тексер.',
    color: '#FF6584',
    bg: 'rgba(255,101,132,0.12)',
    hint: 'Есептер бөлімінде деңгейін таңда',
  },
  {
    Icon: Brain,
    title: 'Тест',
    tag: 'Тексеру',
    desc: '10 сұрақтан тұратын тест. Таймер бар, дұрыс жауапты бірден көресің.',
    color: '#43E97B',
    bg: 'rgba(67,233,123,0.12)',
    hint: 'Тест бөлімінде тақырып немесе аралас таңда',
  },
  {
    Icon: Flame,
    title: 'Күнделікті сынақ',
    tag: 'Бонус',
    desc: 'Күн сайын жаңа тест — аяқтасаң +50 бонус XP аласың!',
    color: '#FFD93D',
    bg: 'rgba(255,211,61,0.12)',
    hint: 'Басты бетте "Күнделікті сынақ" картасын тап',
  },
  {
    Icon: MessageCircle,
    title: 'AI Репетитор',
    tag: 'Жасанды ақыл',
    desc: 'Кез келген физика сұрағын жаз — AI формулалармен қазақша жауап береді.',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.12)',
    hint: 'AI бөлімінде сұрағыңды теру арқылы бастаңыз',
  },
  {
    Icon: Trophy,
    title: 'Рейтинг',
    tag: 'Жарыс',
    desc: 'Барлық оқушылардың ішінде өз орныңды тап. XP жинап алдыңғы қатарға шық!',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.12)',
    hint: 'Рейтинг бөлімінде кестені қара',
  },
  {
    Icon: BarChart2,
    title: 'Прогресс',
    tag: 'Статистика',
    desc: 'Тақырыптар бойынша үлгерімің, streak жолағы және соңғы нәтижелер.',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    hint: 'Прогресс бөлімінде жетістіктеріңді тексер',
  },
]

function Dots({ total, current, onClick }) {
  return (
    <div className="flex justify-center items-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => i <= current && onClick(i)}
          className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-7 h-2.5 bg-primary shadow-glow-primary' : i < current ? 'w-2.5 h-2.5 bg-primary/50' : 'w-2.5 h-2.5 bg-border'
          }`} />
      ))}
    </div>
  )
}

/* ─── Screen 0: Welcome ─── */
function Screen0({ onNext, onSkip }) {
  return (
    <div className="flex flex-col h-full px-5">
      <div className="flex justify-end pt-4">
        <button onClick={onSkip} className="text-xs text-text-3 bg-surface border border-border rounded-full px-3 py-1.5 pressable">
          Өткізу
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          {/* Orbits */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin" style={{ animationDuration: '10s' }} />
          <div className="absolute inset-6 rounded-full border border-secondary/20 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          <div className="absolute inset-12 rounded-full border border-success/20 animate-spin" style={{ animationDuration: '4s' }} />
          {/* Electrons */}
          {[0, 1, 2].map(i => (
            <div key={i} className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${i * 120}deg)` }}>
              <div className="w-3 h-3 rounded-full mt-1 shadow-glow-primary"
                style={{ background: ['#6C63FF','#FF6584','#43E97B'][i], boxShadow: `0 0 8px ${['#6C63FF','#FF6584','#43E97B'][i]}` }} />
            </div>
          ))}
          <Atom size={56} strokeWidth={1.2} className="z-10 text-primary drop-shadow-[0_0_12px_rgba(108,99,255,0.7)]" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Tonybot Physics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text-1 text-center mb-3 leading-tight">
          Физиканы<br />оңай үйрен!
        </h1>
        <p className="text-sm text-text-2 text-center leading-relaxed mb-8 max-w-xs">
          Теория, есептер, тесттер және AI репетитор —<br />барлығы қазақ тілінде, бір жерде
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: '📚', text: '6 тақырып' },
            { icon: '🧠', text: 'AI репетитор' },
            { icon: '🏆', text: 'Рейтинг' },
            { icon: '🔥', text: 'Streak' },
            { icon: '⚡', text: 'XP жүйесі' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5">
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-text-2 font-medium">{text}</span>
            </div>
          ))}
        </div>

        <button onClick={onNext}
          className="w-full max-w-xs flex items-center justify-center gap-2 bg-gradient-primary rounded-2xl py-4 font-bold text-white shadow-glow-primary pressable">
          Бастайық
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

/* ─── Screen 1: Features ─── */
function Screen1({ onNext, onSkip }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 px-5 mb-3 flex-shrink-0">
        <h1 className="text-xl font-extrabold text-text-1">Не істей аласың?</h1>
        <button onClick={onSkip} className="text-xs text-text-3 pressable underline underline-offset-2">
          өткізу
        </button>
      </div>

      {/* Scrollable feature list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-2.5 pb-2">
        {FEATURES.map((feat, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl p-4 border animate-slide-up"
            style={{
              background: feat.bg,
              borderColor: feat.color + '35',
              animationDelay: `${i * 0.07}s`,
              animationFillMode: 'both',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: feat.color + '22', border: `1.5px solid ${feat.color}45` }}
            >
              <feat.Icon size={20} strokeWidth={1.5} style={{ color: feat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-text-1">{feat.title}</span>
                <span
                  className="text-[9px] font-bold rounded-full px-2 py-0.5 flex-shrink-0"
                  style={{ background: feat.color + '22', color: feat.color }}
                >
                  {feat.tag}
                </span>
              </div>
              <p className="text-xs text-text-2 leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Келесі */}
      <div className="px-5 pt-3 pb-2 flex-shrink-0 flex items-center justify-between">
        <p className="text-[11px] text-text-3">Барлық мүмкіндіктермен таныстың!</p>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white pressable"
          style={{ background: 'rgba(108,99,255,0.85)' }}
        >
          Келесі <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

/* ─── Screen 2: Level ─── */
function Screen2({ selectedLevel, onSelect, onStart }) {
  return (
    <div className="flex flex-col h-full px-5">
      <div className="pt-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Star size={16} strokeWidth={1.5} className="text-warning" />
          <span className="text-xs font-semibold text-warning uppercase tracking-widest">Соңғы қадам</span>
        </div>
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Деңгейіңді таңда</h1>
        <p className="text-sm text-text-2">Есептер қиындығы осыған байланысты</p>
      </div>

      <div className="flex-1 space-y-3">
        {LEVELS.map((lvl) => {
          const sel = selectedLevel === lvl.id
          return (
            <button key={lvl.id} onClick={() => {
              onSelect(lvl.id)
              WebApp.HapticFeedback.impactOccurred('medium')
            }}
              className="w-full text-left rounded-2xl p-4 border-2 transition-all duration-200 pressable"
              style={{
                borderColor: sel ? lvl.color : 'rgba(255,255,255,0.08)',
                background: sel ? lvl.color + '12' : 'rgba(255,255,255,0.03)',
              }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: lvl.color + '18', border: `1.5px solid ${lvl.color}40` }}>
                  {lvl.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-text-1 mb-0.5">{lvl.title}</div>
                  <div className="text-sm text-text-2">{lvl.desc}</div>
                  <div className="text-xs mt-1" style={{ color: lvl.color + 'bb' }}>{lvl.sub}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200`}
                  style={{ borderColor: sel ? lvl.color : '#333', background: sel ? lvl.color : 'transparent' }}>
                  {sel && <CheckCircle2 size={14} strokeWidth={2.5} className="text-white" />}
                </div>
              </div>
            </button>
          )
        })}

        <p className="text-xs text-text-3 text-center pt-1">Деңгейді кейін өзгертуге болады ⚙️</p>
      </div>

      <button onClick={onStart} disabled={!selectedLevel}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white mt-4 mb-2 transition-all duration-200 ${
          selectedLevel ? 'bg-gradient-primary shadow-glow-primary pressable' : 'bg-surface text-text-3 cursor-not-allowed'
        }`}>
        🚀 Қолданбаны ашу!
      </button>
    </div>
  )
}

/* ─── Root ─── */
export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const { user } = useUserStore()
  const touchStartX = useRef(null)

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50 && screen < 2) setScreen(s => s + 1)
    if (delta < -50 && screen > 0) setScreen(s => s - 1)
    touchStartX.current = null
  }

  const handleStart = async () => {
    if (!selectedLevel) return
    if (user?.id) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api'
        await fetch(`${apiUrl}/users/level`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: user.id, level: selectedLevel }),
        })
      } catch {}
    }
    WebApp.HapticFeedback.notificationOccurred('success')
    localStorage.setItem('onboarding_completed', 'true')
    onComplete()
  }

  const SKIP = () => setScreen(2)

  const screens = [
    <Screen0 onNext={() => setScreen(1)} onSkip={SKIP} />,
    <Screen1 onNext={() => setScreen(2)} onSkip={SKIP} />,
    <Screen2 selectedLevel={selectedLevel} onSelect={setSelectedLevel} onStart={handleStart} />,
  ]

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Progress bar at top */}
      <div className="h-0.5 bg-border">
        <div className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((screen + 1) / 3) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-hidden">
        {screens[screen]}
      </div>

      <Dots total={3} current={screen} onClick={setScreen} />
    </div>
  )
}
