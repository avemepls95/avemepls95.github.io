import { h, hero, icon } from './dom.js';
import { BOXES } from './home.js';
import { normalize } from '../core/normalize.js';
import { addFact, updateFact, deleteFact } from '../core/catalog.js';
import { suggestCountries, matchCountry } from '../core/answers.js';
import { flagEmoji } from '../core/flags.js';

export function renderFacts(root, ctx) {
  ctx.factsView ??= { query: '', open: new Set() };
  const view = ctx.factsView;

  const countChip = h('span', { class: 'chip' });
  const list = h('div', { class: 'group country-list' });

  const drawList = () => {
    const facts = ctx.facts();
    countChip.textContent = String(facts.length);
    list.replaceChildren(...countryBlocks(ctx, facts, view, drawList));
    list.hidden = list.childElementCount === 0;
    empty.hidden = !list.hidden;
  };

  const empty = h('p', { class: 'empty', hidden: true }, 'Ничего не нашлось');
  const search = h('input', {
    class: 'input search',
    type: 'search',
    placeholder: 'Поиск по фактам и странам',
    autocomplete: 'off',
    'aria-label': 'Поиск по фактам и странам',
    value: view.query,
    onInput: e => {
      view.query = e.target.value;
      drawList();
    },
  });

  const add = h('button', {
    class: 'chip',
    type: 'button',
    onClick: () => openForm(ctx, null, countryId => {
      view.open.add(countryId);
      drawList();
    }),
  }, icon('plus'), 'Добавить');

  root.replaceChildren(
    hero('Факты', countChip, add),
    h('section', { class: 'sheet' }, search, list, empty),
  );
  drawList();
}

function boxOf(ctx, fact) {
  const record = ctx.state.progress[fact.id];
  return BOXES.find(b => b.key === (record ? `b${record.box}` : 'new'));
}

function countryBlocks(ctx, facts, view, redraw) {
  const q = normalize(view.query);
  const byCountry = new Map();
  for (const f of facts) {
    if (!byCountry.has(f.countryId)) byCountry.set(f.countryId, []);
    byCountry.get(f.countryId).push(f);
  }

  const blocks = [];
  const countries = [...byCountry.keys()]
    .map(id => ctx.countryById.get(id))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  for (const country of countries) {
    let shown = byCountry.get(country.id);
    if (q) {
      const countryMatches = [country.name, ...country.aliases].some(n => normalize(n).includes(q));
      if (!countryMatches) shown = shown.filter(f => normalize(f.text).includes(q));
      if (!shown.length) continue;
    }
    const expanded = Boolean(q) || view.open.has(country.id);
    const toggle = () => {
      if (view.open.has(country.id)) view.open.delete(country.id);
      else view.open.add(country.id);
      redraw();
    };
    blocks.push(h('div', { class: 'country' },
      h('button', { class: 'country-row', type: 'button', 'aria-expanded': String(expanded), onClick: toggle },
        h('span', { class: 'flag' }, flagEmoji(country.id)),
        h('span', { class: 'row-label' }, country.name),
        h('span', { class: 'count' }, shown.length),
        icon('chevron')),
      expanded ? h('div', { class: 'facts' }, shown.map(f => factItem(ctx, f, view, redraw))) : null));
  }
  return blocks;
}

function factItem(ctx, fact, view, redraw) {
  const box = boxOf(ctx, fact);
  const edit = () => openForm(ctx, fact, countryId => {
    view.open.add(countryId);
    redraw();
  });
  const remove = () => {
    if (!confirm('Удалить факт?')) return;
    ctx.update(deleteFact(ctx.state, fact));
    redraw();
  };
  return h('div', { class: 'fact' },
    h('p', null, fact.text),
    h('div', { class: 'fact-meta' },
      h('span', { class: 'box-label' }, h('span', { class: 'dot', style: `background:${box.color}` }), box.label),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: edit }, 'Изменить'),
      h('button', { class: 'btn btn-ghost btn-small danger', type: 'button', onClick: remove }, 'Удалить')));
}

function openForm(ctx, fact, onSaved) {
  let countryId = fact?.countryId ?? null;

  const countryInput = h('input', {
    class: 'input',
    type: 'text',
    placeholder: 'Начните вводить название',
    autocomplete: 'off',
    'aria-label': 'Страна',
    value: fact ? ctx.countryById.get(fact.countryId)?.name ?? '' : '',
  });
  const suggestions = h('div', { class: 'group suggestions', hidden: true });
  const countryError = h('p', { class: 'field-error', hidden: true }, 'Выберите страну из списка');
  const text = h('textarea', { class: 'input', rows: 5, placeholder: 'Эта страна…', 'aria-label': 'Текст факта', autofocus: Boolean(fact) });
  text.value = fact?.text ?? '';
  const textError = h('p', { class: 'field-error', hidden: true }, 'Напишите текст факта');

  countryInput.addEventListener('input', () => {
    countryId = null;
    countryError.hidden = true;
    countryInput.classList.remove('is-invalid');
    const found = suggestCountries(countryInput.value, ctx.countries);
    suggestions.replaceChildren(...found.map(c =>
      h('button', {
        class: 'suggestion',
        type: 'button',
        onClick: () => {
          countryId = c.id;
          countryInput.value = c.name;
          suggestions.hidden = true;
          text.focus();
        },
      }, h('span', { class: 'flag' }, flagEmoji(c.id)), c.name)));
    suggestions.hidden = found.length === 0;
  });
  text.addEventListener('input', () => {
    textError.hidden = true;
    text.classList.remove('is-invalid');
  });

  const save = e => {
    e.preventDefault();
    const country = countryId ? ctx.countryById.get(countryId) : matchCountry(countryInput.value, ctx.countries);
    const value = text.value.trim();
    countryError.hidden = Boolean(country);
    countryInput.classList.toggle('is-invalid', !country);
    textError.hidden = Boolean(value);
    text.classList.toggle('is-invalid', !value);
    if (!country || !value) return;
    const input = { countryId: country.id, text: value };
    ctx.update(fact ? updateFact(ctx.state, fact, input) : addFact(ctx.state, input, Date.now()));
    dialog.close();
    onSaved(country.id);
  };

  const dialog = h('dialog', { class: 'form-dialog', 'aria-label': fact ? 'Изменить факт' : 'Новый факт' },
    h('form', { onSubmit: save, novalidate: true },
      h('h2', null, fact ? 'Изменить факт' : 'Новый факт'),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'Страна'),
        countryInput, countryError, suggestions),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'Текст'),
        text, textError,
        h('p', { class: 'field-hint' }, 'Пишите без названия страны: «Эта страна…», «В этой стране…».')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Сохранить'),
        h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => dialog.close() }, 'Отмена'))));

  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (e.target === dialog && outside) dialog.close();
  });
  document.body.append(dialog);
  dialog.showModal();
}
