// AVEREO CONNECT installable (Android). Ce service worker ne garde en cache que la page « hors ligne » et une icône.
// Il n'enregistre jamais une page du portail ni une réponse d'API : elles dépendent de la session.
// Il n'intercepte que l'ouverture de la page d'accueil ; tout le reste (API, identification, lancements) va au réseau.
const CACHE = "connect-hors-ligne-v1";
const PAGE_HORS_LIGNE = "/hors-ligne.html";
const FICHIERS = [PAGE_HORS_LIGNE, "/icons/connect-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom.startsWith("connect-") && nom !== CACHE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET" || requete.mode !== "navigate") return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== "/" && url.pathname !== "/index.html") return;
  event.respondWith(fetch(requete).catch(() => caches.match(PAGE_HORS_LIGNE)));
});
