import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import {
  Users, BarChart2, BookOpen, Brain, ChevronRight, ChevronLeft, Search,
  Flame, Trophy, MessageCircle, Target, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Clock, Activity, ArrowLeft,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import FormulaRenderer from '../components/FormulaRenderer'
import { useUserStore } from '../store/userStore'
import { adminAPI } from '../api/admin'

const ADMIN_IDS = [876371171, 6433578212]

function StatCard({ icon: Icon, label, value, accent = '#06B6D4' }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${accent}20` }}>
        <Icon size={18} strokeWidth={1.5} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-lg font-bold text-text-1">{value}</p>
        <p className="text-[10px] text-text-3">{label}</p>
      </div>
    </div>
  )
}

function MiniBar({ data, maxVal }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t bg-primary/70 transition-all"
            style={{ height: `${maxVal ? (d.count / maxVal) * 100 : 0}%`, minHeight: d.count ? 4 : 0 }}
          />
          <span className="text-[8px] text-text-3">{d.date}</span>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard View ──────────────────────────────────────────────

function DashboardView({ stats, onViewUsers }) {
  if (!stats) return <div className="text-center py-12 text-text-3 text-xs">Жүктелуде...</div>

  const maxTests = Math.max(...stats.tests_by_day.map(d => d.count), 1)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Users} label="Пайдаланушылар" value={stats.total_users} accent="#06B6D4" />
        <StatCard icon={Brain} label="Тесттер тапсырылды" value={stats.total_tests_taken} accent="#10B981" />
        <StatCard icon={BookOpen} label="Сұрақтар" value={stats.total_questions} accent="#F59E0B" />
        <StatCard icon={Target} label="Есептер" value={stats.total_problems} accent="#EF4444" />
      </div>

      <div className="bg-surface border border-border rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-text-1">Белсенділік</p>
          <Activity size={14} className="text-text-3" />
        </div>
        <div className="flex gap-4 mb-3">
          <div>
            <p className="text-lg font-bold text-primary">{stats.active_today}</p>
            <p className="text-[10px] text-text-3">Бүгін</p>
          </div>
          <div>
            <p className="text-lg font-bold text-success">{stats.active_week}</p>
            <p className="text-[10px] text-text-3">Аптада</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3">
        <p className="text-xs font-semibold text-text-1 mb-2">Тесттер (7 күн)</p>
        <MiniBar data={stats.tests_by_day} maxVal={maxTests} />
      </div>

      {stats.hardest_questions?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <p className="text-xs font-semibold text-text-1">Ең қиын сұрақтар</p>
          </div>
          <div className="space-y-1.5">
            {stats.hardest_questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2">
                <span className="text-[10px] text-danger font-bold w-8">{q.rate}%</span>
                <p className="text-[11px] text-text-2 line-clamp-1 flex-1">
                  <FormulaRenderer text={q.question} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onViewUsers}
        className="w-full bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between pressable"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Пайдаланушылар тізімі</span>
        </div>
        <ChevronRight size={16} className="text-primary" />
      </button>
    </div>
  )
}

// ── User List View ──────────────────────────────────────────────

function UserListView({ onSelectUser, onBack }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getUserList({ page, per_page: 20, search })
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page, search])

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-primary mb-1 pressable">
        <ArrowLeft size={14} /> Басты панель
      </button>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          type="text"
          placeholder="Іздеу..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-text-1 placeholder:text-text-3 outline-none focus:border-primary"
        />
      </div>

      <p className="text-[10px] text-text-3">{total} пайдаланушы</p>

      {loading ? (
        <div className="text-center py-8 text-text-3 text-xs">Жүктелуде...</div>
      ) : (
        <div className="space-y-1.5">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); onSelectUser(u.id) }}
              className="w-full bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2.5 pressable text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {(u.first_name || '?')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-1 truncate">
                  {u.first_name} {u.last_name || ''}
                </p>
                <p className="text-[10px] text-text-3 truncate">
                  {u.username ? `@${u.username}` : `ID: ${u.telegram_id}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-primary">{u.score} XP</p>
                <div className="flex items-center gap-1 justify-end">
                  <Flame size={10} className="text-warning" />
                  <span className="text-[10px] text-text-3">{u.streak}</span>
                  <span className="text-[10px] text-text-3 ml-1">{formatDate(u.last_activity)}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-text-3 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg bg-surface border border-border disabled:opacity-30 pressable">
            <ChevronLeft size={14} className="text-text-2" />
          </button>
          <span className="text-xs text-text-2">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg bg-surface border border-border disabled:opacity-30 pressable">
            <ChevronRight size={14} className="text-text-2" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── User Detail View ────────────────────────────────────────────

const DETAIL_TABS = [
  { id: 'general', label: 'Жалпы' },
  { id: 'tests', label: 'Тесттер' },
  { id: 'accuracy', label: 'Дәлдік' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'ai', label: 'AI Чат' },
]

function UserDetailView({ userId, onBack }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('general')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminAPI.getUserActivity(userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="text-center py-12 text-text-3 text-xs">Жүктелуде...</div>
  if (!data) return <div className="text-center py-12 text-danger text-xs">Қате орын алды</div>

  const { general: g, tests, topic_accuracy, progress, ai_chat, summary } = data

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-primary mb-1 pressable">
        <ArrowLeft size={14} /> Тізімге қайту
      </button>

      {/* User header */}
      <div className="bg-surface border border-border rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {(g.first_name || '?')[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-text-1">{g.first_name} {g.last_name || ''}</p>
            <p className="text-[10px] text-text-3">{g.username ? `@${g.username}` : `ID: ${g.telegram_id}`}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="bg-surface border border-border rounded-lg p-2 text-center">
          <Trophy size={14} className="text-warning mx-auto mb-0.5" />
          <p className="text-xs font-bold text-text-1">{summary.best_score}%</p>
          <p className="text-[8px] text-text-3">Үздік</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-2 text-center">
          <TrendingDown size={14} className="text-danger mx-auto mb-0.5" />
          <p className="text-xs font-bold text-text-1">{summary.worst_score}%</p>
          <p className="text-[8px] text-text-3">Төмен</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-2 text-center">
          <MessageCircle size={14} className="text-primary mx-auto mb-0.5" />
          <p className="text-xs font-bold text-text-1">{summary.ai_questions}</p>
          <p className="text-[8px] text-text-3">AI сұрақ</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-2 text-center">
          <Flame size={14} className="text-warning mx-auto mb-0.5" />
          <p className="text-xs font-bold text-text-1">{g.streak}</p>
          <p className="text-[8px] text-text-3">Streak</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {DETAIL_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`chip flex-shrink-0 border text-[10px] ${tab === t.id ? 'bg-primary text-white border-primary' : 'bg-surface text-text-2 border-border'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'general' && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          {[
            ['Деңгей', `${g.level}-деңгей`],
            ['Ұпай', `${g.score} XP`],
            ['Тақырыптар', `${g.topics_started} бастаған`],
            ['Тесттер', `${summary.total_tests} тапсырған`],
            ['Тіркелген', g.created_at ? new Date(g.created_at).toLocaleDateString('kk') : '—'],
            ['Соңғы белсенділік', g.last_activity ? new Date(g.last_activity).toLocaleDateString('kk') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-[11px] text-text-3">{k}</span>
              <span className="text-[11px] text-text-1 font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'tests' && (
        <div className="space-y-1.5">
          {tests.length === 0 && <p className="text-xs text-text-3 text-center py-4">Тест тапсырмаған</p>}
          {tests.map(t => (
            <div key={t.id} className="bg-surface border border-border rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-3">{t.date ? new Date(t.date).toLocaleDateString('kk') : ''}</span>
                <span className={`text-xs font-bold ${t.percentage >= 70 ? 'text-success' : t.percentage >= 40 ? 'text-warning' : 'text-danger'}`}>
                  {t.percentage}% ({t.correct}/{t.total})
                </span>
              </div>
              {t.wrong_questions.length > 0 && (
                <div className="mt-1 pt-1 border-t border-border">
                  <p className="text-[9px] text-danger font-semibold mb-0.5">Қате жауаптар:</p>
                  {t.wrong_questions.map((q, i) => (
                    <p key={i} className="text-[10px] text-text-3 line-clamp-1">• <FormulaRenderer text={q} /></p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'accuracy' && (
        <div className="space-y-1.5">
          {topic_accuracy.length === 0 && <p className="text-xs text-text-3 text-center py-4">Деректер жоқ</p>}
          {topic_accuracy.sort((a, b) => a.accuracy - b.accuracy).map(t => (
            <div key={t.topic_id} className="bg-surface border border-border rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-text-1 font-medium">{t.topic_name}</span>
                <span className={`text-xs font-bold ${t.accuracy >= 70 ? 'text-success' : t.accuracy >= 40 ? 'text-warning' : 'text-danger'}`}>
                  {t.accuracy}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${t.accuracy}%`,
                    background: t.accuracy >= 70 ? '#10B981' : t.accuracy >= 40 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <p className="text-[9px] text-text-3 mt-0.5">{t.correct}/{t.total} дұрыс · {t.level}-деңгей</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-1.5">
          {progress.length === 0 && <p className="text-xs text-text-3 text-center py-4">Деректер жоқ</p>}
          {progress.map(p => (
            <div key={p.topic_id} className="bg-surface border border-border rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-text-1 font-medium">{p.topic_name}</span>
                <span className="text-xs font-bold text-primary">{p.completion}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.completion}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-1.5">
          {ai_chat.length === 0 && <p className="text-xs text-text-3 text-center py-4">AI чат тарихы жоқ</p>}
          {ai_chat.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl p-2.5 text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/10 border border-primary/20 text-text-1 ml-6'
                  : 'bg-surface border border-border text-text-2 mr-6'
              }`}
            >
              <FormulaRenderer text={msg.content} />
              <p className="text-[8px] text-text-3 mt-1">{msg.date ? new Date(msg.date).toLocaleString('kk') : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Admin Page ─────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [view, setView] = useState('dashboard') // dashboard | users | user-detail
  const [stats, setStats] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)

  const isAdmin = user && ADMIN_IDS.includes(user.id)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
      return
    }
    adminAPI.getStats().then(setStats).catch(() => {})
  }, [isAdmin])

  if (!isAdmin) return null

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar showBack={view !== 'dashboard'} onBack={() => {
        if (view === 'user-detail') setView('users')
        else if (view === 'users') setView('dashboard')
        else navigate('/')
      }} title="Басқару панелі" />
      <div className="px-3 pt-1.5 pb-4">
        {view === 'dashboard' && (
          <DashboardView stats={stats} onViewUsers={() => setView('users')} />
        )}
        {view === 'users' && (
          <UserListView
            onSelectUser={(id) => { setSelectedUserId(id); setView('user-detail') }}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'user-detail' && selectedUserId && (
          <UserDetailView userId={selectedUserId} onBack={() => setView('users')} />
        )}
      </div>
    </div>
  )
}

export { ADMIN_IDS }
