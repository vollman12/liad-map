// המפה של ליעד – עובד ברקע: שומר את האפליקציה לשימוש גם בלי קליטה
const VERSION = 'v2';
const APP = 'liadmap-app-' + VERSION, TILES = 'liadmap-tiles';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('liadmap-app-') && k !== APP).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // אריחי מפה: מהמטמון קודם, ומתעדכנים ברקע
  if (url.hostname === 'tile.openstreetmap.org') {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // הנקודות והדף: קודם מהרשת (כדי שעדכונים יופיעו מיד), ובלי קליטה מהמטמון
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(APP).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
