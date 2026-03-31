import {
    Bell,
    BookOpen,
    FileCheck,
    LayoutDashboard,
    Users,
    Wrench,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/problems', label: 'Есептер', icon: Wrench },
    { to: '/tests', label: 'Тесттер', icon: FileCheck },
    { to: '/theory', label: 'Теория', icon: BookOpen },
    { to: '/users', label: 'Пайдаланушылар', icon: Users },
    { to: '/notifications', label: 'Хабарландыру', icon: Bell },
]

export default function Sidebar() {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-4 md:block">
            <div className="mb-6 px-2">
                <h1 className="text-lg font-bold">Physics Nano Admin</h1>
                <p className="text-xs text-text-2">Басқару жүйесі</p>
            </div>

            <nav className="space-y-1">
                {ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                                ? 'bg-primary/20 text-white border border-primary/40'
                                : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
                            }`
                        }
                    >
                        <Icon size={16} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}