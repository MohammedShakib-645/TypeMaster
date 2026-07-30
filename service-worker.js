/**
 * TypeMaster - Service Worker Cache Clearing Strategy
 * Forces network-first fetching and deletes legacy cache to ensure instant live updates.
 */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // Always fetch fresh network content first
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
