import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { ChevronRight, BookOpen } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import FormulaRenderer from '../components/FormulaRenderer'
import { SkeletonCard } from '../components/SkeletonLoader'
import { theoryAPI } from '../api/theory'

const TOPICS = [
  { id: 'mechanics', label: 'Механика', accent: '#6C63FF', lessons: 12, preview: 'F = ma' },
  { id: 'thermodynamics', label: 'Термодинамика', accent: '#FF6584', lessons: 8, preview: 'Q = \\Delta U + A' },
  { id: 'electromagnetism', label: 'Электромагнетизм', accent: '#FFD93D', lessons: 10, preview: 'I = \\frac{U}{R}' },
  { id: 'optics', label: 'Оптика', accent: '#38BDF8', lessons: 6, preview: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2' },
  { id: 'quantum', label: 'Кванттық физика', accent: '#43E97B', lessons: 7, preview: 'E = h\\nu' },
  { id: 'nuclear', label: 'Ядролық физика', accent: '#FF8FA3', lessons: 5, preview: 'E = \\Delta m c^2' },
]
const TABS = ['Түсіндірме', 'Формулалар', 'Мини-тест']

function TopicDetail({ topic, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    theoryAPI.getTopicDetail(topic.id).then(setContent).catch(() => {}).finally(() => setLoading(false))
  }, [topic.id])

  const formulas = content?.subtopics?.flatMap(s => s.formulas || []) || []

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title={topic.label} />
      <div className="mx-4 mt-2 rounded-3xl p-5 mb-4" style={{ background: `linear-gradient(135deg, ${topic.accent}20 0%, #1A1A2E 100%)`, border: `1px solid ${topic.accent}25` }}>
        <BookOpen size={32} strokeWidth={1.5} style={{ color: topic.accent }} className="mb-2" />
        <h1 className="text-xl font-bold text-text-1">{topic.label}</h1>
        <p className="text-sm text-text-2 mt-1">{topic.lessons} сабақ</p>
      </div>

      <div className="flex gap-1.5 px-4 mb-4">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${i === tab ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface text-text-2 border border-border'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8">
        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : tab === 0 ? (
          <div className="space-y-3">
            {content?.subtopics?.map((sub, i) => (
              <Card key={i} className="p-4">
                <h3 className="font-bold text-text-1 mb-2">{sub.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{sub.description}</p>
              </Card>
            ))}
          </div>
        ) : tab === 1 ? (
          <div className="space-y-3">
            {formulas.map((f, i) => (
              <div key={i} className="formula-block">
                <p className="text-xs text-primary font-semibold mb-2">{f.name}</p>
                <FormulaRenderer formula={`$$${f.latex}$$`} glow />
                <p className="text-xs text-text-2 mt-2">{f.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <BookOpen size={40} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
            <p className="text-text-2 text-sm">Мини-тест жақында қосылады</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function Theory() {
  const [selected, setSelected] = useState(null)

  if (selected) return <TopicDetail topic={selected} onBack={() => setSelected(null)} />

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Теория</h1>
        <p className="text-sm text-text-2 mb-5">Тақырыпты таңдаңыз</p>

        <div className="space-y-3">
          {TOPICS.map((topic) => (
            <button key={topic.id} onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(topic) }}
              className="w-full pressable text-left">
              <div className="rounded-2xl p-4 border shadow-card" style={{ background: `linear-gradient(135deg, ${topic.accent}12 0%, #1A1A2E 100%)`, borderColor: `${topic.accent}25`, borderLeft: `3px solid ${topic.accent}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${topic.accent}18` }}>
                    <BookOpen size={20} strokeWidth={1.5} style={{ color: topic.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-text-1 text-sm mb-1">{topic.label}</div>
                    <div className="text-[11px] text-text-3 mb-2">{topic.lessons} сабақ</div>
                    <div className="text-xs">
                      <FormulaRenderer formula={`$${topic.preview}$`} inline />
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={1.5} style={{ color: topic.accent }} className="flex-shrink-0" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
