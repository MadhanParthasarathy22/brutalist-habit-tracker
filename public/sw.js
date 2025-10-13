const CACHE = "habit-tracker-v1"
const ASSETS = [
  "/", // app shell
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.jpg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? Promise.resolve() : caches.delete(k)))))
      .then(() => self.clients.claim()),
  )
})

// Strategy:
// - Navigations: network-first with cache fallback
// - Static GET from same-origin: cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (req.method !== "GET") return

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put("/", copy))
          return res
        })
        .catch(() => caches.match("/")),
    )
    return
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
      }),
    )
  }
})
