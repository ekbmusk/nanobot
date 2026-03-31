import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Bell, X, TrendingUp, Flame, Brain, Calculator, Zap, Award, ChevronRight, Settings, BellOff } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { progressAPI } from '../api/progress'
import { ratingAPI } from '../api/rating'
import ProgressBar from './ProgressBar'
import Avatar from './Avatar'
import client from '../api/client'

const LEVEL_INFO = {
  '1': { label: 'Бастаушы', color: '#10B981', next: 'Оқушы' },
  '2': { label: 'Оқушы', color: '#34D399', next: 'Орташа' },
  '3': { label: 'Орташа', color: '#F59E0B', next: 'Жетік' },
  '4': { label: 'Жетік', color: '#F97316', next: 'Шебер' },
  '5': { label: 'Шебер', color: '#EF4444', next: 'Эксперт' },
  '6': { label: 'Эксперт', color: '#8B5CF6', next: null },
}

const XP_MILESTONES = [100, 500, 1000, 5000]

const getRankLabel = (rank) => {
  if (!rank) return '#—'
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function ProfileSheet({ onClose, user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [rank, setRank] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [level, setLevel] = useState(user?.level || '3')

  useEffect(() => {
    if (!user?.id) return
    progressAPI.getUserProgress(user.id).then(setStats).catch(() => {})
    progressAPI.getAnalytics(user.id).then(setAnalytics).catch(() => {})
    ratingAPI.getMyRank(user.id).then(setRank).catch(() => {})
    client.get(`/users/${user.id}/achievements`).then(setAchievements).catch(() => {})
    fetch(`/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: user.id,
        username: user.username ?? null,
        photo_url: (user.photo_url && user.photo_url.startsWith('http')) ? user.photo_url : null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        language_code: user.language_code ?? 'kk',
      }),
    })
      .then(r => r.json())
      .then(d => {
        setNotifEnabled(d.notifications_enabled ?? true)
        setLevel(d.level ?? '3')
      })
      .catch(() => {})
  }, [user?.id])

  const toggleNotifications = async () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    try {
      await fetch(`/api/users/${user.id}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
    } catch {}
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Пайдаланушы'
  const lvl = LEVEL_INFO[level] || LEVEL_INFO['3']
  const totalXP = stats?.total_score || 0
  const nextMilestone = XP_MILESTONES.find(m => m > totalXP) || XP_MILESTONES[XP_MILESTONES.length - 1]
  const prevMilestone = XP_MILESTONES.filter(m => m <= totalXP).pop() || 0
  const xpProgress = Math.min(100, ((totalXP - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const recentUnlocked = achievements.filter(a => a.unlocked).slice(-4).reverse()

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="bg-surface rounded-t-3xl shadow-sheet animate-slide-up overflow-hidden flex flex-col" style={{ maxHeight: '88dvh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-2.5 pb-1.5 flex-shrink-0">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>
        <div className="flex justify-end px-4 pb-1 flex-shrink-0">
          <button onClick={onClose} className="p-1.5 rounded-full bg-surface-2 border border-border">
            <X size={16} strokeWidth={2} className="text-text-2" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
          {/* Profile header */}
          <div className="flex flex-col items-center py-3">
            <Avatar user={user} size="xl" className="mb-2 shadow-glow-primary" priority />
            <h2 className="text-base font-bold text-text-1">{fullName}</h2>
            {user?.username && <p className="text-xs text-text-2 mt-0.5">@{user.username}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${lvl.color}18`, color: lvl.color }}>
                {lvl.label} · {level}-деңгей
              </span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {getRankLabel(rank?.rank)} Рейтинг
              </span>
            </div>
          </div>

          {/* XP Progress to next milestone */}
          <div className="card p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap size={14} strokeWidth={2} className="text-primary" />
                <span className="text-sm font-bold text-text-1">{totalXP} XP</span>
              </div>
              <span className="text-[10px] text-text-3">{nextMilestone} XP дейін</span>
            </div>
            <ProgressBar value={xpProgress} max={100} color="primary" size="md" />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-3">{prevMilestone}</span>
              <span className="text-[9px] text-primary font-semibold">{nextMilestone}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { Icon: Zap, label: 'XP', value: totalXP, color: 'text-primary' },
              { Icon: Flame, label: 'Жолақ', value: stats?.streak || 0, color: 'text-warning' },
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-success' },
              { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-secondary' },
            ].map((s, i) => (
              <div key={i} className="bg-surface-2 rounded-xl p-2 text-center border border-border">
                <s.Icon size={14} strokeWidth={1.5} className={`mx-auto mb-0.5 ${s.color}`} />
                <div className="text-sm font-bold text-text-1">{s.value}</div>
                <div className="text-[9px] text-text-3">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Streak visual */}
          {(stats?.streak || 0) > 0 && (
            <div className="card p-3 mb-3 flex items-center gap-3">
              <div className="text-2xl">🔥</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-text-1">{stats.streak} күн қатар!</div>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${i < Math.min(stats.streak, 7) ? 'bg-warning' : 'bg-surface'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="mb-3">
            <button onClick={() => { onClose(); navigate('/achievements') }} className="flex items-center justify-between w-full mb-2 pressable">
              <h3 className="text-[10px] font-semibold text-text-2 uppercase tracking-wider flex items-center gap-1">
                <Award size={12} strokeWidth={1.5} /> Жетістіктер
              </h3>
              <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                {unlockedCount}/{achievements.length} <ChevronRight size={10} />
              </span>
            </button>
            <div className="grid grid-cols-4 gap-1.5">
              {(recentUnlocked.length > 0 ? recentUnlocked : achievements.slice(0, 4)).map(a => (
                <div key={a.code} className={`rounded-xl p-2 text-center border ${a.unlocked ? 'border-transparent' : 'border-border opacity-30'}`}
                  style={a.unlocked ? { background: `${a.color}10`, borderColor: `${a.color}25` } : {}}>
                  <span className="text-lg">{a.icon}</span>
                  <div className="text-[8px] text-text-2 mt-0.5 leading-tight truncate">{a.name_kz}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic progress — prefer analytics mastery over basic progress */}
          {(() => {
            const topicData = analytics?.topic_mastery?.length > 0
              ? analytics.topic_mastery.map(t => ({ name: t.name, percent: t.accuracy }))
              : stats?.topics?.filter(t => t.percent > 0) || []
            return topicData.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[10px] font-semibold text-text-2 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp size={12} strokeWidth={1.5} /> Тақырыптар
                </h3>
                <div className="space-y-2">
                  {topicData.map((t, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-1 truncate mr-2">{t.name}</span>
                        <span className="text-text-2 flex-shrink-0">{Math.round(t.percent)}%</span>
                      </div>
                      <ProgressBar value={t.percent} max={100} color={t.percent >= 70 ? 'success' : t.percent >= 40 ? 'warning' : 'error'} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Settings */}
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold text-text-2 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Settings size={12} strokeWidth={1.5} /> Баптаулар
            </h3>
            <div className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                {notifEnabled
                  ? <Bell size={14} strokeWidth={1.5} className="text-primary" />
                  : <BellOff size={14} strokeWidth={1.5} className="text-text-3" />
                }
                <span className="text-xs text-text-1">Хабарландырулар</span>
              </div>
              <button onClick={toggleNotifications}
                className={`rounded-full transition-colors relative flex-shrink-0 ${notifEnabled ? 'bg-primary' : 'bg-surface border border-border'}`}
                style={{ width: '40px', height: '22px' }}>
                <div className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                  style={{ width: '18px', height: '18px', transform: notifEnabled ? 'translateX(19px)' : 'translateX(2px)' }} />
              </button>
            </div>
          </div>

          <button onClick={() => { onClose(); navigate('/progress') }} className="w-full card p-3 text-center pressable border-primary/20">
            <span className="text-xs font-semibold text-primary">Толық профильді көру →</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TopBar({ title, showBack, onBack }) {
  const { user } = useUserStore()
  const [showProfile, setShowProfile] = useState(false)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    if (user?.id) ratingAPI.getMyRank(user.id).then(setRank).catch(() => {})
  }, [user?.id])

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 sticky top-0 z-40"
        style={{ background: 'rgba(10,14,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(6,182,212,0.06)' }}>
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 pressable min-w-0">
            <ArrowLeft size={18} strokeWidth={1.5} className="text-text-2 flex-shrink-0" />
            {title && <span className="text-sm font-semibold text-text-1 truncate">{title}</span>}
          </button>
        ) : (
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 pressable min-w-0">
            <Avatar user={user} size="sm" className="shadow-glow-primary flex-shrink-0" priority />
            <div className="text-left min-w-0">
              <div className="text-[8px] font-mono font-medium text-primary/60 leading-none tracking-wider uppercase">Nano</div>
              <div className="text-xs font-bold text-text-1 leading-tight mt-0.5 truncate">{user?.first_name || 'Сәлем!'}</div>
            </div>
          </button>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 bg-surface-2 rounded-full px-2 py-1 border border-border">
            <Trophy size={12} strokeWidth={1.5} className="text-warning" />
            <span className="text-[11px] font-bold text-primary">{rank?.rank ? `#${rank.rank}` : '#—'}</span>
          </div>
        </div>
      </div>
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} user={user} />}
    </>
  )
}
