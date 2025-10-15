// Nome univoco della cache — cambialo solo quando modifichi file statici
const CACHE_NAME = 'ore-phoenix-v3';

// Elenco dei file da mantenere in cache
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './logo.png',
  './logo-192.png',
  './logo-512.png',
  './favicon.ico',
  './manifest.json'
];

// Installazione del service worker e caching iniziale
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// Attivazione: rimuove le vecchie cache automaticamente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Gestione delle richieste (serve i file dalla cache, altrimenti li scarica)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 🔔 Notifica di nuova versione disponibile
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 🔁 Controllo automatico aggiornamenti ogni 30 secondi
setInterval(() => {
  self.registration.update();
}, 30000);