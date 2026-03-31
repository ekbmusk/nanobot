import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import {
  BookOpen, FlaskConical, Brain, Trophy, BarChart2, HelpCircle,
  Flame, CheckCircle2, ChevronRight, Zap, Atom, Microscope,
  Lightbulb, Award, MessageCircle, Sparkles,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import { progressAPI } from '../api/progress'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'

const PRIMARY_ACTIONS = [
  { Icon: BookOpen, title: 'Теория', path: '/theory', gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', shadow: 'rgba(6,182,212,0.4)' },
  { Icon: FlaskConical, title: 'Есептер', path: '/problems', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: 'rgba(16,185,129,0.4)' },
  { Icon: Brain, title: 'Тест', path: '/test', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)', shadow: 'rgba(56,189,248,0.4)' },
]

const SECONDARY_ITEMS = [
  { Icon: MessageCircle, title: 'AI Репетитор', path: '/ask-ai', color: '#8B5CF6' },
  { Icon: Trophy, title: 'Рейтинг', path: '/rating', color: '#F59E0B' },
  { Icon: Award, title: 'Жетістіктер', path: '/achievements', color: '#EF4444' },
  { Icon: BarChart2, title: 'Прогресс', path: '/progress', color: '#06B6D4' },
]

const MOTIVATIONS = [
  'Нанодүниені зерттеуді бастайық!',
  'Атомдар — табиғаттың кірпіштері',
  'Кванттық физика — болашақ кілті',
  'Нанотехнология өмірді өзгертеді',
  'Ғылым — білімнің шыңы',
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyStatus, setDailyStatus] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length]

  useEffect(() => {
    if (user?.id) {
      progressAPI.getUserProgress(user.id).then(setStats).catch(() => {}).finally(() => setLoading(false))
      testsAPI.getDailyStatus(user.id).then(setDailyStatus).catch(() => {})
      progressAPI.getAnalytics(user.id).then(d => setRecommendations(d?.recommendations || [])).catch(() => {})
    } else setLoading(false)
  }, [user?.id])

  const nav = (path) => { WebApp.HapticFeedback.impactOccurred('light'); navigate(path) }
  const lastTopic = stats?.topics?.find(t => t.percent > 0 && t.percent < 100)

  return (
    <div className="min-h-screen-safe bg-bg bg-grid page-enter">
      <TopBar />
      <div className="px-3.5 space-y-4 pt-2 pb-4">

        {/* ── Hero with orbital atom ── */}
        <div className="relative rounded-2xl overflow-hidden p-5 animate-fade-in"
          style={{ background: 'linear-gradient(160deg, rgba(6,182,212,0.1) 0%, rgba(16,185,129,0.05) 40%, #0A0E14 100%)' }}>

          {/* Orbital rings */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 w-28 h-28 pointer-events-none select-none opacity-60">
            <div className="absolute inset-0 rounded-full border border-primary/15 orbit-ring" />
            <div className="absolute inset-3 rounded-full border border-secondary/12 orbit-ring-reverse" />
            <div className="absolute inset-6 rounded-full border border-info/10 orbit-ring" style={{ animationDuration: '6s' }} />
            {/* Electron dots */}
            <div className="absolute inset-0 orbit-ring">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            </div>
            <div className="absolute inset-3 orbit-ring-reverse">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 w-1 h-1 rounded-full bg-secondary shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            </div>
            {/* Nucleus */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary/30 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
            </div>
          </div>

          {/* Floating symbols */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <span className="particle particle-1 absolute top-3 left-[60%] text-primary/15 text-sm font-mono">ψ</span>
            <span className="particle particle-2 absolute top-10 left-[75%] text-secondary/12 text-[10px] font-mono">ℏ</span>
            <span className="particle particle-3 absolute bottom-3 left-[55%] text-info/10 text-xs font-mono">λ</span>
          </div>

          <div className="relative z-10 max-w-[65%]">
            <div className="flex items-center gap-1.5 mb-2">
              <Atom size={13} strokeWidth={2} className="text-primary" />
              <span className="text-[9px] font-mono font-semibold text-primary uppercase tracking-[0.15em]">Нанотехнология</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-text-1 leading-tight mb-1.5 tracking-tight">
              Сәлем, {user?.first_name || 'Оқушы'}!
            </h1>
            <p className="text-[11px] text-text-2 leading-relaxed mb-3">{motivation}</p>

            {(stats?.streak || 0) > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-warning/10 border border-warning/20 rounded-full px-2.5 py-1">
                <Flame size={12} strokeWidth={2.5} className="text-warning" />
                <span className="text-warning text-[11px] font-bold">{stats.streak} күн</span>
                <span className="text-warning/60 text-[11px]">қатар</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick stats row ── */}
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {[0,1,2,3].map(i => <div key={i} className="skeleton h-[60px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 animate-slide-up stagger-1">
            {[
              { Icon: Zap, label: 'XP', value: stats?.total_score || 0, color: '#06B6D4' },
              { Icon: Flame, label: 'Жолақ', value: stats?.streak || 0, color: '#F59E0B' },
              { Icon: CheckCircle2, label: 'Есеп', value: stats?.problems_solved || 0, color: '#10B981' },
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: '#38BDF8' },
            ].map((s, i) => (
              <div key={i} className="relative rounded-xl p-2.5 text-center overflow-hidden"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <s.Icon size={15} strokeWidth={1.5} style={{ color: s.color }} className="mx-auto mb-1 opacity-80" />
                <div className="text-[15px] font-bold text-text-1 font-mono tracking-tight">{s.value}</div>
                <div className="text-[9px] text-text-3 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Primary actions — 3 big buttons ── */}
        <div className="grid grid-cols-3 gap-2.5 animate-slide-up stagger-2">
          {PRIMARY_ACTIONS.map(({ Icon, title, path, gradient, shadow }) => (
            <button
              key={path}
              onClick={() => nav(path)}
              className="relative rounded-2xl p-4 pt-5 pb-3.5 text-center pressable overflow-hidden group"
              style={{ background: gradient, boxShadow: `0 8px 24px -4px ${shadow}` }}
            >
              <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-colors" />
              <Icon size={26} strokeWidth={1.5} className="text-white mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <div className="text-[11px] font-bold text-white/95 tracking-wide">{title}</div>
            </button>
          ))}
        </div>

        {/* ── Daily challenge ── */}
        {dailyStatus && (
          <button
            onClick={() => !dailyStatus.completed && nav('/test?mode=daily')}
            className={`w-full rounded-xl p-3.5 text-left transition-all animate-slide-up stagger-3 ${
              dailyStatus.completed
                ? 'opacity-60 cursor-default'
                : 'pressable card-lift'
            }`}
            style={{
              background: dailyStatus.completed
                ? 'rgba(16,185,129,0.06)'
                : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.03) 100%)',
              border: `1px solid ${dailyStatus.completed ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                dailyStatus.completed ? 'bg-success/15' : 'bg-warning/15'
              }`}>
                {dailyStatus.completed
                  ? <CheckCircle2 size={20} strokeWidth={1.5} className="text-success" />
                  : <Flame size={20} strokeWidth={1.5} className="text-warning" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-text-1">
                    {dailyStatus.completed ? 'Бүгін орындалды!' : 'Күнделікті сынақ'}
                  </p>
                  {!dailyStatus.completed && (
                    <span className="text-[9px] font-mono font-bold text-warning bg-warning/10 rounded px-1.5 py-0.5">
                      +{dailyStatus.bonus_xp} XP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-3 mt-0.5">
                  {dailyStatus.completed ? 'Ертең жаңа сынақ күтіп тұр' : '10 сұрақ · Бонус ұпай жина'}
                </p>
              </div>
              {!dailyStatus.completed && (
                <ChevronRight size={16} strokeWidth={2} className="text-warning/60 flex-shrink-0" />
              )}
            </div>
          </button>
        )}

        {/* ── Continue learning ── */}
        {lastTopic && (
          <button onClick={() => nav('/theory')}
            className="w-full rounded-xl p-3.5 text-left pressable card-lift animate-slide-up stagger-4"
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-primary font-semibold uppercase tracking-wider">Жалғастыру</p>
                  <p className="text-xs font-bold text-text-1 truncate">{lastTopic.name}</p>
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={2} className="text-primary/40 flex-shrink-0" />
            </div>
            <ProgressBar value={lastTopic.percent} max={100} color="primary" showLabel />
          </button>
        )}

        {/* ── Secondary actions — 2×2 grid ── */}
        <div className="animate-slide-up stagger-5">
          <p className="text-[9px] font-mono font-semibold text-text-3 uppercase tracking-[0.15em] mb-2.5 px-0.5">Бөлімдер</p>
          <div className="grid grid-cols-4 gap-2">
            {SECONDARY_ITEMS.map(({ Icon, title, path, color }) => (
              <button
                key={path}
                onClick={() => nav(path)}
                className="rounded-xl p-3 text-center pressable"
                style={{ background: `${color}08`, border: `1px solid ${color}12` }}
              >
                <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
                  style={{ background: `${color}15` }}>
                  <Icon size={16} strokeWidth={1.5} style={{ color }} />
                </div>
                <div className="text-[10px] font-semibold text-text-2 leading-tight">{title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div className="animate-slide-up stagger-6">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Lightbulb size={11} strokeWidth={2} className="text-warning" />
              <p className="text-[9px] font-mono font-semibold text-text-3 uppercase tracking-[0.15em]">Ұсыныстар</p>
            </div>
            <div className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => nav(rec.action_url)}
                  className="w-full rounded-xl p-3 text-left pressable"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                      {rec.type === 'review_theory'
                        ? <BookOpen size={13} strokeWidth={1.5} className="text-warning" />
                        : <Microscope size={13} strokeWidth={1.5} className="text-primary" />
                      }
                    </div>
                    <p className="text-[11px] font-medium text-text-2 flex-1">{rec.message}</p>
                    <ChevronRight size={12} strokeWidth={2} className="text-text-3/50 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Help link ── */}
        <button onClick={() => nav('/help')}
          className="w-full flex items-center justify-center gap-1.5 py-2 pressable animate-slide-up stagger-6">
          <HelpCircle size={12} strokeWidth={1.5} className="text-text-3" />
          <span className="text-[10px] text-text-3 font-medium">Нұсқаулық</span>
        </button>

      </div>
    </div>
  )
}
