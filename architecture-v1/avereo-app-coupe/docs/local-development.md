---
project: avereo-app-coupe
document_type: procedure
title: Tester Coupe réelle dans CONNECT local
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, local, docker, validation]
---

# Tester Coupe réelle dans CONNECT local

## Objectif et prérequis

Cette procédure ouvre Coupe et Rapport réels depuis les profils fictifs de
CONNECT local. Elle ne déploie rien et ne contacte pas Drupal ou cPanel.

Utiliser Windows, PowerShell, Docker Desktop démarré en mode conteneurs Linux et
Node.js compatible avec `frontend/package.json`. Le checkout doit contenir les
trois applications voisines dans `architecture-v1/`. Ne pas lancer deux checkouts
simultanément sur les mêmes ports.

## Démarrer

Dans un terminal, se placer dans `architecture-v1/avereo-app-coupe` **du checkout
que l'on souhaite tester**, puis exécuter :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File local/coupe-local.ps1 up
```

Le lanceur construit Coupe, démarre Apache/PHP, réutilise le lanceur Rapport
`gateway-up`, initialise les fixtures CONNECT locales puis compose les deux
configurations de lancement. Les téléchargements initiaux nécessitent Internet.

1. Ouvrir <http://127.0.0.1:8080/>.
2. Cliquer **Client local** ou **Administrateur local** dans le bandeau de test.
3. Cliquer **Ouvrir l'application** sous Coupe : une nouvelle fenêtre/onglet doit
   afficher l'interface de dessin sur `http://127.0.0.1:8200/`.
4. Depuis CONNECT, ouvrir aussi Rapport : il reste sur `http://127.0.0.1:8100/`.

Projet, Thermo et Drone restent des écrans simulés. Les fixtures locales peuvent
être réinitialisées par le démarrage ; ne pas y saisir de données personnelles
réelles. Les sessions CONNECT sont renouvelées quand son service web est recréé.

## Projets et déconnexion

Utiliser **Sauvegarder** pour télécharger un fichier `coupe-projet-….json`, puis
**Charger** pour le reprendre. Voir [les règles de données](../data/README.md).
Les boutons **Sauver en ligne** / **Ouvrir en ligne** restent présents dans
l'interface historique, mais aucune base Coupe n'est configurée dans ce lot.

Le bouton **Compte AVEREO Connect #…** ferme la session Coupe et revient dans la
fenêtre principale CONNECT. Cliquer ensuite **Se déconnecter** pour afficher la
confirmation, puis confirmer. L'arrivée sur `?logout=1` n'ouvre pas la boîte de
confirmation automatiquement dans le CONNECT actuel.

## Arrêter Coupe et revenir à la simulation

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File local/coupe-local.ps1 down
node tests/local-web.mjs --coupe-placeholder
```

Coupe est arrêtée ; CONNECT retrouve son écran Coupe simulé et conserve Rapport
réel. Aucun `down --volumes` n'est exécuté. Relancer `up` pour retrouver Coupe.

Pour arrêter aussi Rapport, utiliser ensuite son propre `gateway-down`, décrit
dans [la procédure Rapport](../../avereo-app-rapport/docs/local-development.md).
Le lanceur Rapport seul remet son catalogue à lui : pour les deux applications,
toujours revenir au lanceur Coupe `up`.

## Configuration et sécurité

- `local/.env` : secret local distinct `COUPE_CONNECT_GATEWAY_SECRET`, généré une
  seule fois. Ne pas afficher son contenu, le copier dans une PR ou le remplacer
  par un secret hébergé.
- `local/config.php` : dérivé de `config.gateway.example.php` à chaque `up`,
  monté en lecture seule hors du dossier public. Modifier le modèle, pas ce fichier.
- Ces deux fichiers ainsi que les builds et `node_modules/` sont ignorés par Git.
- Le mode HTTP local est explicite. Les règles HTTPS et cookies `Secure` des
  environnements hébergés restent actives par défaut.
- Une habilitation CONNECT n'accorde pas automatiquement le rôle administrateur
  Coupe ; `connect_admin_user_ids` reste une configuration serveur explicite.

La session applicative signée a une durée limitée. Le test de ce lot couvre
l'effacement du cookie Coupe et le contrôle des nouveaux lancements CONNECT,
pas une nouvelle mécanique de révocation globale des cookies de toutes les apps.

## Vérifications techniques

Depuis le dossier Coupe, stack démarrée :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File local/coupe-local.ps1 check
docker run --rm --mount "type=bind,source=$((Get-Location).Path),target=/workspace,readonly" --workdir /workspace php:8.4-cli php tests/connect-gate.php
docker compose -f docker-compose.local.yml config --quiet
```

Voir [l'index des tests](../tests/README.md) pour le périmètre et les limites.

### Résultats du 2026-09-09

- Build Vite Coupe : réussi ; build Rapport via son lanceur existant : réussi.
- Test PHP du sas : réussi.
- Tests HTTP client et propriétaire : réussis, y compris ouverture simultanée
  des deux apps, anti-rejeu, altération, séparation des tickets/cookies et simulations.
- Navigateur intégré : interface Coupe et canvas visibles au format bureau,
  identité client remontée ; retour hors iframe et confirmation CONNECT contrôlés.
- Retour arrière `down` : simulation Coupe restaurée, Rapport réel toujours
  accessible ; redémarrage `up` réussi sans supprimer de volume.
- Tests unitaires CONNECT existants : 36/36 réussis.
- Contrôle documentaire Coupe : socle présent, métadonnées et liens des 13
  documents créés/modifiés vérifiés ; cohérence avec les sources relues.
- Syntaxes PHP et PowerShell, configuration Compose et `git diff --check` : réussis.
- La recette métier complète (plans, calibration, exports graphiques) et le
  cochage de la checklist restent à effectuer par le responsable humain.

### Limites et problèmes constatés

- Le panneau étroit du navigateur intégré ne convient pas à l'interface de dessin
  historique à trois colonnes. Tester dans une fenêtre de bureau suffisamment large ;
  la refonte responsive n'est pas incluse ici.
- `npm audit` Coupe : 3 alertes sur les dépendances de développement (2 élevées,
  1 modérée), présentes dans le lockfile de départ. `npm audit --omit=dev` : aucune
  alerte. Aucun correctif automatique de dépendances n'a été appliqué hors périmètre.
- Le build du lanceur Rapport a également signalé 2 alertes npm ; leur correction
  appartient au périmètre Rapport, non modifié ici.
- Incident local Docker résolu : ses sockets temporaires défectueux ont été
  conservés dans un dossier de sauvegarde avant redémarrage. Aucun volume n'a été
  supprimé. Cette récupération ponctuelle n'est pas une étape du lanceur Coupe.
- Docker Compose peut signaler un ancien volume Rapport d'un autre checkout ;
  il est laissé intact. Utiliser l'instance de ce checkout, sans nettoyer les anciens
  volumes tant que leurs données n'ont pas été identifiées et sauvegardées.

Si Docker ne répond pas, arrêter la recette et diagnostiquer le moteur. Ne pas
réinitialiser Docker aux paramètres d'usine ni supprimer ses volumes pour faire
passer les tests.
