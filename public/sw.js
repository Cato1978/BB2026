const CACHE_NAME = 'bustobattle-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/translations.js',
  '/manifest.json'
];

// Install - cache assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache (only GET requests, exclude API)
self.addEventListener('fetch', e => {
  // Skip non-GET and API requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push notification received
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Busto Battle XI', body: 'Nuovo aggiornamento!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/LogoBB.jpeg',
      badge: '/LogoBB.jpeg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/risultati.html' }
    })
  );
});

// Click on notification - open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
