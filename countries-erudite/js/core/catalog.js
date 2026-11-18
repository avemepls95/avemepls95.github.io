export function mergeFacts(builtIn, state) {
  const deleted = new Set(state.deleted);
  const fromBuiltIn = builtIn
    .filter(f => !deleted.has(f.id))
    .map(f => ({ ...f, ...state.edits[f.id], builtIn: true }));
  const custom = state.custom.map(f => ({ ...f, source: null, builtIn: false }));
  return [...fromBuiltIn, ...custom];
}

export function addFact(state, input, now) {
  const taken = new Set(state.custom.map(f => f.id));
  let id = `u-${now}`;
  for (let n = 2; taken.has(id); n++) id = `u-${now}-${n}`;
  return { ...state, custom: [...state.custom, { id, countryId: input.countryId, text: input.text }] };
}

export function updateFact(state, fact, input) {
  const change = { countryId: input.countryId, text: input.text };
  if (fact.builtIn) return { ...state, edits: { ...state.edits, [fact.id]: change } };
  return { ...state, custom: state.custom.map(f => (f.id === fact.id ? { id: f.id, ...change } : f)) };
}

export function deleteFact(state, fact) {
  const { [fact.id]: _progress, ...progress } = state.progress;
  if (!fact.builtIn) return { ...state, custom: state.custom.filter(f => f.id !== fact.id), progress };
  const { [fact.id]: _edit, ...edits } = state.edits;
  return { ...state, deleted: [...state.deleted, fact.id], edits, progress };
}
