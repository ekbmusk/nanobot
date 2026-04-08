import { STORAGE_KEY } from '../constants';

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function saveToHistory(matchedResults, timings, tagScores) {
  const history = getHistory();
  const entry = {
    date: new Date().toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: Date.now(),
    top5: matchedResults.map(m => ({
      profId: m.profession.id,
      name: m.profession.name,
      emoji: m.profession.emoji,
      score: m.score,
      matchPct: m.matchPct,
    })),
    tagScores: tagScores || {},
    totalTime: timings.reduce((a, b) => a + b, 0),
  };
  history.unshift(entry);
  if (history.length > 10) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
