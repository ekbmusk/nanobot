import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'

const TOOLBAR = [
  { label: 'B', wrap: '**' },
  { label: 'I', wrap: '_' },
  { label: '</>', wrap: '`' },
]

export default function Notifications() {
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({
    audience: 'all',
    level: '',
    message: '',
  })

  const loadHistory = async () => {
    try {
      const data = await adminAPI.getBroadcastHistory()
      setHistory(data.items || data || [])
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const applyFormat = (wrapper) => {
    if (!form.message.trim()) return
    setForm((prev) => ({ ...prev, message: `${wrapper}${prev.message}${wrapper}` }))
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      await adminAPI.sendBroadcast(form)
      toast.success('Broadcast жіберілді')
      setForm((prev) => ({ ...prev, message: '' }))
      loadHistory()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <form className="card space-y-4 p-4" onSubmit={submit}>
        <h3 className="text-sm font-semibold">Broadcast хабарлама</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-text-2">Аудитория</p>
            <div className="space-y-1 text-sm">
              {[
                { key: 'all', label: 'Барлық қолданушы' },
                { key: 'active', label: 'Белсенді' },
                { key: 'inactive', label: 'Белсенді емес' },
                { key: 'by_level', label: 'Деңгей бойынша' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.audience === item.key}
                    onChange={() => setForm((prev) => ({ ...prev, audience: item.key }))}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-text-2">Деңгей (қажет болса)</p>
            <input
              className="input"
              placeholder="beginner / intermediate / advanced"
              value={form.level}
              onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-text-2">Мәтін</p>
          <div className="mb-2 flex gap-2">
            {TOOLBAR.map((item) => (
              <button className="btn-secondary !px-3 !py-1" onClick={() => applyFormat(item.wrap)} type="button" key={item.label}>
                {item.label}
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-28"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Хабарлама жазыңыз..."
            required
          />
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-3">
          <p className="mb-1 text-xs text-text-2">Telegram preview</p>
          <p className="whitespace-pre-wrap text-sm">{form.message || 'Хабарлама preview...'}</p>
        </div>

        <button className="btn-primary" type="submit">
          Жіберу
        </button>
      </form>

      <div className="card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Жіберу тарихы</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-text-2">
              <tr>
                <th className="px-4 py-3 text-left">Күні</th>
                <th className="px-4 py-3 text-left">Аудитория</th>
                <th className="px-4 py-3 text-left">Жеткізілді</th>
                <th className="px-4 py-3 text-left">Қате</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.id || idx} className="border-t border-border">
                  <td className="px-4 py-3">{item.created_at || '-'}</td>
                  <td className="px-4 py-3">{item.audience || '-'}</td>
                  <td className="px-4 py-3">{item.delivered || 0}</td>
                  <td className="px-4 py-3">{item.failed || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
