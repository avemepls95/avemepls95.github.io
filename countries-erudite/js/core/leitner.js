export const DAY_MS = 86_400_000;
export const MAX_BOX = 5;
export const INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };

export function applyAnswer(record, correct, now) {
  // Новый факт считается лежащим в коробке 1, поэтому верный ответ сразу переносит его во вторую.
  const box = correct ? Math.min((record?.box ?? 1) + 1, MAX_BOX) : 1;
  return {
    box,
    due: now + INTERVAL_DAYS[box] * DAY_MS,
    right: (record?.right ?? 0) + (correct ? 1 : 0),
    wrong: (record?.wrong ?? 0) + (correct ? 0 : 1),
    lastSeen: now,
  };
}

export function boxCounts(facts, progress) {
  const counts = { new: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0 };
  for (const f of facts) {
    const r = progress[f.id];
    if (r) counts[`b${r.box}`]++;
    else counts.new++;
  }
  return counts;
}
