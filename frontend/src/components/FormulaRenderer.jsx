import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

const SafeInline = ({ math }) => {
  try { return <InlineMath math={math} /> }
  catch { return <code className="text-primary/80 text-sm font-mono bg-primary/10 px-1 rounded">{math}</code> }
}

const SafeBlock = ({ math }) => {
  try { return <BlockMath math={math} /> }
  catch { return <pre className="text-primary/80 text-sm font-mono bg-primary/10 p-2 rounded-lg overflow-x-auto">{math}</pre> }
}

/**
 * Renders mixed text with embedded LaTeX formulas.
 * Supports: $$...$$ (block), $...$ (inline), \[...\] (block), \(...\) (inline)
 */
export default function FormulaRenderer({ formula, text, inline = false, glow = false }) {
  const content = formula || text
  if (!content) return null

  // Pure inline mode
  if (inline) {
    const clean = content.replace(/^\$+/, '').replace(/\$+$/, '')
    return <SafeInline math={clean} />
  }

  // Split on formula delimiters
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([^)]+?\\\))/g
  const tokens = []
  let lastIdx = 0
  let key = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      const txt = content.slice(lastIdx, match.index)
      if (txt) tokens.push(<span key={key++} className="text-text-1 whitespace-pre-wrap text-sm leading-relaxed">{txt}</span>)
    }

    const raw = match[0]
    const isBlock = raw.startsWith('$$') || raw.startsWith('\\[')
    const inner = raw
      .replace(/^\$\$/, '').replace(/\$\$$/, '')
      .replace(/^\$/, '').replace(/\$$/, '')
      .replace(/^\\\[/, '').replace(/\\\]$/, '')
      .replace(/^\\\(/, '').replace(/\\\)$/, '')
      .trim()

    if (isBlock) {
      const el = glow
        ? <div key={key++} className="formula-block my-3"><SafeBlock math={inner} /></div>
        : <div key={key++} className="my-2"><SafeBlock math={inner} /></div>
      tokens.push(el)
    } else {
      tokens.push(<SafeInline key={key++} math={inner} />)
    }
    lastIdx = match.index + raw.length
  }

  if (lastIdx < content.length) {
    const txt = content.slice(lastIdx)
    if (txt) tokens.push(<span key={key++} className="text-text-1 whitespace-pre-wrap text-sm leading-relaxed">{txt}</span>)
  }

  // No delimiters found — try rendering as plain block formula
  if (tokens.length === 0) {
    return glow
      ? <div className="formula-block"><SafeBlock math={content} /></div>
      : <SafeBlock math={content} />
  }

  return <div className="formula-wrap">{tokens}</div>
}
