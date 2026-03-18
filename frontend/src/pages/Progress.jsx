import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Brain, Calculator, TrendingUp, Flame, BarChart2 } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { SkeletonCard } from '../components/SkeletonLoader'
import { progressAPI } from '../api/progress'
import { useUserStore } from '../store/userStore'

export default function Progress() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    if (user?.id) progressAPI.getUserProgress(user.id).then(setStats).catch(() => {}).finally(() => setLoading(false))
    else setLoading(false)
    return () => WebApp.BackButton.hide()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Прогресс" />
      <div className="px-4 pt-2 pb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-1 mb-1">Прогресс</h1>
          <p className="text-sm text-text-2">Жалпы үлгерімің</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-primary' },
                { Icon: TrendingUp, label: 'Орташа', value: `${stats?.avg_score || 0}%`, color: 'text-success' },
                { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-secondary' },
              ].map((s, i) => (
                <div key={i} className="card p-3.5 text-center">
                  <s.Icon size={22} strokeWidth={1.5} className={`mx-auto mb-1.5 ${s.color}`} />
                  <div className="text-lg font-bold text-text-1">{s.value}</div>
                  <div className="text-xs text-text-2">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                <Flame size={28} strokeWidth={1.5} className="text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-1">{stats?.streak || 0} күн</div>
                <div className="text-sm text-text-2">Үзіліссіз оқу жолағы</div>
              </div>
            </div>

            {stats?.topics?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <BarChart2 size={14} strokeWidth={1.5} className="text-text-2" />
                  <p className="text-xs font-semibold text-text-2 uppercase tracking-wider">Тақырыптар</p>
                </div>
                <div className="space-y-2.5">
                  {stats.topics.map((t, i) => (
                    <div key={i} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-1">{t.name}</span>
                        <span className="text-xs text-text-2 font-semibold">{t.percent}%</span>
                      </div>
                      <ProgressBar value={t.percent} max={100} color={t.percent > 70 ? 'success' : t.percent > 40 ? 'warning' : 'primary'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.recent_tests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3">Соңғы тесттер</p>
                <div className="space-y-2">
                  {stats.recent_tests.map((t, i) => (
                    <div key={i} className="card px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-text-2">{t.date}</span>
                      <span className={`text-sm font-bold ${t.score >= 70 ? 'text-success' : 'text-secondary'}`}>{t.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
