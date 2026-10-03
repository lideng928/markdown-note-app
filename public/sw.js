/*
 * Margin's service worker.
 *
 * Hand-written rather than generated: next-pwa is unmaintained for the App
 * Router, and the caching this app needs is small enough to read in one sitting.
 *
 * Navigations use network-first so a deploy is picked up immediately, falling
 * back to the cached shell when offline. Static assets are cache-first.
 */

const CACHE = 'margin-v1'
const SHELL = ['/', '/read']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // A failed precache must not block activation.
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isCacheable(request) {
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  // Next's build output is content-hashed, so it is safe to keep indefinitely.
  return url.pathname.startsWith('/_next/static/') || /\.(png|svg|ico|woff2?)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error()),
    )
    return
  }

  if (!isCacheable(request)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
