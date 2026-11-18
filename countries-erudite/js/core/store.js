export const STORAGE_KEY = 'countries-erudite:v1';

export function emptyState() {
  return { custom: [], edits: {}, deleted: [], progress: {}, settings: { answerMode: 'choices' } };
}

export function loadState(storage) {
  let stored = null;
  try {
    stored = JSON.parse(storage.getItem(STORAGE_KEY));
  } catch {
    stored = null;
  }
  const base = emptyState();
  if (!stored || typeof stored !== 'object') return base;
  return {
    custom: Array.isArray(stored.custom) ? stored.custom : base.custom,
    edits: stored.edits && typeof stored.edits === 'object' ? stored.edits : base.edits,
    deleted: Array.isArray(stored.deleted) ? stored.deleted : base.deleted,
    progress: stored.progress && typeof stored.progress === 'object' ? stored.progress : base.progress,
    settings: { ...base.settings, ...stored.settings },
  };
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
