---
project: avereo-app-vision
document_type: verification
title: Vérification locale T-09 compte et reconnexion
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, compte, reconnexion, verification]
---

# T-09 — résultat local du 26 novembre 2026

Branche `vision/lot-2d-compte`, base `ad1037e9efd92426f41c67327fd2725acd7f192c`. Cadrage réalisé ; Développement local implémenté, qualification incomplète ; Préproduction et Mise en production : aucune action dans ce lot. Le suivi canonique est `data/suivi-vision.json`, section `accountT09` ; les preuves et accords antérieurs sont conservés.

## Choix et comportement

- `connect_portal_url` : défaut vide, obligatoire en CONNECT hors local, HTTPS sur AVEREO, sans identifiants/requête/fragment ; origine locale autorisée pour la recette. Seul `connect_portal` sort dans auth 200 et les 401 de `vision_require_identity`. Aucun point d’accès supplémentaire. Une configuration invalide est validée avant mise en cache, afin qu’un premier refus ne laisse pas réutiliser des valeurs invalides ; test de deux lectures successives.
- Le moteur existant signale `reconnexion` après un 401 : le bandeau ne change ni l’identité ni les relevés montés, ne supprime aucune donnée et laisse la saisie locale fonctionner. Le portail est conservé avec l’identité connue pour le rechargement hors ligne. Texte prudent en mode mémoire, retour avec le même compte requis pour ses envois. Les tests existants couvrent la file conservée sur 401, sa reprise et `identity_changed`.
- Menu commun copié à l’octet, sans missions ni préférences. Mes projets revient à la liste sans démonter les relevés. La confirmation avant déconnexion avec des envois en attente est conservée, avec avertissement spécifique en mode mémoire. GET logout expire le cookie de Vision puis redirige comme Rapport vers le portail `/?logout=1`. Aucune donnée locale supprimée.
- La recette `/revue?app=vision` présente la liste des comptes fictifs ; leur sélection POST émet un nouveau ticket. Les configurations existantes doivent recevoir la clé locale sans reset ni rotation de secret.
- Base Vite `/` : Vision est servie à la racine. Nécessaire pour conserver le chemin absolu `/account-menu.js` dans le HTML construit (avec la base antérieure `./`, Vite le réécrivait en relatif). Menu et logo vérifiés dans le précache, routes CONNECT exclues.
- Le vérificateur privé reste autonome : le workflow le transmet par `php /dev/stdin` avant transfert du code. Son contrôle d’URL ne peut donc pas charger la bibliothèque publiée ; un test de parité couvre les URL acceptées/refusées.
- Aucun ajout de dépendance ; `docs/licences.md` consulté, aucune mise à jour nécessaire pour le code AVEREO copié.

## Contrôles

| Contrôle | Résultat |
|---|---|
| `npm test` | 266 réussis, aucun échec |
| `node --test deploiement/*.test.mjs` | 24 réussis |
| PHP 8.4.23 : `run.php config` | 12 réussis |
| PHP 8.4.23 : `run.php deploiement` | 3 réussis |
| PHP 8.4.23 : `run.php compte` | 1 réussi : vrai serveur temporaire isolé, auth 401/200, cookie expiré, redirection 303, POST refusé |
| PHP 8.4.23 : suite entière, configuration explicitement absente | 108 réussis, 3 échecs, 35 ignorés : les trois tests HTTP sans prérequis interrogent le service présent sur 127.0.0.1:80 qui répond 404 ; aucune qualification MySQL ni mode strict |
| `npm run build` | bloqué par l’accès esbuild au répertoire parent |
| `npm run build -- --configLoader runner` | réussi, PWA : 25 entrées précachées ; avertissement taille de bundle > 500 kB |
| `prepare-account-menu.mjs vision --check` | réussi, copies exactes |
| `check-account-menu.mjs vision` | bloqué avant contrôle de Vision : assertion globale « Module Missions différent dans CONNECT », écart CRLF/LF ; fichier CONNECT laissé intact |
| Assertions indépendantes sur Vision | menu et logo public/dist identiques à la source, script HTML absolu, menu/logo dans sw.js : réussies |
| `valider-paquet.mjs frontend/dist` | accepté ; SHA-256 `add329aced53c56d54b42f692cd58679cb3393e58a975885fbc2390319db9ac6` |
| Syntaxe | `php -l` sur tous les PHP touchés : réussi ; analyseur PowerShell sur vision-revue.ps1 : aucune erreur ; aucun script shell modifié, `bash -n` non applicable |
| `git diff --check` | réussi |

Les logs locaux sont dans `local/t09-frontend-tests.log`, `local/t09-php-tests.log` et `local/t09-build.log` (non versionnés).

## Réserves et reprise

1. Claude Code doit relancer la suite stricte sous PHP 8.3/MySQL dans la pile dédiée ; les résultats PHP ci-dessus ne remplacent pas cette vérification.
2. Refaire le contrôleur commun dans un checkout aux fins de ligne conformes ; l’échec CONNECT ne vaut pas validation du contrôleur global. Ne pas corriger CONNECT dans ce lot.
3. Recette interactive locale puis Android/iPhone installés : À VÉRIFIER (cookies iOS distincts de Safari, navigation et retour via CONNECT). Aucun essai mobile attesté ici.
4. Ajouter `connect_portal_url` à la configuration privée avant le prochain déploiement autorisé. Aucune connexion serveur ni modification de secret ou de réglage GitHub effectuée ; durée de session conservée à 1800 secondes.
5. Les deux copies publiques sont explicitement réincluses dans `.gitignore` de Vision, car les règles racine les excluent par défaut. Elles doivent être incluses au commit.
6. Commit impossible : `git add` refuse la création d’`index.lock` dans le dépôt principal associé au worktree (Permission denied). Changements laissés dans l’arbre, sans push. Message prévu :

