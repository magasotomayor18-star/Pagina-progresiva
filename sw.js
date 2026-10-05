const CACHE_NAME = "fitgirl-static-v1";
const DATA_CACHE_NAME = "fitgirl-data-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/styles.css",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./js/app.js",
  "./js/routines.js",
  "./js/storage.js",
  "./js/validation.js",
  "./data/ejercicios.json",
  "./manifest.json",
];
const CACHE_PREFIX = "fitgirl-";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX)
            && name !== CACHE_NAME
            && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const isApiRequest = requestUrl.pathname.includes("/api/");
  const cacheName = isApiRequest ? DATA_CACHE_NAME : CACHE_NAME;

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(request);

      if (!networkResponse.ok && networkResponse.type !== "opaque") {
        throw new Error(`La solicitud de red respondió con HTTP ${networkResponse.status}.`);
      }

      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, networkResponse.clone());
      } catch (error) {
        console.warn("No se pudo actualizar la caché del Service Worker.", error);
      }

      return networkResponse;
    } catch (error) {
      console.warn("La solicitud de red falló; se buscará una respuesta en caché.", error);
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      if (request.mode === "navigate") {
        const cachedPage = await caches.match("./index.html");
        if (cachedPage) return cachedPage;
      }

      return new Response(
        isApiRequest ? JSON.stringify({ error: "No hay conexión y no existe una respuesta guardada." }) : "Sin conexión.",
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": isApiRequest ? "application/json; charset=utf-8" : "text/plain; charset=utf-8" },
        },
      );
    }
  })());
});
