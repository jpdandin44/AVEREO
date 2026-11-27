// Rapport AVEREO Pro installable (Android). Service worker produit au build par pwa/plugin.js, sans dépendance.
// Garde : les fichiers de l'application (assets/), la page d'accueil (sans donnée de dossier) et le menu de compte partagé.
// Ne garde jamais : l'API, le sas CONNECT, l'authentification, les pages RGA ; ces adresses vont toujours au réseau.
const VERSION = '__VERSION__';
const CACHE = `rapport-application-${VERSION}`;
const FICHIERS = __FICHIERS__;
const ACCUEIL = '/';
const EXCLUS = /^\/(?:api|connect|auth|rga)(?:\/|$)/;
const RESEAU_PUIS_CACHE = /^\/(?:account-menu\.js|manifest\.webmanifest|icons\/[a-z0-9-]+\.png)$/;
// Fichiers servis hors build (menu de compte partagé, manifeste, icône) : gardés dès l'installation si présents.
const ANNEXES = ['/account-menu.js', '/assets/avereo-logo.png', '/manifest.webmanifest', '/icons/rapport-192.png'];

async function memoriserAccueil(cache, reponse) {
  const type = reponse.headers.get('content-type') || '';
  if (reponse.ok && !reponse.redirected && reponse.type === 'basic' && type.includes('text/html')) {
    await cache.put(ACCUEIL, reponse.clone());
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FICHIERS);
    await Promise.all(ANNEXES.map(async (chemin) => {
      try { const reponse = await fetch(chemin); if (reponse.ok) await cache.put(chemin, reponse); } catch { /* hors ligne */ }
    }));
    // Page d'accueil servie par le sas : gardée seulement si la session est valide (sinon redirection, rien n'est gardé).
    try { await memoriserAccueil(cache, await fetch(ACCUEIL, { credentials: 'same-origin', redirect: 'manual' })); } catch { /* hors ligne */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter((nom) => nom.startsWith('rapport-application-') && nom !== CACHE).map((nom) => caches.delete(nom)));
    await self.clients.claim();
  })());
});

async function ouvrirPage(requete) {
  const cache = await caches.open(CACHE);
  try {
    const reponse = await fetch(requete);
    if (new URL(requete.url).pathname === ACCUEIL) await memoriserAccueil(cache, reponse);
    return reponse;
  } catch {
    return (await cache.match(ACCUEIL)) || Response.error();
  }
}

async function reseauPuisCache(requete) {
  const cache = await caches.open(CACHE);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) await cache.put(requete, reponse.clone());
    return reponse;
  } catch {
    return (await cache.match(requete)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin || EXCLUS.test(url.pathname)) return;
  if (requete.mode === 'navigate') {
    event.respondWith(ouvrirPage(requete));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(requete).then((trouvee) => trouvee || fetch(requete)));
  } else if (RESEAU_PUIS_CACHE.test(url.pathname)) {
    event.respondWith(reseauPuisCache(requete));
  }
});
