import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Trophy, Medal, Brain, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import { SkeletonCard } from '../components/SkeletonLoader'
import { ratingAPI } from '../api/rating'
import { useUserStore } from '../store/userStore'
import Avatar from '../components/Avatar'

const PERIODS = [{ id: 'week', label: 'Апта' }, { id: 'month', label: 'Ай' }, { id: 'all', label: 'Барлығы' }]
const RANK_ICONS = ['🥇', '🥈', '🥉']

const USER_ID_FALLBACK = /^User\s+\d+$/i

function getLeaderName(leader) {
  const firstName = leader?.first_name?.trim() || ''
  const lastName = leader?.last_name?.trim() || ''
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  const username = leader?.username?.trim()?.replace(/^@+/, '')
  if (username) return `@${username}`
  const apiName = (leader?.full_name || '').trim()
  if (apiName && !USER_ID_FALLBACK.test(apiName)) return apiName
  return 'Пайдаланушы'
}

function getUsername(leader) {
  const username = leader?.username?.trim()?.replace(/^@+/, '')
  return username || null
}

export default function Rating() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    return () => WebApp.BackButton.hide()
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    ratingAPI.getLeaderboard({ period, telegram_id: user?.id })
      .then(d => { setLeaders(d.leaderboard ?? []); setMyRank(d.my_rank) })
      .catch(() => setError('Рейтинг жүктелмеді.'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Рейтинг" />
      <div className="px-3 pt-1.5 pb-4">
        <h1 className="text-xl font-extrabold text-text-1 mb-0.5">Рейтинг</h1>
        <p className="text-xs text-text-2 mb-3">Үздік оқушылар</p>

        <div className="flex gap-1.5 mb-4">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => { setPeriod(p.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`chip flex-1 border ${p.id === period ? 'bg-primary text-white border-primary shadow-glow-primary' : 'bg-surface text-text-2 border-border'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {myRank && (
          <div className="card p-3 mb-3" style={{ borderLeft: '3px solid #06B6D4' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Medal size={18} strokeWidth={1.5} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-1 truncate">Менің орным — #{myRank.rank}</p>
                  <p className="text-[10px] text-text-2">Орташа: {myRank.score}%</p>
                </div>
              </div>
              <Trophy size={18} strokeWidth={1.5} className="text-warning flex-shrink-0" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-xs text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-1.5">{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : !error && (
          <div className="space-y-1.5">
            {leaders.map((leader, i) => {
              const isMe = leader.telegram_id === user?.id
              const displayName = getLeaderName(leader)
              const username = getUsername(leader)
              return (
                <div key={leader.telegram_id}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${isMe ? 'bg-primary-dim border-primary/30' : 'bg-surface border-border'}`}>
                  <span className="w-7 text-center text-lg flex-shrink-0">
                    {i < 3 ? RANK_ICONS[i] : <span className="text-xs font-bold text-text-3">{i + 1}</span>}
                  </span>
                  <Avatar
                    size="sm"
                    user={{
                      first_name: leader?.first_name || displayName,
                      username: leader?.username,
                      full_name: displayName,
                      photo_url: leader?.photo_url,
                    }}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {username ? (
                      <a
                        href={`https://t.me/${username}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs font-semibold truncate block ${isMe ? 'text-primary' : 'text-text-1'}`}
                      >
                        @{username}
                      </a>
                    ) : (
                      <p className={`text-xs font-semibold truncate ${isMe ? 'text-primary' : 'text-text-1'}`}>{displayName}</p>
                    )}
                    <p className="text-[10px] text-text-3 flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5"><Brain size={10} strokeWidth={1.5} /> {leader.tests_taken}</span>
                      <span className="flex items-center gap-0.5"><Zap size={10} strokeWidth={1.5} className="text-primary" /> {leader.xp || 0}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-text-1">{leader.score}%</p>
                    <p className="text-[9px] text-text-3">орташа</p>
                  </div>
                </div>
              )
            })}
            {leaders.length === 0 && (
              <div className="text-center py-12">
                <Trophy size={40} strokeWidth={1} className="text-text-3 mx-auto mb-2" />
                <p className="text-text-3 text-xs">Рейтинг бос. Алғашқы болыңыз!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
