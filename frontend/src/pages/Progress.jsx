import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Brain, Calculator, TrendingUp, TrendingDown, Minus, Flame, BarChart2, AlertTriangle, ChevronRight, Zap, Award, Lock, ArrowLeft, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import Avatar from '../components/Avatar'
import FormulaRenderer from '../components/FormulaRenderer'
import QuestionMedia from '../components/QuestionMedia'
import { SkeletonCard } from '../components/SkeletonLoader'
import { progressAPI } from '../api/progress'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'
import client from '../api/client'

const LEVEL_LABELS = {
  '1': { label: 'Бастаушы', color: '#10B981' },
  '2': { label: 'Оқушы', color: '#34D399' },
  '3': { label: 'Орташа', color: '#F59E0B' },
  '4': { label: 'Жетік', color: '#F97316' },
  '5': { label: 'Шебер', color: '#EF4444' },
  '6': { label: 'Эксперт', color: '#8B5CF6' },
}

export default function Progress() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [reviewData, setReviewData] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const fetchAiSummary = async () => {
    if (!user?.id) return
    setAiLoading(true)
    try {
      const data = await client.get(`/progress/${user.id}/ai-summary`)
      setAiSummary(data?.summary || null)
    } catch { setAiSummary('AI талдау қазір қолжетімсіз.') }
    finally { setAiLoading(false) }
  }

  const handleReview = async (resultId) => {
    setReviewLoading(true)
    try {
      const data = await testsAPI.getReview(resultId)
      setReviewData(data)
    } catch {}
    finally { setReviewLoading(false) }
  }

  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    if (user?.id) {
      Promise.all([
        progressAPI.getUserProgress(user.id).then(setStats),
        progressAPI.getAnalytics(user.id).then(setAnalytics),
        client.get(`/users/${user.id}/achievements`).then(setAchievements).catch(() => {}),
      ]).catch(() => {}).finally(() => setLoading(false))
    } else setLoading(false)
    return () => WebApp.BackButton.hide()
  }, [user?.id])

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const recentAchievements = unlockedAchievements.slice(-3).reverse()
  const lvl = LEVEL_LABELS[user?.level || '3'] || LEVEL_LABELS['3']

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Профиль" />
      <div className="px-3 pt-1.5 pb-4 space-y-3">

        {/* Profile header */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, #111B2E 60%, #0A0E14 100%)' }}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/15 blur-2xl" />
          <div className="flex items-center gap-3">
            <Avatar user={user} size="xl" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-text-1 truncate">
                {user?.first_name} {user?.last_name || ''}
              </h1>
              {user?.username && (
                <p className="text-xs text-text-3 truncate">@{user.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${lvl.color}18`, color: lvl.color }}>
                  {lvl.label} ({user?.level || 3}-деңгей)
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2.5">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { Icon: Zap, label: 'XP', value: stats?.total_score || 0, color: 'text-primary' },
                { Icon: Flame, label: 'Жолақ', value: stats?.streak || 0, color: 'text-warning' },
                { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-success' },
                { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-secondary' },
              ].map((s, i) => (
                <div key={i} className="card p-2.5 text-center">
                  <s.Icon size={16} strokeWidth={1.5} className={`mx-auto mb-0.5 ${s.color}`} />
                  <div className="text-base font-bold text-text-1">{s.value}</div>
                  <div className="text-[9px] text-text-3">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Streak bar */}
            {(stats?.streak || 0) > 0 && (
              <div className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                  <Flame size={20} strokeWidth={1.5} className="text-warning" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-text-1">{stats.streak} күн қатар</div>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.min(stats.streak, 7) ? 'bg-warning' : 'bg-surface-2'}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Tutor Summary */}
            <div className="card p-3 border-primary/20" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06) 0%, #1A1A2E 100%)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} strokeWidth={1.5} className="text-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Репетитор</span>
                </div>
                <button onClick={fetchAiSummary} disabled={aiLoading}
                  className="flex items-center gap-1 text-[10px] text-primary font-semibold pressable">
                  <RefreshCw size={10} className={aiLoading ? 'animate-spin' : ''} />
                  {aiSummary ? 'Жаңарту' : 'Талдау алу'}
                </button>
              </div>
              {aiLoading ? (
                <div className="space-y-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="bg-surface-2 rounded-lg p-2.5 space-y-1.5">
                      <div className="skeleton h-3 rounded w-1/3" />
                      <div className="skeleton h-3 rounded w-full" />
                      <div className="skeleton h-3 rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : aiSummary ? (
                <div className="space-y-2">
                  {aiSummary.split(/(?=📊|💪|⚠️|📋|🔥)/).filter(Boolean).map((section, i) => {
                    const lines = section.trim().split('\n').filter(Boolean)
                    const title = lines[0] || ''
                    const body = lines.slice(1).join('\n').trim()
                    const colors = {
                      '📊': { bg: 'bg-primary/5', border: 'border-primary/15', text: 'text-primary' },
                      '💪': { bg: 'bg-success/5', border: 'border-success/15', text: 'text-success' },
                      '⚠️': { bg: 'bg-warning/5', border: 'border-warning/15', text: 'text-warning' },
                      '📋': { bg: 'bg-info/5', border: 'border-info/15', text: 'text-info' },
                      '🔥': { bg: 'bg-secondary/5', border: 'border-secondary/15', text: 'text-secondary' },
                    }
                    const emoji = title.slice(0, 2)
                    const style = colors[emoji] || colors['📊']
                    return (
                      <div key={i} className={`rounded-xl p-2.5 border ${style.bg} ${style.border}`}>
                        <p className={`text-[11px] font-bold mb-1 ${style.text}`}>{title}</p>
                        {body && <p className="text-[11px] text-text-2 leading-relaxed whitespace-pre-line">{body}</p>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-3">"Талдау алу" батырмасын басыңыз — AI репетитор сіздің нәтижелеріңізді талдап, жеке кеңес береді.</p>
              )}
            </div>

            {/* Achievements preview */}
            <div>
              <button onClick={() => navigate('/achievements')} className="flex items-center justify-between w-full mb-2 pressable">
                <div className="flex items-center gap-1">
                  <Award size={12} strokeWidth={1.5} className="text-warning" />
                  <p className="text-[10px] font-semibold text-text-2 uppercase tracking-wider">Жетістіктер</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                  {unlockedAchievements.length}/{achievements.length}
                  <ChevronRight size={12} strokeWidth={1.5} className="text-primary" />
                </div>
              </button>
              {achievements.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {(recentAchievements.length > 0 ? recentAchievements : achievements.slice(0, 4)).map(a => (
                    <div key={a.code} className={`card px-3 py-2 text-center flex-shrink-0 min-w-[80px] ${a.unlocked ? '' : 'opacity-40'}`}
                      style={a.unlocked ? { borderColor: `${a.color}30` } : {}}>
                      <span className="text-xl">{a.unlocked ? a.icon : <Lock size={16} className="mx-auto text-text-3" />}</span>
                      <p className="text-[9px] font-semibold text-text-1 mt-0.5 truncate">{a.name_kz}</p>
                    </div>
                  ))}
                  <button onClick={() => navigate('/achievements')}
                    className="card px-3 py-2 text-center flex-shrink-0 min-w-[80px] flex flex-col items-center justify-center pressable">
                    <ChevronRight size={16} className="text-primary" />
                    <p className="text-[9px] font-semibold text-primary mt-0.5">Барлығы</p>
                  </button>
                </div>
              ) : (
                <div className="card p-3 text-center">
                  <p className="text-xs text-text-3">Тест тапсырып, жетістіктерді ашыңыз!</p>
                </div>
              )}
            </div>

            {/* Tabs: Topics / Tests */}
            <div className="flex gap-1 mb-1">
              {['Тақырыптар', 'Соңғы тесттер'].map((t, i) => (
                <button key={t} onClick={() => { setTab(i); WebApp.HapticFeedback.impactOccurred('light') }}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${i === tab ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface text-text-2 border border-border'}`}>
                  {t}
                </button>
              ))}
            </div>

            {reviewData && (
              <div className="page-enter">
                <button onClick={() => setReviewData(null)} className="flex items-center gap-1 text-xs text-primary font-semibold mb-2 pressable">
                  <ArrowLeft size={14} /> Артқа
                </button>
                <div className="space-y-2">
                  {reviewData.questions.map((q, i) => (
                    <div key={i} className={`card p-3 border ${q.correct ? 'border-success/20' : 'border-danger/20'}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {i + 1}. {q.correct ? 'Дұрыс' : 'Қате'}
                        </span>
                        <span className="text-[9px] text-text-3">{q.topic}</span>
                      </div>
                      <p className="text-xs text-text-1 mb-1.5"><FormulaRenderer text={q.question} /></p>
                      <QuestionMedia imageUrl={q.image_url} tableData={q.table_data} />
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          let cls = 'bg-surface border-border text-text-2'
                          if (oi === q.correct_answer) cls = 'bg-success/10 border-success text-success'
                          else if (oi === q.your_answer && !q.correct) cls = 'bg-danger/10 border-danger text-danger'
                          return (
                            <div key={oi} className={`rounded-lg px-2.5 py-1.5 border text-[11px] flex items-center gap-2 ${cls}`}>
                              <span className="font-bold w-4">{String.fromCharCode(65 + oi)}</span>
                              <FormulaRenderer text={opt} />
                            </div>
                          )
                        })}
                      </div>
                      {!q.correct && q.explanation && (
                        <div className="mt-2 bg-surface-2 rounded-lg px-2.5 py-1.5 border border-border">
                          <p className="text-[10px] text-primary font-semibold mb-0.5">Түсіндірме:</p>
                          <p className="text-[11px] text-text-2"><FormulaRenderer text={q.explanation} /></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!reviewData && tab === 0 ? (
              <>
                {/* Topic mastery */}
                {(analytics?.topic_mastery?.length > 0 || stats?.topics?.length > 0) && (
                  <div className="space-y-2">
                    {(analytics?.topic_mastery?.length > 0 ? analytics.topic_mastery : stats?.topics || []).map((t, i) => {
                      const hasMastery = !!t.accuracy
                      const acc = hasMastery ? t.accuracy : t.percent
                      const trend = t.trend
                      const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
                      const trendColor = trend === 'improving' ? 'text-success' : trend === 'declining' ? 'text-error' : 'text-text-3'
                      const barColor = acc >= 70 ? 'success' : acc >= 40 ? 'warning' : 'error'

                      return (
                        <div key={i} className={`card p-3 ${trend === 'declining' ? 'border-error/20' : ''}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-text-1 truncate mr-2">{t.name}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {hasMastery && trend && trend !== 'new' && (
                                <TrendIcon size={12} strokeWidth={2} className={trendColor} />
                              )}
                              <span className={`text-[10px] font-semibold ${acc >= 70 ? 'text-success' : acc >= 40 ? 'text-warning' : 'text-error'}`}>
                                {Math.round(acc)}%
                              </span>
                            </div>
                          </div>
                          <ProgressBar value={acc} max={100} color={barColor} />
                          {hasMastery && t.attempts >= 3 && (
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[9px] text-text-3">Соңғы 5: {Math.round(t.last_5_accuracy)}%</span>
                              <span className="text-[9px] text-text-3">Деңгей: {t.estimated_level}/6</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Weak topics */}
                {analytics?.weak_topics?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <AlertTriangle size={12} strokeWidth={1.5} className="text-warning" />
                      <p className="text-[10px] font-semibold text-warning uppercase tracking-wider">Әлсіз тақырыптар</p>
                    </div>
                    <div className="space-y-1.5">
                      {(analytics.topic_mastery || []).filter(t => analytics.weak_topics.includes(t.topic_id)).map((t, i) => (
                        <button
                          key={i}
                          onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); navigate(`/test?topic=${t.topic_id}`) }}
                          className="w-full card p-3 border-warning/20 text-left pressable"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-text-1">{t.name}</p>
                              <p className="text-[10px] text-warning">Дәлдік: {Math.round(t.last_5_accuracy)}% · Жаттығу қажет</p>
                            </div>
                            <ChevronRight size={14} strokeWidth={1.5} className="text-warning flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Recent tests */
              !reviewData && stats?.recent_tests?.length > 0 ? (
                <div className="space-y-1.5">
                  {stats.recent_tests.map((t, i) => (
                    <button key={i} onClick={() => handleReview(t.id)}
                      className="w-full card px-3 py-2.5 flex items-center justify-between pressable text-left">
                      <div>
                        <span className="text-xs text-text-2">{t.date}</span>
                        <span className="text-[10px] text-text-3 ml-2">{t.correct}/{t.total} дұрыс</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${t.score >= 70 ? 'text-success' : 'text-secondary'}`}>{t.score}%</span>
                        <ChevronRight size={12} className={`${t.score >= 70 ? 'text-success' : 'text-secondary'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="card p-4 text-center">
                  <Brain size={32} strokeWidth={1} className="mx-auto text-text-3 mb-1.5" />
                  <p className="text-xs text-text-3">Әлі тест тапсырылмаған</p>
                </div>
              )
            )}

            {/* Average score */}
            {(stats?.avg_score || 0) > 0 && (
              <div className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={20} strokeWidth={1.5} className="text-success" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-1">Орташа балл: {stats.avg_score}%</div>
                  <div className="text-[10px] text-text-3">
                    {stats.avg_score >= 70 ? 'Тамаша нәтиже!' : stats.avg_score >= 50 ? 'Жақсы, жалғастырыңыз!' : 'Тырысыңыз, жаттығу жалғасын!'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
