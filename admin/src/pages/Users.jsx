import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const formatUsername = (username) => (username ? `@${username}` : '-')

export default function Users() {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [filters, setFilters] = useState({ level: '', active: '', search: '' })
  const [selected, setSelected] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'first_name', label: 'Аты' },
      { key: 'username', label: 'Username', render: (row) => formatUsername(row.username) },
      { key: 'level', label: 'Деңгей' },
      {
        key: 'is_active',
        label: 'Белсенді',
        render: (row) => (
          <span className={row.is_active ? 'text-success' : 'text-text-2'}>{row.is_active ? 'Иә' : 'Жоқ'}</span>
        ),
      },
    ],
    []
  )

  const load = async () => {
    try {
      const params = {
        page,
        page_size: 10,
      }

      if (filters.level) params.level = filters.level
      if (filters.active !== '') params.active = filters.active
      if (filters.search.trim()) params.q = filters.search.trim()

      const data = await adminAPI.getUsers(params)
      setItems(data.items || data.results || [])
      setTotal(data.total || data.meta?.total || 0)
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    load()
  }, [page, filters.level, filters.active, filters.search])

  const viewProfile = async (id) => {
    try {
      const data = await adminAPI.getUserById(id)
      setSelected(data)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleBan = async (row) => {
    try {
      await adminAPI.toggleUserBan(row.id, { banned: !row.is_banned })
      toast.success('Ban статусы жаңарды')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleNotifications = async (row) => {
    try {
      await adminAPI.toggleNotifications(row.id, { notifications_enabled: !row.notifications_enabled })
      toast.success('Хабарландыру статусы жаңарды')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const exportCSV = async () => {
    try {
      const blob = await adminAPI.exportUsers()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'users_export.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const profile = selected?.user || selected

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid gap-2 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Аты немесе username..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select
            className="input"
            value={filters.level}
            onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))}
          >
            <option value="">Барлық деңгей</option>
            <option value="easy">Жеңіл</option>
            <option value="medium">Орта</option>
            <option value="hard">Күрделі</option>
          </select>
          <select
            className="input"
            value={filters.active}
            onChange={(event) => setFilters((prev) => ({ ...prev, active: event.target.value }))}
          >
            <option value="">Барлығы</option>
            <option value="true">Белсенді</option>
            <option value="false">Белсенді емес</option>
          </select>
          <button className="btn-secondary" onClick={exportCSV} type="button">
            CSV экспорт
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary !px-3 !py-1.5" onClick={() => viewProfile(row.id)}>
              Профиль
            </button>
            <button className="btn-secondary !px-3 !py-1.5" onClick={() => toggleNotifications(row)}>
              {row.notifications_enabled ? 'Notif off' : 'Notif on'}
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-white ${row.is_banned ? 'bg-success' : 'bg-danger'}`}
              onClick={() => toggleBan(row)}
            >
              {row.is_banned ? 'Unban' : 'Ban'}
            </button>
          </div>
        )}
      />

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Пайдаланушы профилі" width="max-w-3xl">
        {selected && (
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="card p-3">
              <p className="text-text-2">ID</p>
              <p className="font-semibold">{profile?.id ?? '-'}</p>
            </div>
            <div className="card p-3">
              <p className="text-text-2">Telegram ID</p>
              <p className="font-semibold">{profile?.telegram_id ?? '-'}</p>
            </div>
            <div className="card p-3">
              <p className="text-text-2">Аты</p>
              <p className="font-semibold">{profile?.first_name || '-'}</p>
            </div>
            <div className="card p-3">
              <p className="text-text-2">Username</p>
              <p className="font-semibold">{formatUsername(profile?.username)}</p>
            </div>
            <div className="card p-3 md:col-span-2">
              <p className="mb-2 text-text-2">Статистика</p>
              <pre className="overflow-auto text-xs text-text-2">
                {JSON.stringify(
                  {
                    tests_summary: selected.tests_summary,
                    progress_summary: selected.progress_summary,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
