import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const PISA_DOMAINS = [
    { value: 'atomic_structure', label: 'Атом құрылысы (Atomic Structure)' },
    { value: 'quantum_basics', label: 'Кванттық физика негіздері (Quantum Basics)' },
    { value: 'nanomaterials', label: 'Наноматериалдар (Nanomaterials)' },
    { value: 'nano_applications', label: 'Нанотехнология қолданыстары (Nano Applications)' },
]

const initialForm = {
    topic: 'atomic_structure',
    question: '',
    options: ['', '', '', ''],
    correct_option: 'A',
    explanation: '',
    image_url: '',
    table_data: null,
}

export default function Tests() {
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [items, setItems] = useState([])
    const [filters, setFilters] = useState({ topic: '', search: '' })
    const [editing, setEditing] = useState(null)
    const [openModal, setOpenModal] = useState(false)
    const [confirmId, setConfirmId] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [csvFile, setCsvFile] = useState(null)

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
            { key: 'question', label: 'Сұрақ', render: (row) => <p className="max-w-xl truncate">{row.question}</p> },
            { key: 'correct_option', label: 'Дұрыс жауап' },
        ],
        []
    )

    const load = async () => {
        try {
            const params = {
                page,
                page_size: 10,
            }

            if (filters.topic) params.topic = filters.topic
            if (filters.search.trim()) params.q = filters.search.trim()

            const data = await adminAPI.getTests(params)
            const mappedItems = (data.items || data.results || []).map((row) => ({
                ...row,
                options: [row.option_a, row.option_b, row.option_c, row.option_d],
            }))
            setItems(mappedItems)
            setTotal(data.total || data.meta?.total || 0)
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        load()
    }, [page, filters.topic, filters.search])

    const openCreate = () => {
        setEditing(null)
        setForm(initialForm)
        setOpenModal(true)
    }

    const openEdit = (row) => {
        setEditing(row)
        setForm({
            topic: row.topic || 'atomic_structure',
            question: row.question || '',
            options: row.options || ['', '', '', ''],
            correct_option: row.correct_option || 'A',
            explanation: row.explanation || '',
            image_url: row.image_url || '',
            table_data: row.table_data || null,
        })
        setOpenModal(true)
    }

    const toBackendPayload = (state) => ({
        topic: state.topic,
        question: state.question,
        option_a: state.options[0] || '',
        option_b: state.options[1] || '',
        option_c: state.options[2] || '',
        option_d: state.options[3] || '',
        correct_option: state.correct_option,
        explanation: state.explanation,
        image_url: state.image_url || null,
        table_data: state.table_data || null,
    })

    const onSubmit = async (event) => {
        event.preventDefault()
        try {
            const payload = toBackendPayload(form)
            if (editing?.id) {
                await adminAPI.updateTest(editing.id, payload)
                toast.success('Тест жаңартылды')
            } else {
                await adminAPI.createTest(payload)
                toast.success('Тест қосылды')
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
            await adminAPI.deleteTest(confirmId)
            toast.success('Тест жойылды')
            setConfirmId(null)
            load()
        } catch (error) {
            toast.error(error.message)
        }
    }

    const uploadCSV = async () => {
        if (!csvFile) return toast.error('CSV файл таңдаңыз')
        try {
            await adminAPI.bulkProblems(csvFile)
            toast.success('CSV импорт аяқталды')
            setCsvFile(null)
            load()
        } catch (error) {
            toast.error(error.message)
        }
    }

    const syncFromBank = async () => {
        try {
            const result = await adminAPI.syncTests()
            toast.success(`Sync аяқталды: +${result.created || 0}, skip ${result.skipped || 0}`)
            load()
        } catch (error) {
            toast.error(error.message)
        }
    }

    const downloadTemplate = () => {
        const csv = 'topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation\natomic_structure,Электрон құрлымы қандай?,1s2 2s2 2p6,1s2 2s2 2p5,1s2 2s2 2p4,1s2 2s2 2p3,A,Электрон құрлымын саралау'
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'tests_template.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-4">
            <div className="card p-4">
                <div className="grid gap-2 md:grid-cols-5">
                    <input
                        className="input md:col-span-2"
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
                    <button className="btn-secondary" onClick={downloadTemplate} type="button">
                        CSV үлгісі
                    </button>
                    <button className="btn-secondary" onClick={syncFromBank} type="button">
                        Mini App-тан sync
                    </button>
                    <button className="btn-primary" onClick={openCreate} type="button">
                        + Тест қосу
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="file" accept=".csv" onChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
                    <button className="btn-secondary" onClick={uploadCSV} type="button">
                        CSV import
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

            <Modal open={openModal} title={editing ? 'Тестті өзгерту' : 'Тест қосу'} onClose={() => setOpenModal(false)}>
                <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm text-text-2">Физика тақырыбы</label>
                            <select className="input" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}>
                                {PISA_DOMAINS.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm text-text-2">Дұрыс жауап</label>
                            <div className="flex gap-3">
                                {['A', 'B', 'C', 'D'].map((letter) => (
                                    <label key={letter} className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            checked={form.correct_option === letter}
                                            onChange={() => setForm((prev) => ({ ...prev, correct_option: letter }))}
                                        />
                                        {letter}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm text-text-2">Сұрақ</label>
                        <textarea
                            className="input min-h-20"
                            value={form.question}
                            onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
                        />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        {form.options.map((option, index) => (
                            <div key={index}>
                                <label className="mb-1.5 block text-sm text-text-2">{String.fromCharCode(65 + index)} нұсқа</label>
                                <input
                                    className="input"
                                    value={option}
                                    onChange={(event) => {
                                        const next = [...form.options]
                                        next[index] = event.target.value
                                        setForm((prev) => ({ ...prev, options: next }))
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm text-text-2">Сурет URL (міндетті емес)</label>
                        <input
                            className="input"
                            placeholder="https://..."
                            value={form.image_url}
                            onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                        />
                        {form.image_url && (
                            <img src={form.image_url} alt="Preview" className="mt-2 max-h-40 rounded-lg border border-border object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                        )}
                    </div>

                    <div>
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
                            <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
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

                    <div>
                        <label className="mb-1.5 block text-sm text-text-2">Түсіндірме</label>
                        <textarea
                            className="input min-h-20"
                            value={form.explanation}
                            onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))}
                        />
                    </div>

                    <div className="rounded-xl border border-border bg-surface-2 p-3">
                        <p className="mb-1 text-xs text-text-2">Mini App preview</p>
                        <p className="text-sm font-medium">{form.question || 'Сұрақ...'}</p>
                        <ul className="mt-2 space-y-1 text-sm text-text-2">
                            {form.options.map((option, index) => (
                                <li key={index}>
                                    {String.fromCharCode(65 + index)}. {option || '...'}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex justify-end gap-2">
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
                title="Тестті жою"
                description="Тест қайтарымсыз жойылады. Жалғастырасыз ба?"
            />
        </div>
    )
}
