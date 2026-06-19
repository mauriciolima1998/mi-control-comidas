const CACHE = 'mi-control-v1'

// Cache static shell assets on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(['/', '/dashboard', '/settings'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // Always network-first for API calls and Supabase
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) return

  // Network first, fall back to cache for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
  }
})
