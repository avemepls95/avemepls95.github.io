import { COUNTRIES } from '../data/countries.js';
import { FACTS } from '../data/facts.js';
import { loadState, saveState } from './core/store.js';
import { mergeFacts } from './core/catalog.js';
import { renderHome } from './ui/home.js';
import { renderQuiz } from './ui/quiz.js';
import { renderFacts } from './ui/factsView.js';

const root = document.getElementById('screen');

const ctx = {
  countries: COUNTRIES,
  countryById: new Map(COUNTRIES.map(c => [c.id, c])),
  state: loadState(localStorage),
  session: null,
  question: null,
  summary: null,
  facts() {
    return mergeFacts(FACTS, this.state);
  },
  update(newState) {
    this.state = newState;
    saveState(localStorage, newState);
  },
  go(route) {
    location.hash = route;
  },
  rerender() {
    render();
  },
};

function currentRoute() {
  return location.hash === '#/facts' ? '#/facts' : '#/';
}

function render() {
  const route = currentRoute();
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.route === route) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  if (route === '#/facts') renderFacts(root, ctx);
  else if (ctx.session || ctx.summary) renderQuiz(root, ctx);
  else renderHome(root, ctx);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();

// Локально service worker мешает видеть правки, поэтому включается только параметром ?sw.
if ('serviceWorker' in navigator && (location.hostname !== 'localhost' || location.search.includes('sw'))) {
  navigator.serviceWorker.register('sw.js');
}
navigator.storage?.persist?.();
