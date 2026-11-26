# Brief Codex T-09 — menu « Mon compte » commun et bouton « Se reconnecter »

Lot : 2D — Branche : `vision/lot-2d-compte` (depuis `main`) — Rédigé par Claude Code le 26/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md`, puis seulement les fichiers cités ici.

Vision est en préproduction (https://vision-preprod.avereo.fr/, lancé depuis CONNECT préproduction). Essai du responsable sur Android, application installée : quand la session Vision expire (cookie de passerelle de **30 minutes fixes**, `connect_gate_session_seconds`), l'écran « Connexion requise » (`frontend/src/features/projets/EcranProjets.jsx`, composant `EtatSession`) dit seulement « Ouvrez AVEREO Vision depuis AVEREO CONNECT », **sans bouton** : il faut ouvrir CONNECT dans le navigateur puis relancer l'application. Le responsable demande :
1. un bouton **« Se reconnecter »** qui renvoie vers CONNECT puis directement dans Vision ;
2. le menu commun **« Mon compte »** des autres applications AVEREO, absent de Vision.
La durée de session **reste 30 minutes** (décision du responsable) : ne la change pas.

Références à lire :
- Menu commun : `architecture-v1/avereo-platform/shared/account-menu.js` (composant `<avereo-account-menu>` : `portalFor`, `refreshLinks`, attributs `portal`, `logout-path`, `no-logout`, `no-missions`, `preferences-app`, `placement`, slot `items`), `architecture-v1/avereo-platform/data/account-menu-applications.json`, `.github/scripts/prepare-account-menu.mjs` et `check-account-menu.mjs`, `architecture-v1/avereo-platform/docs/preparation-mon-espace.md` (contrat des applications).
- Intégration React existante à imiter : `architecture-v1/avereo-app-thermo/frontend/src/App.jsx` et `frontend/index.html` ; types éventuels : `avereo-app-drone/frontend/src/account-menu.d.ts`.
- Rapport, pour le retour vers CONNECT : `architecture-v1/avereo-app-rapport/frontend/public/connect/gate.php` (`connect_portal_url`, `avereo_gate_portal_url_is_allowed`, `avereo_gate_redirect_to_connect` : `Location: <portail>?app=rapport`) et sa route `connect/logout.php`.
- Vision : `frontend/public/api/lib/config.php` (validation de la configuration), `api/auth.php`, `api/logout.php`, `connect/entry.php`, `api/lib/connect_gate.php`, `frontend/src/App.jsx`, `frontend/src/features/projets/` (`useProjets.js`, `EcranProjets.jsx`), `frontend/pwa.config.js`, `local/revue/` (recette locale : la page `/revue/` joue le rôle de CONNECT).

## Ce que tu fais
### 1. Adresse de CONNECT dans la configuration de Vision
- Nouvelle clé `connect_portal_url` dans `api/lib/config.php` : obligatoire en mode `connect` hors `local`, validée comme dans Rapport (https, hôte `avereo.fr` ou `*.avereo.fr`, sans identifiants, sans requête ni fragment) ; en `local`, l'origine de la recette (`http://127.0.0.1:5250/revue` ou équivalent) est admise. Défaut vide. Tests dans `tests/api/config_test.php`.
- Exposition au client **sans session** : ajoute `connect_portal` (URL normalisée, sans `/` final) à la réponse JSON 401 de l'API (`vision_require_identity`) et à la réponse 200 de `api/auth.php`, ou crée un petit point d'accès public en lecture (`api/portail.php`) si c'est plus simple et plus sûr : choisis et justifie. Aucune autre donnée de configuration ne sort.
- `local/config.example.php`, `local/revue/` et `vision-revue.ps1` : renseigner l'adresse locale pour que le bouton et le menu fonctionnent en recette locale (la page `/revue/` doit accepter `?app=vision` comme CONNECT : relancer Vision avec un nouveau ticket pour le compte fictif choisi, ou afficher la liste des comptes).

