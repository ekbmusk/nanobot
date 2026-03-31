import { useState, useEffect, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { Send, Bot, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import FormulaRenderer from '../components/FormulaRenderer'
import { aiAPI } from '../api/ai'
import { useUserStore } from '../store/userStore'

const EXAMPLES = [
  "Атом құрылысын түсіндір",
  "Де Бройль толқын ұзындығы қалай есептеледі?",
  "Графен дегеніміз не?",
  "Наноботтар медицинада қалай қолданылады?",
]

const hasFormula = (text) =>
  text.includes('$$') || text.includes('\\(') || text.includes('\\[') ||
  /\$[^$\n]+\$/.test(text)

export default function AskAI() {
  const { user } = useUserStore()
  const WELCOME = { role: 'assistant', content: 'Сәлем! Мен физика және нанотехнология репетиторымын. Қазақ тілінде жауап беремін. Кез келген физика сұрағыңды жаз!' }
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    aiAPI.getHistory(user.id).then(history => {
      if (history.length > 0) setMessages(history)
    }).catch(() => {})
  }, [user?.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    WebApp.HapticFeedback.impactOccurred('light')
    setMessages(m => [...m, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await aiAPI.askQuestion({ question: content, telegram_id: user?.id })
      setMessages(m => [...m, { role: 'assistant', content: res.answer }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Қате орын алды. Қайтадан көріңіз.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col bg-bg page-enter h-screen-safe">
      <TopBar />

      <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`flex mb-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center mr-1.5 flex-shrink-0 mt-auto shadow-glow-primary">
                  <Bot size={14} strokeWidth={1.5} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                isUser ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-border text-text-1 rounded-bl-sm'}`}>
                {!isUser && hasFormula(msg.content)
                  ? <FormulaRenderer text={msg.content} />
                  : <span className="whitespace-pre-wrap break-word">{msg.content}</span>
                }
              </div>
            </div>
          )
        })}

        {messages.length === 1 && (
          <div className="mt-3 animate-fade-in">
            <div className="flex items-center gap-1 justify-center mb-2">
              <Sparkles size={12} strokeWidth={1.5} className="text-text-3" />
              <p className="text-[10px] text-text-3">Мысал сұрақтар</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {EXAMPLES.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-[11px] bg-surface text-primary border border-primary/25 rounded-full px-2.5 py-1 pressable">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start mb-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center mr-1.5 flex-shrink-0">
              <Bot size={14} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-3 py-2.5">
              <div className="flex gap-1">{[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 pt-1.5 border-t border-border flex-shrink-0" style={{ paddingBottom: 'calc(64px + max(4px, env(safe-area-inset-bottom)))' }}>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Физика сұрағыңды жаз..."
              className="w-full bg-transparent text-text-1 text-xs outline-none placeholder:text-text-3" />
          </div>
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary disabled:opacity-30 disabled:shadow-none pressable flex-shrink-0">
            <Send size={16} strokeWidth={2} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
