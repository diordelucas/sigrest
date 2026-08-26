/**
 * Registro do service worker (PWA — ver PLANO_ACAO_COMPLETO.md, item 12).
 *
 * Só registra em produção: em desenvolvimento o service worker atrapalharia o hot-reload do
 * react-scripts, servindo bundles antigos do cache.
 */
export function register(): void {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => {
        console.error('Falha ao registrar o service worker:', error);
      });
  });
}

export function unregister(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch(() => {});
}
