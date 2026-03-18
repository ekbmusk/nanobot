import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const initialForm = {
    topic: 'Кинематика',
    question: '',
    options: ['', '', '', ''],
    correct_option: 'A',
    explanation: '',
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
            { key: 'topic', label: 'Тақырып', sortable: true },
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
            topic: row.topic || 'Кинематика',
            question: row.question || '',
            options: row.options || ['', '', '', ''],
            correct_option: row.correct_option || 'A',
            explanation: row.explanation || '',
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
        const csv = 'topic,question,option_a,option_b,option_c,option_d,correct_answer,explanation\nКинематика,Жылдамдық формуласы?,s/t,v/t,F/m,m/a,A,Қарапайым сұрақ'
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
                        <option value="">Барлық тақырып</option>
                        <option value="Кинематика">Кинематика</option>
                        <option value="Динамика">Динамика</option>
                        <option value="Статика">Статика</option>
                        <option value="Энергия">Энергия</option>
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
                            <label className="mb-1.5 block text-sm text-text-2">Тақырып</label>
                            <input className="input" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} />
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
