/* GrailleLight — permet à l'app de s'ouvrir vite, même avec une mauvaise connexion */
const CACHE = 'graille-v1';
const BASE = ['/', '/index.html', '/icone-192.png', '/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(BASE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // les recettes viennent de Supabase : toujours chercher le frais,
  // et se rabattre sur la copie locale seulement si le réseau est coupé
  if (url.hostname.endsWith('supabase.co')) {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copie = r.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // on ne touche pas à la mesure d'audience ni aux services extérieurs
  if (url.hostname.includes('googletagmanager') || url.hostname.includes('google-analytics')) return;

  // pages et fichiers du site : on sert la copie locale d'abord (rapide),
  // et on met à jour en arrière-plan
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(cache => {
        const reseau = fetch(req).then(r => {
          if (r && r.status === 200) {
            const copie = r.clone();
            caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
          }
          return r;
        }).catch(() => cache);
        return cache || reseau;
      })
    );
  }
});
