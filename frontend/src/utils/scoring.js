import { PERSONALITY_TYPES, DOMAINS } from '../constants';

export function calculateResults(answers, categories, professions) {
  const qMap = {};
  categories.forEach(cat => {
    cat.questions.forEach(q => { qMap[q.id] = q; });
  });

  const tagScores = {};
  answers.forEach(a => {
    const q = qMap[a.question_id];
    if (!q) return;
    const weight = q.weight || 1.0;
    const tags = q.options[a.option_index]?.tags || [];
    tags.forEach(tag => {
      tagScores[tag] = (tagScores[tag] || 0) + weight;
    });
  });

  const scored = professions.map(p => {
    const score = (p.tags || []).reduce((sum, tag) => sum + (tagScores[tag] || 0), 0);
    return { profession: p, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  const maxScore = top[0]?.score || 1;
  top.forEach(m => {
    m.matchPct = Math.round((m.score / maxScore) * 100);
  });

  return { top, tagScores };
}

export function detectPersonalityType(tagScores) {
  let best = null;
  let bestScore = -1;
  PERSONALITY_TYPES.forEach(pt => {
    const score = pt.tags.reduce((sum, tag) => sum + (tagScores[tag] || 0), 0);
    if (score > bestScore) { bestScore = score; best = pt; }
  });
  return best || PERSONALITY_TYPES[0];
}

export function computeDomainScores(tagScores) {
  const scores = DOMAINS.map(d => {
    const raw = d.tags.reduce((s, t) => s + (tagScores[t] || 0), 0);
    return { label: d.label, raw };
  });
  const maxRaw = Math.max(...scores.map(s => s.raw), 1);
  scores.forEach(s => { s.pct = Math.round((s.raw / maxRaw) * 100); });
  return scores;
}
