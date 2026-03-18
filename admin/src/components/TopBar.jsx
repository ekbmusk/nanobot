import { LogOut } from 'lucide-react'

export default function TopBar({ title, onLogout }) {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:px-6">
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm font-medium">Admin</p>
                    <p className="text-xs text-text-2">Жүйе модераторы</p>
                </div>
                <button className="btn-secondary !px-3 !py-2" onClick={onLogout}>
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    )
}