/**
 * TypeMaster v3 - Service Worker
 * Full offline PWA caching strategy.
 */

const CACHE = 'typemaster-v3';
const PRECACHE = [
    './', './index.html',
    './css/themes.css', './css/main.css', './css/components.css',
    './js/data-texts.js', './js/curriculum.js', './js/progress.js',
    './js/sound.js', './js/engine.js', './js/keyboard.js',
    './js/charts.js', './js/achievements.js', './js/app.js',
    './manifest.json', './assets/favicon.svg',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (e.request.method === 'GET' && e.request.url.startsWith('http')) {
                    caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                }
                return res;
            });
        }).catch(() => {
            if (e.request.mode === 'navigate') return caches.match('./index.html');
        })
    );
});
