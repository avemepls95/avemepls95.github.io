import { normalize } from './normalize.js';

const CHOICES_COUNT = 4;

function keys(country) {
  return [country.name, ...country.aliases].map(normalize);
}

export function matchCountry(input, countries) {
  const q = normalize(input);
  if (!q) return null;
  return countries.find(c => keys(c).includes(q)) ?? null;
}

export function suggestCountries(query, countries, limit = 6) {
  const q = normalize(query);
  if (!q) return [];
  const byName = (a, b) => a.name.localeCompare(b.name, 'ru');
  const prefix = countries.filter(c => keys(c).some(k => k.startsWith(q))).sort(byName);
  const substring = countries.filter(c => !prefix.includes(c) && keys(c).some(k => k.includes(q))).sort(byName);
  return [...prefix, ...substring].slice(0, limit);
}

export function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickChoices(correct, countries, rng) {
  const others = countries.filter(c => c.id !== correct.id);
  const tiers = [
    others.filter(c => c.region === correct.region),
    others.filter(c => c.region !== correct.region && c.continent === correct.continent),
    others.filter(c => c.continent !== correct.continent),
  ];
  const picked = [];
  for (const tier of tiers) {
    const pool = shuffle(tier, rng);
    while (picked.length < CHOICES_COUNT - 1 && pool.length) picked.push(pool.pop());
  }
  return shuffle([correct, ...picked], rng);
}
