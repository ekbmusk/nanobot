import { useState, useEffect, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { Send, Bot, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import FormulaRenderer from '../components/FormulaRenderer'
import { aiAPI } from '../api/ai'
import { useUserStore } from '../store/userStore'

const EXAMPLES = [
  "Ньютонның 2-заңын түсіндір",
  "Кинетикалық энергия формуласы",
  "Омның заңы дегеніміз не?",
  "Жарық жылдамдығы неше?",
]

const hasFormula = (text) =>
  text.includes('$$') || text.includes('\\(') || text.includes('\\[') ||
  /\$[^$\n]+\$/.test(text)

export default function AskAI() {
  const { user } = useUserStore()
  const WELCOME = { role: 'assistant', content: 'Сәлем! Мен физика репетиторымын. Қазақ тілінде жауап беремін. Кез келген физика сұрағыңды жаз!' }
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
    <div className="flex flex-col h-screen bg-bg page-enter">
      <TopBar />

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-4 no-scrollbar">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div key={i} className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center mr-2 flex-shrink-0 mt-auto shadow-glow-primary">
                  <Bot size={16} strokeWidth={1.5} className="text-white" />
                </div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-border text-text-1 rounded-bl-sm'}`}>
                {!isUser && hasFormula(msg.content)
                  ? <FormulaRenderer text={msg.content} />
                  : <span className="whitespace-pre-wrap">{msg.content}</span>
                }
              </div>
            </div>
          )
        })}

        {messages.length === 1 && (
          <div className="mt-4 animate-fade-in">
            <div className="flex items-center gap-1.5 justify-center mb-3">
              <Sparkles size={14} strokeWidth={1.5} className="text-text-3" />
              <p className="text-xs text-text-3">Мысал сұрақтар</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLES.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-xs bg-surface text-primary border border-primary/25 rounded-full px-3 py-1.5 pressable">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start mb-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3.5">
              <div className="flex gap-1.5">{[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-4 pt-2 border-t border-border" style={{ paddingBottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Физика сұрағыңды жаз..."
              className="w-full bg-transparent text-text-1 text-sm outline-none placeholder:text-text-3" />
          </div>
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-glow-primary disabled:opacity-30 disabled:shadow-none pressable flex-shrink-0">
            <Send size={18} strokeWidth={2} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
