import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { BookOpen, Calculator, Brain, BarChart2, MessageCircle, Trophy, Lightbulb } from 'lucide-react'
import TopBar from '../components/TopBar'

const SECTIONS = [
  { Icon: BookOpen, title: 'Теория', color: '#6C63FF', desc: '6 тақырып: механика, термодинамика, электромагнетизм, оптика, кванттық, ядролық физика. Формулалар KaTeX арқылы.' },
  { Icon: Calculator, title: 'Есептер', color: '#FF6584', desc: 'Деңгейлер: жеңіл, орташа, күрделі. Жауапты цифрлық пернетақтамен енгіз.' },
  { Icon: Brain, title: 'Тест', color: '#43E97B', desc: '10 сұрақтан тұратын кездейсоқ тест. Таймер — 20 секунд. Нәтиже рейтингке қосылады.' },
  { Icon: BarChart2, title: 'Прогресс', color: '#38BDF8', desc: 'Тақырыптар бойынша үлгерімді бақыла. Жолақ, орташа нәтиже, соңғы тесттер.' },
  { Icon: MessageCircle, title: 'AI Репетитор', color: '#FFD93D', desc: 'GPT-4o негізіндегі чат-бот. Жауап қазақ тілінде, формулалар LaTeX форматында.' },
  { Icon: Trophy, title: 'Рейтинг', color: '#FF8FA3', desc: 'Апта/ай/жалпы кестелер. Тест тапсырған сайын ұпай жиналады.' },
]

export default function Help() {
  const navigate = useNavigate()
  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    return () => WebApp.BackButton.hide()
  }, [])

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Көмек" />
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Көмек</h1>
        <p className="text-sm text-text-2 mb-5">Қолданба нұсқаулығы</p>
        <div className="space-y-2.5">
          {SECTIONS.map((s, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex gap-4 items-start shadow-card"
              style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                <s.Icon size={20} strokeWidth={1.5} style={{ color: s.color }} />
              </div>
              <div>
                <h3 className="font-bold text-text-1 mb-1 text-sm">{s.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl p-4 border border-primary/25 bg-primary-dim flex gap-3">
          <Lightbulb size={18} strokeWidth={1.5} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-2 leading-relaxed">
            <span className="text-primary font-semibold">Кеңес: </span>
            Күн сайын кем дегенде 1 тест тапсыр — ұпайың өседі, рейтингің жоғарылайды!
          </p>
        </div>
        <div className="mt-6 text-center text-xs text-text-3">Physics Bot v2.0 · GPT-4o · Қазақстан</div>
      </div>
    </div>
  )
}
