import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { BookOpen, Calculator, Brain, Trophy, BarChart2, HelpCircle, Flame, CheckCircle2, ChevronRight, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import { progressAPI } from '../api/progress'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'

const MENU = [
  { Icon: BookOpen, title: 'Теория', subtitle: 'Физика заңдары мен формулалар', path: '/theory', accent: '#6C63FF' },
  { Icon: Calculator, title: 'Есептер', subtitle: 'Деңгейлер бойынша есептер', path: '/problems', accent: '#FF6584' },
  { Icon: Brain, title: 'Тест', subtitle: 'Білімді 10 сұрақпен тексер', path: '/test', accent: '#43E97B' },
  { Icon: Trophy, title: 'Рейтинг', subtitle: 'Үздік оқушылар кестесі', path: '/rating', accent: '#FFD93D' },
  { Icon: BarChart2, title: 'Прогресс', subtitle: 'Тақырыптар бойынша үлгерім', path: '/progress', accent: '#38BDF8' },
  { Icon: HelpCircle, title: 'Көмек', subtitle: 'Қолданба нұсқаулығы', path: '/help', accent: '#8B8FA8' },
]

const MOTIVATIONS = [
  'Бүгін жаңа нәрсе үйрен!',
  'Физика — табиғат тілі',
  'Формулалар — ойдың коды',
  'Жетістікке жол — тәжірибеден өтеді',
  'Ғарышты танып білу — физикадан басталады',
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyStatus, setDailyStatus] = useState(null)
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length]

  useEffect(() => {
    if (user?.id) {
      progressAPI.getUserProgress(user.id).then(setStats).catch(() => { }).finally(() => setLoading(false))
      testsAPI.getDailyStatus(user.id).then(setDailyStatus).catch(() => {})
    } else setLoading(false)
  }, [user?.id])

  const nav = (path) => { WebApp.HapticFeedback.impactOccurred('light'); navigate(path) }
  const lastTopic = stats?.topics?.find(t => t.percent > 0 && t.percent < 100)

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 space-y-4 pt-2 pb-4">

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-primary/20 p-5 shadow-glow-primary/10 card-lift"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, #1A1A2E 60%, #0F0F1A 100%)' }}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/20 blur-2xl effect-glow-pulse" />
          <div className="absolute -bottom-10 -left-8 w-24 h-24 rounded-full bg-secondary/20 blur-2xl effect-drift" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <span className="particle particle-1 absolute top-3 right-8 text-primary/25 text-xl font-mono">∑</span>
            <span className="particle particle-2 absolute top-10 right-16 text-secondary/20 text-sm font-mono">∫</span>
            <span className="particle particle-3 absolute bottom-5 right-5 text-primary/20 text-2xl font-mono">∞</span>
            <span className="particle particle-1 absolute bottom-3 right-20 text-success/20 text-sm font-mono">Δ</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Физика Боты</p>
            <h1 className="text-2xl font-extrabold text-text-1 mb-1">
              Сәлем, {user?.first_name || 'Оқушы'}!
            </h1>
            <p className="text-sm text-text-2 mb-3">{motivation}</p>
            {(stats?.streak || 0) > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-warning/10 border border-warning/25 rounded-full px-3 py-1">
                <Flame size={14} strokeWidth={2} className="text-warning" />
                <span className="text-warning text-xs font-semibold">{stats.streak} күн қатар</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { Icon: Flame, label: 'Жолақ', value: stats?.streak || 0, color: 'text-warning' },
              { Icon: CheckCircle2, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-success' },
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-primary' },
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-3 text-center shadow-card">
                <s.Icon size={22} strokeWidth={1.5} className={`mx-auto mb-1.5 ${s.color}`} />
                <div className="text-lg font-bold text-text-1">{s.value}</div>
                <div className="text-[11px] text-text-2">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Daily challenge */}
        {dailyStatus && (
          <button
            onClick={() => !dailyStatus.completed && nav('/test?mode=daily')}
            className={`w-full rounded-2xl p-4 text-left border transition-all ${
              dailyStatus.completed
                ? 'bg-surface border-success/30 opacity-70 cursor-default'
                : 'bg-surface border-warning/30 pressable card-lift shadow-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dailyStatus.completed ? 'bg-success/10' : 'bg-warning/10'}`}>
                {dailyStatus.completed
                  ? <CheckCircle2 size={22} strokeWidth={1.5} className="text-success" />
                  : <Flame size={22} strokeWidth={1.5} className="text-warning" />
                }
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-warning">Күнделікті сынақ</p>
                <p className="text-sm font-bold text-text-1">
                  {dailyStatus.completed ? 'Бүгін орындалды!' : '10 сұрақ · Бонус XP жинаңыз'}
                </p>
              </div>
              {!dailyStatus.completed && (
                <div className="flex items-center gap-1 bg-warning/10 rounded-full px-2.5 py-1">
                  <Zap size={12} strokeWidth={2} className="text-warning" />
                  <span className="text-xs font-bold text-warning">+{dailyStatus.bonus_xp}</span>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Continue learning */}
        {lastTopic && (
          <button onClick={() => nav('/theory')} className="w-full bg-surface border border-primary/25 rounded-2xl p-4 text-left pressable shadow-card card-lift">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-0.5">Жалғастыру</p>
                <p className="text-sm font-bold text-text-1">{lastTopic.name}</p>
              </div>
              <ChevronRight size={20} strokeWidth={1.5} className="text-primary/60" />
            </div>
            <ProgressBar value={lastTopic.percent} max={100} color="primary" showLabel />
          </button>
        )}

        {/* Menu */}
        <div>
          <p className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3">Бөлімдер</p>
          <div className="space-y-2">
            {MENU.map(({ Icon, title, subtitle, path, accent }) => (
              <button
                key={path}
                onClick={() => nav(path)}
                className="w-full bg-surface border border-border rounded-2xl p-4 text-left pressable shadow-card card-lift"
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
                    <Icon size={20} strokeWidth={1.5} style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text-1 text-sm">{title}</div>
                    <div className="text-xs text-text-2 truncate mt-0.5">{subtitle}</div>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-text-3 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
