import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import FormulaPreview from '../components/FormulaPreview'
import LaTeXHelper from '../components/LaTeXHelper'
import Modal from '../components/Modal'

const PISA_DOMAINS = [
  { value: 'atomic_structure', label: 'Атом құрылысы (Atomic Structure)' },
  { value: 'quantum_basics', label: 'Кванттық физика негіздері (Quantum Basics)' },
  { value: 'nanomaterials', label: 'Наноматериалдар (Nanomaterials)' },
  { value: 'nano_applications', label: 'Нанотехнология қолданыстары (Nano Applications)' },
]

const PISA_LEVELS = [1, 2, 3]

const initialForm = {
  topic: 'atomic_structure',
  difficulty: '1',
  question: '',
  correct_answer: '',
  formula: '',
  solution: '',
  image_url: '',
  table_data: null,
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
      {
        key: 'topic',
        label: 'Домен',
        sortable: true,
        render: (row) => {
          const domain = PISA_DOMAINS.find((d) => d.value === row.topic)
          return domain ? domain.label : row.topic
        },
      },
      {
        key: 'difficulty',
        label: 'Деңгей',
        render: (row) => `${row.difficulty}-деңгей`,
      },
      { key: 'question', label: 'Сұрақ', render: (row) => <p className="max-w-lg truncate">{row.question}</p> },
    ],
    []
  )

  const load = async () => {
    try {
      const data = await adminAPI.getProblems({ page, page_size: 10, ...filters })
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
      topic: row.topic || 'atomic_structure',
      difficulty: row.difficulty || '1',
      question: row.question || '',
      correct_answer: row.correct_answer || '',
      formula: row.formula || '',
      solution: row.solution || '',
      image_url: row.image_url || '',
      table_data: row.table_data || null,
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
            <option value="">Барлық домен</option>
            {PISA_DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.level}
            onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))}
          >
            <option value="">Барлық деңгей</option>
            {PISA_LEVELS.map((lvl) => (
              <option key={lvl} value={String(lvl)}>{lvl}-деңгей</option>
            ))}
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
            <label className="text-sm text-text-2">Физика тақырыбы</label>
            <select className="input" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}>
              {PISA_DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-2">Деңгей (1-6)</label>
            <div className="flex gap-2">
              {PISA_LEVELS.map((lvl) => (
                <label key={lvl} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={form.difficulty === String(lvl)}
                    onChange={() => setForm((prev) => ({ ...prev, difficulty: String(lvl) }))}
                  />
                  {lvl}
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
            <label className="text-sm text-text-2">Дұрыс жауап</label>
            <input
              className="input"
              value={form.correct_answer}
              onChange={(event) => setForm((prev) => ({ ...prev, correct_answer: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-2">Формула (LaTeX, міндетті емес)</label>
            <input
              className="input"
              value={form.formula}
              onChange={(event) => setForm((prev) => ({ ...prev, formula: event.target.value }))}
            />
            <LaTeXHelper onInsert={(formula) => setForm((prev) => ({ ...prev, formula }))} />
            <FormulaPreview value={form.formula} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-text-2">Сурет URL (міндетті емес)</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.image_url}
              onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            />
            {form.image_url && (
              <img src={form.image_url} alt="Preview" className="max-h-40 rounded-lg border border-border object-contain" onError={(e) => { e.target.style.display = 'none' }} />
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.table_data}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  table_data: e.target.checked ? { headers: ['', ''], rows: [['', '']] } : null,
                }))}
              />
              Кесте қосу
            </label>
            {form.table_data && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex gap-2 items-end">
                  {form.table_data.headers.map((h, i) => (
                    <input
                      key={`h-${i}`}
                      className="input flex-1 !text-xs font-semibold"
                      placeholder={`Бағана ${i + 1}`}
                      value={h}
                      onChange={(e) => {
                        const headers = [...form.table_data.headers]
                        headers[i] = e.target.value
                        setForm((prev) => ({ ...prev, table_data: { ...prev.table_data, headers } }))
                      }}
                    />
                  ))}
                  <button type="button" className="btn-secondary !px-2 !py-1.5 text-xs" onClick={() => setForm((prev) => ({
                    ...prev,
                    table_data: {
                      ...prev.table_data,
                      headers: [...prev.table_data.headers, ''],
                      rows: prev.table_data.rows.map((r) => [...r, '']),
                    },
                  }))}>+</button>
                </div>
                {form.table_data.rows.map((row, ri) => (
                  <div key={`r-${ri}`} className="flex gap-2">
                    {row.map((cell, ci) => (
                      <input
                        key={`c-${ri}-${ci}`}
                        className="input flex-1 !text-xs"
                        placeholder="—"
                        value={cell}
                        onChange={(e) => {
                          const rows = form.table_data.rows.map((r) => [...r])
                          rows[ri][ci] = e.target.value
                          setForm((prev) => ({ ...prev, table_data: { ...prev.table_data, rows } }))
                        }}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary !px-2 !py-1 text-xs" onClick={() => setForm((prev) => ({
                    ...prev,
                    table_data: {
                      ...prev.table_data,
                      rows: [...prev.table_data.rows, prev.table_data.headers.map(() => '')],
                    },
                  }))}>+ Жол</button>
                  {form.table_data.rows.length > 1 && (
                    <button type="button" className="text-xs text-danger" onClick={() => setForm((prev) => ({
                      ...prev,
                      table_data: { ...prev.table_data, rows: prev.table_data.rows.slice(0, -1) },
                    }))}>- Жол</button>
                  )}
                </div>
              </div>
            )}
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
