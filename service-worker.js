const CACHE_NAME = "gestao-estetica-pro-app-v21-20260707-pwa-cache-refresh";
const CACHE_PREFIX = "gestao-estetica-pro-app-";
const CORE_ASSETS = [
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

function noStoreRequest(request) {
  return new Request(request, { cache: "no-store" });
}

async function limparCachesAntigos() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter(key => key !== CACHE_NAME && key.startsWith(CACHE_PREFIX))
      .map(key => caches.delete(key))
  );
}

self.addEventListener("install", event => {
  event.waitUntil(
    limparCachesAntigos()
      .then(() => caches.open(CACHE_NAME))
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    limparCachesAntigos()
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const ehPaginaPrincipal =
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html");

  if (ehPaginaPrincipal) {
    event.respondWith(
      fetch(noStoreRequest(event.request))
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(noStoreRequest(event.request))
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
