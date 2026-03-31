import { useNavigate, useLocation } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Home, BookOpen, FlaskConical, Brain, MessageCircle, Settings } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { ADMIN_IDS } from '../pages/Admin'

const TABS = [
  { path: '/', Icon: Home, label: 'Басты' },
  { path: '/theory', Icon: BookOpen, label: 'Теория' },
  { path: '/problems', Icon: FlaskConical, label: 'Есеп' },
  { path: '/test', Icon: Brain, label: 'Тест' },
  { path: '/ask-ai', Icon: MessageCircle, label: 'AI' },
]

const ADMIN_TAB = { path: '/admin', Icon: Settings, label: 'Admin' }

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useUserStore()
  const isAdmin = user && ADMIN_IDS.includes(user.id)
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

  const handleTab = (path) => {
    if (path === pathname) return
    WebApp.HapticFeedback.impactOccurred('light')
    navigate(path)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'rgba(10,14,20,0.94)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(6,182,212,0.06)',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5">
        {tabs.map(({ path, Icon, label }) => {
          const active = pathname === path
          return (
            <button key={path} onClick={() => handleTab(path)} className="tab-item flex-1 relative">
              {active && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.5}
                className={`transition-all duration-200 ${active ? 'text-primary' : 'text-text-3'}`}
              />
              <span className={`text-[9px] font-semibold mt-0.5 transition-colors duration-200 ${active ? 'text-primary' : 'text-text-3'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