### 2. Bouton « Se reconnecter »
- Dans `EtatSession` (état `non-connecte`) : bouton principal « Se reconnecter » qui navigue vers `<connect_portal>?app=vision` (même fenêtre : dans l'application installée, la navigation hors du périmètre s'ouvre dans l'onglet intégré du système, puis CONNECT renvoie vers `connect/entry.php`). Texte d'aide : « Votre session a expiré. Vos modifications restent enregistrées sur cet appareil et seront envoyées après reconnexion. » (n'affirme cela que si c'est vrai dans le code de synchronisation ; sinon adapte le texte).
- Si l'adresse est inconnue : garder le message actuel, sans bouton.
- **Ne supprime aucune donnée locale** à la reconnexion ni à la déconnexion (le moteur de synchronisation gère déjà le changement d'identité, `identity_changed`).
- Également : quand une requête de synchronisation reçoit 401 pendant l'utilisation (session expirée en plein relevé), afficher un bandeau non bloquant avec le même bouton, sans interrompre la saisie locale. Lis `src/sync/moteur.js` / `useSynchro.js` pour brancher ce signal proprement.

### 3. Menu commun « Mon compte »
- Ajoute Vision à `architecture-v1/avereo-platform/data/account-menu-applications.json` : `id` `vision`, `publicDirectories` `["architecture-v1/avereo-app-vision/frontend/public"]`, `surface` « Bandeau supérieur et compte en bas à gauche », `capabilities` `["projects", "account", "applications", "logout"]` (pas de `missions`, pas de `preferences` tant que Vision n'a pas de préférences), `workspaceScope` « Projets de relevé synchronisés ; relevés en cours dans ce navigateur ». C'est la **seule** modification hors de `architecture-v1/avereo-app-vision/` (accord du responsable : il a demandé le menu commun) ; ne modifie ni `account-menu.js`, ni les scripts `.github/scripts/`, ni les autres applications.
- Lance `node .github/scripts/prepare-account-menu.mjs vision` pour produire `frontend/public/account-menu.js` et `frontend/public/assets/avereo-logo.png` (copies exactes, à commiter) ; vérifie avec `node .github/scripts/check-account-menu.mjs vision` après `npm run build`.
- `frontend/index.html` : `<script defer src="/account-menu.js"></script>` comme Thermo (attention : Vision est servi à la racine du domaine ; garde le chemin absolu attendu par le contrôle).
- Dans le bandeau de Vision (`App.jsx` ou le composant d'en-tête) : `<avereo-account-menu portal={connectPortal} no-missions logout-path="/connect/logout.php">` avec un élément `slot="items"` « Mes projets » qui ramène à la liste des projets. Déclare le type JSX si nécessaire (voir Drone). Respecte la charte (`AGENTS.md`) et les grandes cibles tactiles.
- Nouvelle route `frontend/public/connect/logout.php` (GET, comme celle de Rapport) : efface le cookie de passerelle de Vision puis redirige vers le portail CONNECT (ou sa déconnexion si Rapport le fait) ; aucun effacement des données locales. Tests PHP.
- Service worker : `account-menu.js` et le logo sont précachés comme le reste ; `/connect/` reste exclu (vérifie `pwa.config.js` et les tests `pwa.test.mjs`). Le menu appelle l'API de CONNECT (`/api/v1/session`, `/api/v1/appearance`, préférences) : domaine AVEREO, à ajouter si besoin à l'inventaire de `frontend/tests/domaines.test.mjs` (R08).

### 4. Documentation
- `docs/exigences.md` : rattache à R02/R08 ou crée une exigence « R49 Menu commun et reconnexion » avec son « terminé quand » ; « À VÉRIFIER » : comportement sur iPhone en application installée (cookies séparés de Safari).
- `docs/deploiement-mutualise.md` : nouvelle clé `connect_portal_url` (préproduction : `https://connect-preprod.avereo.fr`), à ajouter **avant** le prochain déploiement (le workflow vérifie la configuration privée ; adapte `deploiement/verifier-prive.php` pour exiger la clé en `preproduction`/`production` et son test).
- `docs/licences.md` : rien de nouveau attendu (code AVEREO).
- `docs/revue-locale.md` : scénario de recette du bouton et du menu.

## Ce que tu ne fais pas
- Pas de déploiement, pas de connexion au serveur, pas de changement de secret ni de réglage GitHub.
- Pas de modification de la durée de session, de CONNECT, du composant commun ni des autres applications (hors l'entrée Vision du manifeste).
- Pas de suppression de données locales.

## Terminé quand
- `npm test` (frontend), `node --test deploiement/*.test.mjs`, `php tests/api/run.php` passent (le mode strict avec MySQL sera relancé par Claude Code) ; `npm run build` puis `node .github/scripts/check-account-menu.mjs vision` réussissent ; `bash -n` / `php -l` sur les scripts touchés.
- Un commit sur `vision/lot-2d-compte` (message en français, se terminant par `Co-Authored-By: Codex <noreply@openai.com>`), sans pousser. Si le commit est impossible dans ton environnement, laisse les changements dans l'arbre de travail et dis-le.
- Rapport final : fichiers créés et modifiés, choix (notamment l'exposition de `connect_portal`), limites et points « À VÉRIFIER ».
