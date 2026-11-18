import { h, hero, icon } from './dom.js';
import { applyAnswer } from '../core/leitner.js';
import { nextFact, recordAnswer } from '../core/session.js';
import { pickChoices, suggestCountries, matchCountry } from '../core/answers.js';
import { flagEmoji } from '../core/flags.js';

export function renderQuiz(root, ctx) {
  if (ctx.summary) return renderSummary(root, ctx);
  if (!ctx.question) ctx.question = makeQuestion(ctx);
  drawQuestion(root, ctx);
}

function makeQuestion(ctx) {
  const facts = ctx.facts().filter(f => ctx.countryById.has(f.countryId));
  const fact = nextFact(ctx.session, facts, ctx.state.progress, Date.now(), Math.random);
  if (!fact) return null;
  const country = ctx.countryById.get(fact.countryId);
  return {
    number: ctx.session.answered + 1,
    fact,
    country,
    choices: pickChoices(country, ctx.countries, Math.random),
    answer: null,
    typed: '',
  };
}

function finish(ctx) {
  ctx.summary = ctx.session.answered > 0 ? ctx.session : null;
  ctx.session = null;
  ctx.question = null;
  ctx.rerender();
}

function submitAnswer(root, ctx, countryId) {
  const q = ctx.question;
  const correct = countryId === q.country.id;
  q.answer = { countryId, correct };
  const record = applyAnswer(ctx.state.progress[q.fact.id], correct, Date.now());
  ctx.update({ ...ctx.state, progress: { ...ctx.state.progress, [q.fact.id]: record } });
  ctx.session = recordAnswer(ctx.session, q.fact, correct, Math.random);
  drawQuestion(root, ctx);
  root.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function next(root, ctx) {
  ctx.question = makeQuestion(ctx);
  drawQuestion(root, ctx);
  window.scrollTo(0, 0);
  // Фокус ставится в обработчике нажатия, иначе iOS не откроет клавиатуру.
  root.querySelector('.answer-input:not(:disabled)')?.focus();
}

function drawQuestion(root, ctx) {
  const q = ctx.question;
  const s = ctx.session;
  const finishChip = h('button', { class: 'chip', type: 'button', onClick: () => finish(ctx) }, 'Завершить');

  if (!q) {
    root.replaceChildren(
      hero('Тест', finishChip),
      h('section', { class: 'sheet' },
        h('p', { class: 'empty' }, 'Фактов нет. Добавьте их на экране «Факты».')));
    return;
  }

  const body = ctx.state.settings.answerMode === 'input' ? inputAnswer(root, ctx, q) : choiceAnswer(root, ctx, q);

  root.replaceChildren(
    hero(`Вопрос ${q.number}`,
      s.answered ? h('span', { class: 'chip' }, `${s.right} из ${s.answered}`) : null,
      finishChip),
    h('section', { class: 'sheet' },
      h('p', { class: 'fact-card' }, q.fact.text),
      body,
      q.answer ? feedback(root, ctx, q) : null),
  );
}

function choiceAnswer(root, ctx, q) {
  return h('div', { class: 'choices' },
    q.choices.map(c => {
      let state = '';
      if (q.answer) {
        if (c.id === q.country.id) state = 'is-correct';
        else if (c.id === q.answer.countryId) state = 'is-wrong';
        else state = 'is-dim';
      }
      return h('button', {
        class: `choice ${state}`,
        type: 'button',
        disabled: Boolean(q.answer),
        onClick: () => submitAnswer(root, ctx, c.id),
      },
      h('span', null, c.name),
      state === 'is-correct' ? icon('check') : state === 'is-wrong' ? icon('cross') : null);
    }));
}

function inputAnswer(root, ctx, q) {
  if (q.answer) {
    return h('div', { class: 'field' },
      h('input', {
        class: `input answer-input ${q.answer.correct ? 'is-correct' : 'is-wrong'}`,
        value: q.typed || 'Не знаю',
        disabled: true,
        'aria-label': 'Ваш ответ',
      }));
  }

  const suggestions = h('div', { class: 'group suggestions', hidden: true });
  const error = h('p', { class: 'field-error', hidden: true }, 'Нет такой страны');
  const input = h('input', {
    class: 'input answer-input',
    type: 'text',
    placeholder: 'Название страны',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    spellcheck: 'false',
    enterkeyhint: 'done',
    'aria-label': 'Название страны',
    value: q.typed,
  });

  const choose = country => {
    q.typed = country.name;
    submitAnswer(root, ctx, country.id);
  };

  const showSuggestions = () => {
    const found = suggestCountries(input.value, ctx.countries);
    suggestions.replaceChildren(...found.map(c =>
      h('button', { class: 'suggestion', type: 'button', onClick: () => choose(c) },
        h('span', { class: 'flag' }, flagEmoji(c.id)), c.name)));
    suggestions.hidden = found.length === 0;
  };

  const submit = () => {
    const country = matchCountry(input.value, ctx.countries);
    if (!country) {
      error.hidden = false;
      input.classList.add('is-invalid');
      return;
    }
    q.typed = input.value.trim();
    submitAnswer(root, ctx, country.id);
  };

  input.addEventListener('input', () => {
    q.typed = input.value;
    error.hidden = true;
    input.classList.remove('is-invalid');
    showSuggestions();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
  if (q.typed) showSuggestions();

  return h('div', null,
    h('div', { class: 'field' }, input, error, suggestions),
    h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', type: 'button', onClick: submit }, 'Ответить'),
      h('button', {
        class: 'btn btn-ghost',
        type: 'button',
        onClick: () => {
          q.typed = '';
          submitAnswer(root, ctx, null);
        },
      }, 'Не знаю')));
}

function feedback(root, ctx, q) {
  return h('div', { class: 'feedback' },
    h('p', { class: `verdict ${q.answer.correct ? 'good' : 'bad'}` }, q.answer.correct ? 'Верно' : 'Неверно'),
    h('p', { class: 'answer-country' }, h('span', { class: 'flag' }, flagEmoji(q.country.id)), q.country.name),
    q.fact.source ? h('a', { class: 'source', href: q.fact.source, target: '_blank', rel: 'noopener' }, 'Источник') : null,
    h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => next(root, ctx) }, 'Дальше')));
}

function renderSummary(root, ctx) {
  const s = ctx.summary;
  const facts = new Map(ctx.facts().map(f => [f.id, f]));
  const mistakes = s.mistakes.map(id => facts.get(id)).filter(Boolean);
  const home = () => {
    ctx.summary = null;
    ctx.rerender();
  };

  root.replaceChildren(
    hero('Итог'),
    h('section', { class: 'sheet' },
      h('div', { class: 'group' },
        h('div', { class: 'row' },
          h('span', { class: 'dot', style: 'background:var(--good)' }),
          h('span', { class: 'row-label' }, 'Верно'),
          h('span', { class: 'row-value' }, s.right)),
        h('div', { class: 'row' },
          h('span', { class: 'dot', style: 'background:var(--bad)' }),
          h('span', { class: 'row-label' }, 'Ошибок'),
          h('span', { class: 'row-value' }, s.wrong))),
      mistakes.length ? h('h2', null, 'Ошибки') : null,
      mistakes.length ? h('div', { class: 'group' },
        mistakes.map(f => {
          const country = ctx.countryById.get(f.countryId);
          return h('div', { class: 'mistake' },
            h('p', null, f.text),
            h('p', { class: 'answer' }, country ? `${flagEmoji(country.id)} ${country.name}` : ''));
        })) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onClick: home }, 'На главный'))),
  );
}
