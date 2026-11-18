const RETRY_MIN_GAP = 3;
const RETRY_GAP_SPREAD = 3;

export function createSession() {
  return { answered: 0, right: 0, wrong: 0, mistakes: [], retry: [], lastFactId: null };
}

export function nextFact(session, facts, progress, now, rng) {
  if (!facts.length) return null;
  const byId = new Map(facts.map(f => [f.id, f]));
  const pending = new Set(session.retry.map(r => r.factId));
  const candidates = facts.filter(f => f.id !== session.lastFactId);

  const ready = session.retry
    .filter(r => r.at <= session.answered && r.factId !== session.lastFactId && byId.has(r.factId))
    .sort((a, b) => a.at - b.at);
  if (ready.length) return byId.get(ready[0].factId);

  const due = candidates
    .filter(f => !pending.has(f.id) && progress[f.id] && progress[f.id].due <= now)
    .sort((a, b) => progress[a.id].box - progress[b.id].box || progress[a.id].due - progress[b.id].due);
  if (due.length) return due[0];

  const fresh = candidates.filter(f => !progress[f.id]);
  if (fresh.length) return fresh[Math.floor(rng() * fresh.length)];

  const seen = candidates.filter(f => progress[f.id]).sort((a, b) => progress[a.id].lastSeen - progress[b.id].lastSeen);
  return seen[0] ?? byId.get(session.lastFactId) ?? facts[0];
}

export function recordAnswer(session, fact, correct, rng) {
  const answered = session.answered + 1;
  const retry = session.retry.filter(r => r.factId !== fact.id);
  if (!correct) retry.push({ factId: fact.id, at: answered + RETRY_MIN_GAP + Math.floor(rng() * RETRY_GAP_SPREAD) });
  const isNewMistake = !correct && !session.mistakes.includes(fact.id);
  return {
    answered,
    right: session.right + (correct ? 1 : 0),
    wrong: session.wrong + (correct ? 0 : 1),
    mistakes: isNewMistake ? [...session.mistakes, fact.id] : session.mistakes,
    retry,
    lastFactId: fact.id,
  };
}
