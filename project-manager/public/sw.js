// ─── Spacetoon Pocket Service Worker ────────────────────────────────────────
// Strategy:
//   • Static assets (JS, CSS, fonts, images) → Cache-First
//   • API / navigation requests → Network-First with offline fallback
//   • Offline fallback page → /offline.html

const CACHE_NAME = 'spacetoon-pocket-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/spacetoon-logo.png',
];

// ─── Install: pre-cache critical static assets ───────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            // Activate immediately without waiting for old SW to die
            return self.skipWaiting();
        })
    );
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// ─── Fetch: routing strategy ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and cross-origin requests
    if (request.method !== 'GET') return;
    if (url.origin !== location.origin) return;

    // Skip Next.js internal requests and API routes
    if (url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/api/')) {
        // Network-only for API: no caching
        if (url.pathname.startsWith('/api/')) {
            event.respondWith(
                fetch(request).catch(() => {
                    return new Response(
                        JSON.stringify({ error: 'لا يوجد اتصال بالإنترنت' }),
                        { status: 503, headers: { 'Content-Type': 'application/json' } }
                    );
                })
            );
            return;
        }
        // Cache-first for _next/ static chunks (JS/CSS)
        event.respondWith(cacheFirst(request));
        return;
    }

    // For font and image requests → Cache-First
    if (request.destination === 'font' ||
        request.destination === 'image') {
        event.respondWith(cacheFirst(request));
        return;
    }

    // For HTML navigation → Network-First with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // Default: Network-First
    event.respondWith(networkFirst(request));
});

// ─── Cache-First Strategy ─────────────────────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('', { status: 408 });
    }
}

// ─── Network-First Strategy ───────────────────────────────────────────────────
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 408 });
    }
}

// ─── Network-First with Offline HTML Fallback ─────────────────────────────────
async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);
        // Update cache for successful navigations
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Try the cache first
        const cached = await caches.match(request);
        if (cached) return cached;
        // Last resort: offline page
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response('<h1>لا يوجد اتصال</h1>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}

// ─── Background Sync (post queue when back online) ───────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Placeholder for future offline form submission queue
    console.log('[SW] Background sync triggered');
}

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'Spacetoon Pocket', body: event.data.text() };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-96.png',
        dir: 'rtl',
        lang: 'ar',
        tag: data.tag || 'spacetoon-' + Date.now(), // group similar notifications
        renotify: true, // vibrate even if tag matches
        data: {
            url: data.url || '/',
        },
        actions: data.url ? [
            { action: 'open', title: 'فتح' },
        ] : [],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Spacetoon Pocket', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    // Try to focus existing window, or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});

// ─── Message Handler (SKIP_WAITING from NetworkStatus) ───────────────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

