/**
 * Service worker básico do SigRest (PWA — ver PLANO_ACAO_COMPLETO.md, item 12).
 *
 * Estratégia "stale-while-revalidate" simples para os arquivos estáticos do app (HTML/JS/CSS/
 * ícones): serve do cache imediatamente quando existe, e atualiza o cache em segundo plano a
 * partir da rede. Chamadas à API (outra origem/porta) NUNCA passam por aqui — só GET do mesmo
 * domínio é interceptado, então nada de dado de negócio fica em cache do service worker.
 */
const CACHE_NAME = 'sigrest-cache-v1';
const APP_SHELL = ['/', '/manifest.json', '/favicon.ico', '/logo192.png', '/logo512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        // Atualiza o cache em segundo plano sem bloquear a resposta já servida.
        networkFetch;
        return cached;
      }
      return networkFetch.then((response) => response || new Response('Offline', { status: 503, statusText: 'Offline' }));
    })
  );
});
