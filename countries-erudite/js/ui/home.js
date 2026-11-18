import { h, hero, pluralFacts } from './dom.js';
import { boxCounts } from '../core/leitner.js';
import { createSession } from '../core/session.js';

export const BOXES = [
  { key: 'new', label: 'Новые', color: 'var(--box-new)' },
  { key: 'b1', label: 'Коробка 1', color: 'var(--box-1)' },
  { key: 'b2', label: 'Коробка 2', color: 'var(--box-2)' },
  { key: 'b3', label: 'Коробка 3', color: 'var(--box-3)' },
  { key: 'b4', label: 'Коробка 4', color: 'var(--box-4)' },
  { key: 'b5', label: 'Выучено', color: 'var(--box-5)' },
];

export function renderHome(root, ctx) {
  const facts = ctx.facts();
  const counts = boxCounts(facts, ctx.state.progress);
  const total = facts.length || 1;
  const mode = ctx.state.settings.answerMode;

  const setMode = answerMode => {
    ctx.update({ ...ctx.state, settings: { ...ctx.state.settings, answerMode } });
    ctx.rerender();
  };

  const start = () => {
    ctx.session = createSession();
    ctx.rerender();
  };

  root.replaceChildren(
    hero('Эрудит по странам'),
    h('section', { class: 'sheet' },
      h('h2', null, pluralFacts(facts.length)),
      h('div', { class: 'distribution', role: 'img', 'aria-label': 'Распределение фактов по коробкам' },
        BOXES.filter(b => b.key !== 'new' && counts[b.key]).map(b =>
          h('span', { style: `width:${(counts[b.key] / total) * 100}%;background:${b.color}` }))),
      h('div', { class: 'group' },
        BOXES.map(b => h('div', { class: 'row' },
          h('span', { class: 'dot', style: `background:${b.color}` }),
          h('span', { class: 'row-label' }, b.label),
          h('span', { class: 'row-value' }, counts[b.key])))),
      h('h2', null, 'Как отвечать'),
      h('div', { class: 'segmented', role: 'group', 'aria-label': 'Режим ответа' },
        h('button', { type: 'button', 'aria-pressed': String(mode === 'choices'), onClick: () => setMode('choices') }, 'Варианты'),
        h('button', { type: 'button', 'aria-pressed': String(mode === 'input'), onClick: () => setMode('input') }, 'Ввод')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onClick: start, disabled: facts.length === 0 }, 'Начать тест'),
        facts.length === 0 ? h('p', { class: 'field-hint' }, 'Фактов нет. Добавьте их на экране «Факты».') : null)),
  );
}
