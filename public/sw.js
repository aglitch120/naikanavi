const CACHE_VERSION = 'iwor-v1'
const OFFLINE_URL = '/offline'

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
]

// Install: precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls (Worker API, analytics, etc.)
  if (
    url.hostname === 'iwor-api.mightyaddnine.workers.dev' ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('cloudflareinsights')
  ) {
    return
  }

  // Static assets (_next/static): cache-first (immutable, hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Images and fonts: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Clinical tool pages: stale-while-revalidate
  // These are the pages that save lives offline
  if (
    url.pathname.startsWith('/tools/') ||
    url.pathname.startsWith('/compare/') ||
    url.pathname === '/tools'
  ) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // All other pages: network-first with offline fallback
  event.respondWith(networkFirst(request))
})

// Strategy: Cache-first (for static assets)
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 408 })
  }
}

// Strategy: Network-first with offline fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL)
    }

    return new Response('', { status: 408 })
  }
}

// Strategy: Stale-while-revalidate (for clinical tools)
// Return cached immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // Return cached version immediately if available
  if (cached) {
    // Still update in background
    fetchPromise
    return cached
  }

  // No cache: wait for network
  const response = await fetchPromise
  if (response) return response

  // Last resort: offline page
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_URL)
  }

  return new Response('', { status: 408 })
}
