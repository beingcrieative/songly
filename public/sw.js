/* basic service worker: precache, runtime cache, offline fallback, push */
const CACHE_NAME = 'studio-cache-v1';
const OFFLINE_URL = '/offline.html';

// Task 3.4.4: Pre-cache notification icons and badges
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        OFFLINE_URL,
        '/icons/icon-192x192.png',
        '/icons/icon-72x72.png',
        '/icons/badge-72x72.png',
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET and audio streams (let browser handle)
  if (request.method !== 'GET') return;
  if (request.destination === 'audio') return;

  // Cache song covers with stale-while-revalidate strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // API GET: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // HTML navigation: network first, fallback to offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
});

// Task 3.4.1: Enhanced push event handler with proper icon, badge, and actions
self.addEventListener('push', (event) => {
  try {
    // Parse notification data with error handling
    const data = event.data ? event.data.json() : {};

    const title = data.title || 'Liedje klaar!';
    const body = data.body || 'Je song is gereed om te beluisteren.';
    const url = data.url || '/library';
    const icon = data.icon || '/icons/icon-192x192.png';
    const badge = data.badge || '/icons/badge-72x72.png';

    // Notification options with all features
    const options = {
      body,
      icon,
      badge,
      data: {
        ...data,
        url, // Ensure URL is in data for click handler
        timestamp: Date.now(),
      },
      tag: data.type ? `${data.type}-${data.songId || 'unknown'}` : 'song-update',
      requireInteraction: false, // Don't require explicit dismissal
      vibrate: [200, 100, 200], // Vibration pattern for mobile
      actions: [
        {
          action: 'view',
          title: 'Bekijk liedje',
          icon: '/icons/icon-72x72.png',
        },
        {
          action: 'dismiss',
          title: 'Sluiten',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Push notification error:', error);
    // Show generic notification on error
    event.waitUntil(
      self.registration.showNotification('Liedje klaar!', {
        body: 'Er is een update voor je liedje.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  // Placeholder for background sync of queued uploads
});

// Task 3.4.2: Enhanced notificationclick handler with action support
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button clicks
  if (event.action === 'dismiss') {
    // User clicked dismiss - just close the notification
    return;
  }

  // Extract deep link URL from notification data
  const url = event.notification?.data?.url || '/library';

  // Task 3.4.2: Focus existing window if app already open, otherwise open new
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Try to find an existing window with the app open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the notification URL and focus the window
            return client.focus().then((client) => {
              if ('navigate' in client) {
                return client.navigate(url);
              }
              return client;
            });
          }
        }

        // No existing window found - open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('[SW] Notification click error:', error);
        // Fallback: try to open window anyway
        return clients.openWindow(url);
      })
  );
});

// Task 3.4.3: Track notification dismissals
self.addEventListener('notificationclose', (event) => {
  // Track dismissals for analytics (optional)
  const data = event.notification?.data;
  if (data?.type && data?.songId) {
    console.log('[SW] Notification dismissed:', data.type, data.songId);
    // Future: Could send analytics event here
  }
});
