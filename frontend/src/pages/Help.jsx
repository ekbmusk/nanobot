import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { BookOpen, FlaskConical, Brain, BarChart2, MessageCircle, Trophy, Lightbulb } from 'lucide-react'
import TopBar from '../components/TopBar'

const SECTIONS = [
  { Icon: BookOpen, title: 'Теория', color: '#06B6D4', desc: '4 тақырып: атом құрылысы, кванттық физика негіздері, наноматериалдар, нанотехнология қолданыстары.' },
  { Icon: FlaskConical, title: 'Есептер', color: '#10B981', desc: 'Деңгейлер: 1-ден 6-ға дейін. Жауапты цифрлық пернетақтамен енгіз.' },
  { Icon: Brain, title: 'Тест', color: '#38BDF8', desc: '10 сұрақтан тұратын тест. Таймер — 40 секунд.' },
  { Icon: BarChart2, title: 'Прогресс', color: '#8B5CF6', desc: 'Тақырыптар бойынша үлгерімді бақыла.' },
  { Icon: MessageCircle, title: 'AI Репетитор', color: '#F59E0B', desc: 'Физика жауаптары қазақ тілінде, формулалар LaTeX форматында.' },
  { Icon: Trophy, title: 'Рейтинг', color: '#EF4444', desc: 'Апта/ай/жалпы кестелер. Тест тапсырған сайын ұпай жиналады.' },
]

export default function Help() {
  const navigate = useNavigate()
  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    return () => WebApp.BackButton.hide()
  }, [])

  return (
    <div className="min-h-screen-safe bg-bg page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Көмек" />
      <div className="px-3 pt-1.5 pb-4">
        <h1 className="text-xl font-extrabold text-text-1 mb-0.5">Көмек</h1>
        <p className="text-xs text-text-2 mb-4">Қолданба нұсқаулығы</p>
        <div className="space-y-2">
          {SECTIONS.map((s, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-3 flex gap-3 items-start shadow-card"
              style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                <s.Icon size={18} strokeWidth={1.5} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-text-1 mb-0.5 text-xs">{s.title}</h3>
                <p className="text-[11px] text-text-2 leading-relaxed break-word">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl p-3 border border-primary/25 bg-primary-dim flex gap-2.5">
          <Lightbulb size={16} strokeWidth={1.5} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-2 leading-relaxed">
            <span className="text-primary font-semibold">Кеңес: </span>
            Күн сайын кем дегенде 1 тест тапсыр — ұпайың өседі!
          </p>
        </div>
        <div className="mt-4 text-center text-[10px] text-text-3">Нанотехнология негіздері v1.0 · Қазақстан</div>
      </div>
    </div>
  )
}
