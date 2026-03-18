import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { adminAPI } from '../api/admin'

const EMPTY_STATS = {
  total_users: 0,
  total_problems: 0,
  total_tests: 0,
  active_today: 0,
  new_users_daily: [],
  problems_by_topic: [],
  recent_activity: [],
}

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminAPI.getStats()
        setStats({ ...EMPTY_STATS, ...data })
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const cards = [
    { label: 'Барлық қолданушы', value: stats.total_users },
    { label: 'Есеп саны', value: stats.total_problems },
    { label: 'Тест саны', value: stats.total_tests },
    { label: 'Бүгін белсенді', value: stats.active_today },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-sm text-text-2">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{loading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card h-80 p-4">
          <h3 className="mb-3 text-sm font-semibold">Соңғы 30 күн: жаңа қолданушылар</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={stats.new_users_daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="#8B8FA8" />
              <YAxis stroke="#8B8FA8" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-80 p-4">
          <h3 className="mb-3 text-sm font-semibold">Тақырып бойынша шешілген есептер</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.problems_by_topic}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="topic" stroke="#8B8FA8" />
              <YAxis stroke="#8B8FA8" />
              <Tooltip />
              <Bar dataKey="count" fill="#43E97B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold">Соңғы тіркелген 10 қолданушы</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-text-2">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Аты</th>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Күні</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity?.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3">{item.id}</td>
                    <td className="px-4 py-3">{item.first_name || '-'}</td>
                    <td className="px-4 py-3">@{item.username || '-'}</td>
                    <td className="px-4 py-3 text-text-2">{item.created_at || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">Жылдам әрекет</h3>
          <div className="space-y-2">
            <Link className="btn-secondary block text-center" to="/problems">
              Есеп қосу
            </Link>
            <Link className="btn-secondary block text-center" to="/tests">
              Тест қосу
            </Link>
            <Link className="btn-secondary block text-center" to="/notifications">
              Broadcast жіберу
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
