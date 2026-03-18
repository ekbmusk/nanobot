import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import FormulaPreview from '../components/FormulaPreview'
import LaTeXHelper from '../components/LaTeXHelper'
import Modal from '../components/Modal'

const initialForm = {
  topic: 'Кинематика',
  level: 'easy',
  question: '',
  answer: '',
  solution: '',
}

export default function Problems() {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [filters, setFilters] = useState({ topic: '', level: '', search: '' })
  const [editing, setEditing] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'topic', label: 'Тақырып', sortable: true },
      {
        key: 'level',
        label: 'Деңгей',
        render: (row) => ({ easy: 'Жеңіл', medium: 'Орта', hard: 'Күрделі' }[row.level] || row.level),
      },
      { key: 'question', label: 'Сұрақ', render: (row) => <p className="max-w-lg truncate">{row.question}</p> },
    ],
    []
  )

  const load = async () => {
    try {
      const data = await adminAPI.getProblems({ page, limit: 10, ...filters })
      setItems(data.items || data.results || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    load()
  }, [page, filters.topic, filters.level, filters.search])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setOpenModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      topic: row.topic || 'Кинематика',
      level: row.level || 'easy',
      question: row.question || '',
      answer: row.answer || '',
      solution: row.solution || '',
    })
    setOpenModal(true)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editing?.id) {
        await adminAPI.updateProblem(editing.id, form)
        toast.success('Есеп жаңартылды')
      } else {
        await adminAPI.createProblem(form)
        toast.success('Есеп қосылды')
      }
      setOpenModal(false)
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const onDelete = async () => {
    if (!confirmId) return
    try {
      await adminAPI.deleteProblem(confirmId)
      toast.success('Есеп жойылды')
      setConfirmId(null)
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <input
            className="input"
            placeholder="Іздеу..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select
            className="input"
            value={filters.topic}
            onChange={(event) => setFilters((prev) => ({ ...prev, topic: event.target.value }))}
          >
            <option value="">Барлық тақырып</option>
            <option value="Кинематика">Кинематика</option>
            <option value="Динамика">Динамика</option>
            <option value="Статика">Статика</option>
            <option value="Энергия">Энергия</option>
          </select>
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
          <button className="btn-primary" onClick={openCreate} type="button">
            + Есеп қосу
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
          <div className="flex gap-2">
            <button className="btn-secondary !px-3 !py-1.5" onClick={() => openEdit(row)}>
              Өзгерту
            </button>
            <button className="rounded-lg bg-danger px-3 py-1.5 text-white" onClick={() => setConfirmId(row.id)}>
              Жою
            </button>
          </div>
        )}
      />

      <Modal open={openModal} title={editing ? 'Есепті өзгерту' : 'Есеп қосу'} onClose={() => setOpenModal(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-text-2">Тақырып</label>
            <input className="input" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-2">Деңгей</label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map((level) => (
                <label key={level} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={form.level === level}
                    onChange={() => setForm((prev) => ({ ...prev, level }))}
                  />
                  {{ easy: 'Жеңіл', medium: 'Орта', hard: 'Күрделі' }[level]}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-text-2">Сұрақ</label>
            <textarea
              className="input min-h-24"
              value={form.question}
              onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-2">Жауап (LaTeX)</label>
            <input
              className="input"
              value={form.answer}
              onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
            />
            <LaTeXHelper onInsert={(formula) => setForm((prev) => ({ ...prev, answer: formula }))} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-2">Live preview</label>
            <FormulaPreview value={form.answer} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-text-2">Шешімі</label>
            <textarea
              className="input min-h-28"
              value={form.solution}
              onChange={(event) => setForm((prev) => ({ ...prev, solution: event.target.value }))}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setOpenModal(false)} type="button">
              Болдырмау
            </button>
            <button className="btn-primary" type="submit">
              Сақтау
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        onCancel={() => setConfirmId(null)}
        onConfirm={onDelete}
        title="Есепті жою"
        description="Есеп қайтарымсыз жойылады. Жалғастырасыз ба?"
      />
    </div>
  )
}
