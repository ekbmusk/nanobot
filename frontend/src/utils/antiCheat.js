export function calculateConfidence(answerList, timingList) {
  let confidence = 100;
  const indices = answerList.map(a => a.option_index);

  // Straight-line
  let maxRun = 1, run = 1;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === indices[i - 1]) { run++; maxRun = Math.max(maxRun, run); }
    else run = 1;
  }
  if (maxRun >= 4) confidence -= (maxRun - 3) * 15;

  // Speed
  const fastCount = timingList.filter(t => t < 2000).length;
  confidence -= fastCount * 5;

  // Pattern cycling
  for (let period = 2; period <= 5; period++) {
    if (indices.length < period * 2) continue;
    const pattern = indices.slice(0, period);
    let matches = 0;
    for (let i = period; i < indices.length; i++) {
      if (indices[i] === pattern[i % period]) matches++;
    }
    if (matches / (indices.length - period) >= 0.8) { confidence -= 25; break; }
  }

  // Low variance
  const unique = new Set(indices).size;
  if (unique <= 2 && indices.length >= 10) confidence -= 20;

  return Math.max(0, Math.min(100, confidence));
}

export function checkLiveAntiCheat(answers) {
  if (answers.length < 4) return null;
  const last4 = answers.slice(-4).map(a => a.option_index);
  if (last4.every(v => v === last4[0])) return 'Бірдей жауаптар байқалды!';
  const isAlt = last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1];
  if (isAlt) return 'Паттерн байқалды!';
  return null;
}
