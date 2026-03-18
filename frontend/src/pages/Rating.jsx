import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Trophy, Medal, Brain } from 'lucide-react'
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
      .catch(() => setError('Рейтинг жүктелмеді. Қайтадан көріңіз.'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Рейтинг" />
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Рейтинг</h1>
        <p className="text-sm text-text-2 mb-4">Үздік оқушылар</p>

        <div className="flex gap-2 mb-5">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => { setPeriod(p.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`chip flex-1 border ${p.id === period ? 'bg-primary text-white border-primary shadow-glow-primary' : 'bg-surface text-text-2 border-border'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {myRank && (
          <div className="card p-4 mb-4" style={{ borderLeft: '3px solid #6C63FF' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Medal size={20} strokeWidth={1.5} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text-1">Менің орным — #{myRank.rank}</p>
                  <p className="text-xs text-text-2">{myRank.score} ұпай</p>
                </div>
              </div>
              <Trophy size={20} strokeWidth={1.5} className="text-warning" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : !error && (
          <div className="space-y-2">
            {leaders.map((leader, i) => {
              const isMe = leader.telegram_id === user?.id
              const displayName = getLeaderName(leader)
              const username = getUsername(leader)
              return (
                <div key={leader.telegram_id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border ${isMe ? 'bg-primary-dim border-primary/30' : 'bg-surface border-border'}`}>
                  <span className="w-8 text-center text-xl flex-shrink-0">
                    {i < 3 ? RANK_ICONS[i] : <span className="text-sm font-bold text-text-3">{i + 1}</span>}
                  </span>
                  <Avatar
                    size="md"
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
                        className={`text-sm font-semibold truncate block ${isMe ? 'text-primary' : 'text-text-1'}`}
                      >
                        @{username}
                      </a>
                    ) : (
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-text-1'}`}>{displayName}</p>
                    )}
                    <p className="text-xs text-text-3 flex items-center gap-1">
                      <Brain size={11} strokeWidth={1.5} /> {leader.tests_taken} тест
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-1">{leader.score}</p>
                    <p className="text-[10px] text-text-3">ұпай</p>
                  </div>
                </div>
              )
            })}
            {leaders.length === 0 && (
              <div className="text-center py-16">
                <Trophy size={48} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
                <p className="text-text-3 text-sm">Рейтинг бос. Алғашқы болыңыз!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
