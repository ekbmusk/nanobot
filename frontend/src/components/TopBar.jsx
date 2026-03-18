import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy, Bell, X, TrendingUp, Flame, Brain, Calculator, Lock, Star, Settings, BellOff } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { progressAPI } from '../api/progress'
import { ratingAPI } from '../api/rating'
import ProgressBar from './ProgressBar'
import Avatar from './Avatar'

const LEVEL_LABELS = { easy: 'Бастауыш', medium: 'Орташа', hard: 'Жоғары' }

const ACHIEVEMENTS = [
  { id: 'first_test', Icon: Star, name: 'Алғашқы тест', unlocked: true },
  { id: 'streak_3', Icon: Flame, name: '3 күн жолақ', unlocked: true },
  { id: 'streak_7', Icon: Flame, name: '7 күн жолақ', unlocked: false },
  { id: 'perfect', Icon: Trophy, name: '100% тест', unlocked: false },
  { id: 'problems_10', Icon: Calculator, name: '10 есеп', unlocked: false },
  { id: 'all_topics', Icon: Brain, name: 'Барлық тақырып', unlocked: false },
]

const getRankLabel = (rank) => {
  if (!rank) return '#—'
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function ProfileSheet({ onClose, user }) {
  const [stats, setStats] = useState(null)
  const [rank, setRank] = useState(null)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [level, setLevel] = useState('medium')

  useEffect(() => {
    if (!user?.id) return
    progressAPI.getUserProgress(user.id).then(setStats).catch(() => { })
    ratingAPI.getMyRank(user.id).then(setRank).catch(() => { })
    // Fetch user settings
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
        setLevel(d.level ?? 'medium')
      })
      .catch(() => { })
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
    } catch { }
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Пайдаланушы'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="bg-surface rounded-t-3xl shadow-sheet animate-slide-up max-h-[92vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>
        <div className="flex justify-end px-4 pb-1">
          <button onClick={onClose} className="p-1.5 rounded-full bg-surface-2 border border-border">
            <X size={16} strokeWidth={2} className="text-text-2" />
          </button>
        </div>

        <div className="px-5 pb-10">
          {/* Avatar */}
          <div className="flex flex-col items-center py-4">
            <Avatar user={user} size="xl" className="mb-3 shadow-glow-primary" priority />
            <h2 className="text-lg font-bold text-text-1">{fullName}</h2>
            {user?.username && <p className="text-sm text-text-2 mt-0.5">@{user.username}</p>}
            <div className="mt-2 px-3 py-1 bg-primary-dim rounded-full">
              <span className="text-primary text-xs font-semibold">
                {getRankLabel(rank?.rank)} Рейтинг
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0 },
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0 },
              { Icon: Flame, label: 'Жолақ', value: `${stats?.streak || 0}` },
            ].map((s, i) => (
              <div key={i} className="bg-surface-2 rounded-2xl p-3 text-center border border-border">
                <s.Icon size={18} strokeWidth={1.5} className="text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-text-1">{s.value}</div>
                <div className="text-xs text-text-2">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Topic progress */}
          {stats?.topics?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp size={14} strokeWidth={1.5} /> Тақырыптар
              </h3>
              <div className="space-y-3">
                {stats.topics.slice(0, 4).map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-1">{t.name}</span>
                      <span className="text-text-2">{t.percent}%</span>
                    </div>
                    <ProgressBar value={t.percent} max={100} color="primary" size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div>
            <h3 className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star size={14} strokeWidth={1.5} /> Жетістіктер
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.id} className={`rounded-2xl p-3 text-center border transition-all ${a.unlocked ? 'bg-primary-dim border-primary/30' : 'bg-surface-2 border-border opacity-40'}`}>
                  {a.unlocked
                    ? <a.Icon size={24} strokeWidth={1.5} className="text-primary mx-auto mb-1" />
                    : <Lock size={24} strokeWidth={1.5} className="text-text-3 mx-auto mb-1" />
                  }
                  <div className="text-[10px] text-text-2 leading-tight">{a.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mt-5">
            <h3 className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Settings size={14} strokeWidth={1.5} /> Баптаулар
            </h3>
            <div className="space-y-2">
              {/* Notifications toggle */}
              <div className="flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {notifEnabled
                    ? <Bell size={16} strokeWidth={1.5} className="text-primary" />
                    : <BellOff size={16} strokeWidth={1.5} className="text-text-3" />
                  }
                  <span className="text-sm text-text-1">Хабарландырулар</span>
                </div>
                <button onClick={toggleNotifications}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${notifEnabled ? 'bg-primary' : 'bg-surface border border-border'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {/* Level display */}
              <div className="flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3">
                <span className="text-sm text-text-1">📊 Деңгей</span>
                <span className="text-xs font-semibold text-primary">{LEVEL_LABELS[level] || level}</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary mt-5">Жабу</button>
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
    if (user?.id) ratingAPI.getMyRank(user.id).then(setRank).catch(() => { })
  }, [user?.id])

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(15,15,26,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-2 pressable">
            <ArrowLeft size={20} strokeWidth={1.5} className="text-text-2" />
            {title && <span className="text-sm font-semibold text-text-1">{title}</span>}
          </button>
        ) : (
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 pressable">
            <Avatar user={user} size="md" className="shadow-glow-primary" priority />
            <div className="text-left">
              <div className="text-[10px] text-text-2 leading-none">Физика Боты</div>
              <div className="text-sm font-semibold text-text-1 leading-tight mt-0.5">{user?.first_name || 'Сәлем!'}</div>
            </div>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-2 rounded-full px-3 py-1.5 border border-border">
            <Trophy size={14} strokeWidth={1.5} className="text-warning" />
            <span className="text-xs font-bold text-primary">{rank?.rank ? `#${rank.rank}` : '#—'}</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center opacity-30 cursor-not-allowed" disabled>
            <Bell size={16} strokeWidth={1.5} className="text-text-2" />
          </button>
        </div>
      </div>
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} user={user} />}
    </>
  )
}
