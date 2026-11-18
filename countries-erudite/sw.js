const VERSION = '20261118142623';
// На avemepls95.github.io живут и другие сайты, поэтому кеши различаются префиксом.
const PREFIX = 'countries-erudite-';
const CACHE = `${PREFIX}${VERSION}`;
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'data/countries.js',
  'data/facts.js',
  'js/app.js',
  'js/core/answers.js',
  'js/core/catalog.js',
  'js/core/flags.js',
  'js/core/leitner.js',
  'js/core/normalize.js',
  'js/core/session.js',
  'js/core/store.js',
  'js/ui/dom.js',
  'js/ui/factsView.js',
  'js/ui/home.js',
  'js/ui/quiz.js',
];

self.addEventListener('install', event => {
  // GitHub Pages разрешает браузеру кешировать файлы на 10 минут, а новой версии нужны свежие файлы.
  const requests = FILES.map(file => new Request(file, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => cached ?? fetch(event.request)));
});
