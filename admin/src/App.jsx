import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import Problems from './pages/Problems'
import Tests from './pages/Tests'
import Theory from './pages/Theory'
import Users from './pages/Users'
import { clearAuthToken, getAuthToken } from './utils/auth'

const TITLES = {
    '/': 'Басқару панелі',
    '/problems': 'Есептер',
    '/tests': 'Тесттер',
    '/theory': 'Теория',
    '/users': 'Пайдаланушылар',
    '/notifications': 'Хабарландыру',
}

function ProtectedRoute({ children }) {
    const token = getAuthToken()
    const location = useLocation()

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return children
}

function AppLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const title = TITLES[location.pathname] || 'Admin'

    const handleLogout = () => {
        clearAuthToken()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-screen bg-bg text-text-1">
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex min-h-screen flex-1 flex-col">
                    <TopBar title={title} onLogout={handleLogout} />
                    <main className="flex-1 p-4 md:p-6">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/problems" element={<Problems />} />
                            <Route path="/tests" element={<Tests />} />
                            <Route path="/theory" element={<Theory />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/notifications" element={<Notifications />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}