import { BlockMath } from 'react-katex'

export default function FormulaPreview({ value }) {
    if (!value?.trim()) {
        return (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-3">
                Формула preview осы жерде көрінеді
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <BlockMath math={value} />
        </div>
    )
}