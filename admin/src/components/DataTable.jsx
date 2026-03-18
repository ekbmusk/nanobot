import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function DataTable({
    columns,
    rows,
    actions,
    page = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
}) {
    const [sort, setSort] = useState({ key: null, direction: 'asc' })

    const sortedRows = useMemo(() => {
        if (!sort.key) return rows
        return [...rows].sort((a, b) => {
            const av = a?.[sort.key]
            const bv = b?.[sort.key]
            if (av === bv) return 0
            if (sort.direction === 'asc') return av > bv ? 1 : -1
            return av < bv ? 1 : -1
        })
    }, [rows, sort])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const toggleSort = (key) => {
        setSort((prev) => {
            if (prev.key !== key) return { key, direction: 'asc' }
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        })
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-surface-2/70 text-text-2">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                                    <button
                                        className="flex items-center gap-1"
                                        onClick={() => column.sortable && toggleSort(column.key)}
                                    >
                                        {column.label}
                                        {column.sortable && <ChevronsUpDown size={14} />}
                                    </button>
                                </th>
                            ))}
                            {actions && <th className="px-4 py-3">Әрекет</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-text-2">
                                    Мәлімет табылмады
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((row, index) => (
                                <tr key={row.id || index} className="border-t border-border">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3 align-top">
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                    {actions && <td className="px-4 py-3">{actions(row)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-text-2">
                <span>
                    Бет {page} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        className="btn-secondary !px-2 !py-1.5 disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => onPageChange?.(page - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className="btn-secondary !px-2 !py-1.5 disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange?.(page + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}