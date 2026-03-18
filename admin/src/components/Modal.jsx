import { X } from 'lucide-react'

export default function Modal({ open, title, onClose, children, width = 'max-w-2xl' }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div
                className={`card w-full ${width} animate-[fadeIn_0.2s_ease]`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <button className="rounded-lg p-1.5 text-text-2 hover:bg-surface-2" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
            </div>
        </div>
    )
}