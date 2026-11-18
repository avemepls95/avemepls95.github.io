// Мои блюда: списки с архивом и без, поиск по названию и занятое название порции.
// dishes: { id: { n название, t состав, p порцией, w вес готового блюда, a момент архива (ISO) } }.
(function (root) {
  "use strict";

  const isArchived = (dish) => Boolean(dish.a);
  const byTitle = ([, a], [, b]) => a.n.localeCompare(b.n, "ru");

  function listed(dishes) {
    return Object.entries(dishes).filter(([, d]) => !isArchived(d)).sort(byTitle);
  }

  // Сверху блюдо, убранное в архив последним.
  function archived(dishes) {
    return Object.entries(dishes).filter(([, d]) => isArchived(d)).sort(([, a], [, b]) => b.a.localeCompare(a.a));
  }

  // Варианты поля «Блюдо»: блюда вне архива и уже выбранное в приёме пищи блюдо, даже если оно в архиве.
  function choices(dishes, selectedId) {
    return Object.entries(dishes).filter(([id, d]) => !isArchived(d) || id === selectedId).sort(byTitle);
  }

  // Название без учёта регистра. Одноимённые блюда продуктами допустимы, тогда блюдо вне архива находится раньше.
  function byName(dishes, name) {
    const key = name.toLowerCase();
    const found = Object.entries(dishes).filter(([, d]) => d.n.toLowerCase() === key);
    return (found.find(([, d]) => !isArchived(d)) || found[0])?.[0];
  }

  // Другое блюдо порцией, порция которого в составе приёма пищи совпадает с порцией блюда name.
  // keyOf: ключ порции по названию блюда.
  function portionOwner(dishes, exceptId, name, keyOf) {
    const key = keyOf(name);
    return Object.keys(dishes).find((id) => id !== exceptId && dishes[id].p && keyOf(dishes[id].n) === key);
  }

  const api = { isArchived, listed, archived, choices, byName, portionOwner };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DISHES = api;
})(typeof window !== "undefined" ? window : globalThis);