```text
feat(vision): ajouter le menu commun et la reconnexion via CONNECT

Co-Authored-By: Codex <noreply@openai.com>
```

## Fichiers du lot

- [.gitignore](../.gitignore)
- [changelog.md](../changelog.md)
- [data/suivi-vision.json](../data/suivi-vision.json)
- [deploiement/verifier-prive.php](../deploiement/verifier-prive.php)
- [docs/architecture.md](../docs/architecture.md)
- [docs/compte-reconnexion-verification.md](../docs/compte-reconnexion-verification.md)
- [docs/deploiement-mutualise.md](../docs/deploiement-mutualise.md)
- [docs/exigences.md](../docs/exigences.md)
- [docs/revue-locale.md](../docs/revue-locale.md)
- [frontend/index.html](../frontend/index.html)
- [frontend/public/account-menu.js](../frontend/public/account-menu.js)
- [frontend/public/api/auth.php](../frontend/public/api/auth.php)
- [frontend/public/api/lib/auth.php](../frontend/public/api/lib/auth.php)
- [frontend/public/api/lib/config.php](../frontend/public/api/lib/config.php)
- [frontend/public/api/lib/portal.php](../frontend/public/api/lib/portal.php)
- [frontend/public/assets/avereo-logo.png](../frontend/public/assets/avereo-logo.png)
- [frontend/public/connect/logout.php](../frontend/public/connect/logout.php)
- [frontend/src/App.jsx](../frontend/src/App.jsx)
- [frontend/src/components/Reconnexion.jsx](../frontend/src/components/Reconnexion.jsx)
- [frontend/src/features/projets/EcranProjets.jsx](../frontend/src/features/projets/EcranProjets.jsx)
- [frontend/src/features/projets/useProjets.js](../frontend/src/features/projets/useProjets.js)
- [frontend/src/services/api.js](../frontend/src/services/api.js)
- [frontend/src/sync/identite-locale.js](../frontend/src/sync/identite-locale.js)
- [frontend/tests/domaines.test.mjs](../frontend/tests/domaines.test.mjs)
- [frontend/tests/pwa.test.mjs](../frontend/tests/pwa.test.mjs)
- [frontend/tests/reconnexion.test.mjs](../frontend/tests/reconnexion.test.mjs)
- [frontend/vite.config.js](../frontend/vite.config.js)
- [local/config.example.php](../local/config.example.php)
- [local/revue/index.php](../local/revue/index.php)
- [local/vision-revue.ps1](../local/vision-revue.ps1)
- [tests/api/auth_test.php](../tests/api/auth_test.php)
- [tests/api/compte_test.php](../tests/api/compte_test.php)
- [tests/api/config_test.php](../tests/api/config_test.php)
- [tests/api/connect_flow_test.php](../tests/api/connect_flow_test.php)
- [tests/api/deploiement_test.php](../tests/api/deploiement_test.php)
- [architecture-v1/avereo-platform/data/account-menu-applications.json](../../avereo-platform/data/account-menu-applications.json)

## Relecture et qualification par Claude Code (26/11/2026)

- **Correction bloquante trouvée en recette** : React 19 affecte `portal={…}` comme *propriété* du composant `<avereo-account-menu>`, qui ne l'expose qu'en lecture : exception au rendu et **page blanche**. L'adresse du portail est désormais posée dans `<meta name="avereo-connect-portal">` (`src/services/portail-connect.js`, appelé par `useProjets` avant l'affichage du menu) ; test `frontend/tests/portail-connect.test.mjs` (meta créée, mise à jour, retirée ; aucune prop `portal` dans `App.jsx`).
- `tests/api/connect_flow_test.php` : en environnement `local`, l'adresse du portail de test est une boucle locale (la validation refuse un domaine public en local) ; les 5 échecs du parcours CONNECT venaient de là.
- CI : `deploiement/verifier-candidat.sh` lance aussi `check-account-menu.mjs vision` après le build (l'écart CRLF constaté par Codex vient des fins de ligne Windows de la copie de travail, absent sous Linux).
- Résultats : tests API en PHP 8.3.33 avec MySQL 8.4, mode strict : **146 réussis, 0 échec, 0 ignoré** ; `npm test` : **268 réussis** ; tests des scripts de déploiement : 24 réussis ; `npm run build` réussi.
- Recette locale (navigateur, Conseiller A) : menu « Mon compte » (Mes projets, Mon compte, Mes applications, Se déconnecter) avec liens vers le portail ; déconnexion → `/revue/?logout=1` ; retour dans Vision : « Connexion requise » et bouton **Se reconnecter** → `/revue?app=vision` → compte choisi → retour dans Vision avec ses projets.
- Les boutons « Enregistrer en ligne / en local » du bandeau commun restent sans effet dans Vision (« indisponible pour cette vue ») : comportement standard du composant partagé ; Vision enregistre automatiquement.