const FORMULAS = ['F = ma', 'v = v_0 + at', 's = v_0t + \\frac{at^2}{2}', 'p = mv', 'E_k = \\frac{mv^2}{2}']

export default function LaTeXHelper({ onInsert }) {
    return (
        <div className="flex flex-wrap gap-2">
            {FORMULAS.map((formula) => (
                <button
                    key={formula}
                    className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text-2 hover:text-text-1"
                    onClick={() => onInsert?.(formula)}
                    type="button"
                >
                    {formula}
                </button>
            ))}
        </div>
    )
}