---
project: avereo-app-saisie-unique
document_type: installation-plan
title: Plan d'installation de UNI en préproduction
status: draft
version: git
created: 2026-11-23
updated: 2026-11-23
owner: jpdandin
tags: [avereo, uni, preproduction, connect, installation]
---

# Plan d'installation de UNI en préproduction

Plan préparé le 23 novembre 2026, **non exécuté**. Il ne vaut ni accord d'installation, ni
recette, ni autorisation de merge. Il complète la section « Publication préparée » de
[demo-2026-11-23.md](demo-2026-11-23.md) et ne modifie ni le suivi, ni les validations humaines.

## 1. Objectif et périmètre

Mettre le candidat local UNI à disposition des comptes de démonstration autorisés sur une
cible de préproduction, derrière AVEREO CONNECT, avec retour arrière possible.

**Correction du 23 novembre.** La première version de ce plan supposait la cible absente. Un
contrôle externe sans compte montre l'inverse : `https://uni-preprod.avereo.fr/` répond 303
vers `https://connect-preprod.avereo.fr/?app=uni` et `connect/entry.php` sans ticket répond 403,
ce qui est le comportement du garde partagé. UNI est donc déjà installé derrière CONNECT. La
recette n'est pas documentée dans le dépôt. Les étapes 3 à 5 valent alors comme
**requalification** de la cible (comparer l'empreinte, relire la configuration et la ligne de
catalogue) avant tout remplacement du candidat.

**Empreinte relevée le 23 novembre 2026** (Terminal cPanel, lecture seule, aucun fichier modifié) :

| Fichier installé | SHA-256 | Taille | Date du fichier |
|---|---|---|---|
| `~/uni-preprod.avereo.fr/private/app.html` | `fadd264951b170db413c635dbb803d2653c27bd55aab5227256b8f48d1d415a0` | 7 816 058 octets | 2026-11-21 11:05 |
| `~/uni-preprod.avereo.fr/private/gate.php` | `895abf0230651dcc43e43acb691ac3aef4449e6b47b58824f2a495d9ad8c99d7` | 11 231 octets | 2026-11-21 10:37 |

L'empreinte de `app.html` a été revérifiée par une seconde commande. Elle est celle du fichier
construit avec le pack privé de modèles : un build local sans ce pack donne un fichier
beaucoup plus petit (environ 1,8 Mo) et ne peut pas la reproduire. Le `gate.php` installé diffère de
`connect-gate.php` du dépôt (11 231 octets contre 11 230) ; la cause (étape de préparation du
garde ou écart) n'est pas établie. Contrôle web : `/private/app.html`, `/private/gate.php` et
`/public/index.php` répondent 404, et `/` redirige vers CONNECT.

**Rapprochement avec le chat qui a fabriqué le candidat (réponse déclarative du 23 novembre).**
Ces éléments viennent du compte rendu du chat UNI, non de contrôles faits dans cette session :

- `artifactSha256` du manifeste (`.local/release/manifest.json`) : identique à l'empreinte de
  `app.html` relevée ci-dessus ; `gate.php` identique aussi. Limite : les deux empreintes figuraient
  dans la question posée au chat, donc la concordance est rapportée, pas recalculée ici.
- Commit source désigné par le pack : `af1f7b853779d1e280208dc07f58b1f9c1d01637` (dernier
  commit de code UNI sur `main`). Le manifeste ne contient aucun SHA Git et a été généré
  37 secondes avant l'horodatage de ce commit : l'empreinte ne prouve donc pas à elle seule un
  build exécuté depuis ce commit. La tête ultérieure de la PR #179, `180b3fa`, concerne le
  chargement de la configuration privée dans CONNECT.
- Installation le 21/11/2026 : téléversement terminé à 11 h 51, extraction cPanel confirmée à
  11 h 54, réponse HTTPS constatée à 12 h 07 (heure de Paris). L'heure de 11 h 05 du fichier
  correspond à la génération du bundle.
- Catalogue CONNECT : au dernier contrôle authentifié du chat, la tuile UNI était **absente**
  pour l'organisation de démonstration (7 membres actifs, droit `uni:use`, statut proposé `active`).
  La simulation a renvoyé `write: false` et aucune exécution avec confirmation n'est prouvée.
  L'état actuel de la ligne en base est à vérifier : le responsable indique l'avoir vue présente
  dans le catalogue de préproduction depuis, ce qui n'est pas documenté.
- Recette : seul « accès direct sans session → redirection vers CONNECT » est vérifié sur la
  cible. Ticket valide, expiré ou rejoué, déconnexion, parcours métier hébergé et téléchargements
  hébergés n'ont aucun résultat documenté ; les essais métier et de téléchargement sont locaux
  (46 tests unitaires ; test de téléchargement et réimport échoué en Chrome local, réussi en CI).

Hors périmètre : production, persistance serveur des dossiers, synchronisation
multiutilisateur, dépôt Anah, changement des droits CONNECT existants, publication des
modèles ou des fichiers générés dans le dépôt.

## 2. Hypothèses à confirmer

| # | Hypothèse | Source | À confirmer par |
|---|---|---|---|
| H1 | URL cible `https://uni-preprod.avereo.fr`, racine web `public` | **constatée** le 23/11 : le sous-domaine répond ; racine `public` à confirmer sur la cible | responsable |
| H2 | Portail CONNECT de préproduction `https://connect-preprod.avereo.fr` | **constaté** le 23/11 : redirection `?app=uni` vers ce portail | responsable |
| H3 | Fichier de configuration privé `~/.avereo/uni-preprod/config.php` | `connect-gate.php` : chemin cherché dès que la racine web contient `preprod` | à contrôler sur la cible |
| H4 | ~~Le sous-domaine n'existe pas encore~~ **Infirmée** : sous-domaine et HTTPS existent ; version installée et présence de la ligne de catalogue `uni` à confirmer | contrôle externe du 23/11 ; la base CONNECT n'est pas lisible depuis le dépôt | responsable |
| H5 | Le pack privé de modèles est disponible sur le poste de build | `preparer-modeles.py` en a besoin ; absent de ce checkout | responsable |

## 3. Décisions et accords humains requis avant l'étape 3

Le secret, l'accès et la ligne de catalogue existent peut-être déjà (voir la correction du §1) :
les points 3 à 5 ci-dessous se limitent alors à les vérifier, sans les recréer.

1. Confirmer H1 à H5.
2. Accord exact d'installation en préproduction de ce candidat (empreinte de l'étape 2).
3. Création du secret UNI (32 caractères aléatoires minimum, distinct des autres
   applications). Je ne le génère, ne le lis et ne le consigne pas : il est saisi par le
   responsable sur la cible et dans CONNECT.
4. Accès à la cible (Terminal cPanel ou FTPS) ouvert par le responsable.
5. Compte opérateur CONNECT (owner/admin) et organisation de démonstration pour le catalogue.

## 4. Étapes

### Étape 1 — Contrôles locaux (réalisables sans accord)

Déjà constatés le 23/11 : `npm test` 46/46, `npm run build` réussi, dépendances aux versions
déclarées (React 19.2.8, esbuild 0.28.2, Playwright 1.56.0). À refaire sur le commit exact
du candidat :

```sh
cd architecture-v1/avereo-app-saisie-unique/frontend
npm install --no-package-lock --prefer-offline --no-audit --no-fund
npm test
npm run test:e2e
```

Le test de téléchargement puis réimport doit réussir (échec local connu : `download.saveAs: canceled`).

### Étape 2 — Fabriquer le candidat

```sh
cd architecture-v1/avereo-app-saisie-unique
python workflows/preparer-modeles.py DOSSIER_MODELES .local/modeles-demo.json
node frontend/scripts/build.mjs --templates .local/modeles-demo.json --livrer
node frontend/scripts/demo-pack.mjs
node workflows/preparer-livraison.mjs
```

Résultat attendu : `.local/release/public`, `.local/release/private/app.html`,
`private/gate.php`, `manifest.json` avec `environment: preproduction`,
`productionAuthorized: false` et l'empreinte SHA-256 à noter. `.local/` n'est jamais commité.

### Étape 3 — Préparer la cible (après accords)

1. Créer le sous-domaine `uni-preprod.avereo.fr` avec le HTTPS actif et la racine **`public`**
   uniquement ; `private` reste hors racine web.
2. Sauvegarder l'état existant de la cible (même vide) et le noter dans le reçu.
3. Créer le répertoire privé de nonces, accessible en écriture, hors racine web.
4. Écrire `~/.avereo/uni-preprod/config.php` (droits restreints) avec :
   `environment = preproduction`, `connect_portal_url = https://connect-preprod.avereo.fr`,
   `connect_launch_secret` (secret UNI), `connect_launch_nonce_directory` (étape 3.3).
   Contrôler si les autres applications de préproduction renseignent aussi
   `connect_trial_access_file` et aligner UNI le cas échéant.

### Étape 4 — Installer le candidat

1. Déposer `public/` dans la racine web et `private/` hors racine web.
2. Recalculer l'empreinte de `private/app.html` sur la cible : elle doit égaler celle du manifeste.
3. Contrôler la syntaxe PHP des trois entrées (`index.php`, `connect/entry.php`, `connect/logout.php`).

### Étape 5 — Raccorder CONNECT (sauvegarde préalable de la configuration et du catalogue)

1. Dans la configuration de CONNECT préproduction, renseigner
   `APP_LAUNCH_UNI_URL=https://uni-preprod.avereo.fr/connect/entry.php` et
   `APP_LAUNCH_UNI_SECRET` (même secret que l'étape 3.4).
2. Simuler la ligne de catalogue (sans `--confirm`) et relire l'aperçu :

```sh
php backend/bin/manage-catalog.php --code uni --name "AVEREO UNI" \
  --launch-url https://uni-preprod.avereo.fr/connect/entry.php \
  --status active --organization-slug ORGANISATION_DEMO --actor-subject COMPTE_OPERATEUR
```

3. Relancer la même commande avec `--confirm` seulement si l'aperçu est conforme. Ne
   toucher à aucune autre application du catalogue.

### Étape 6 — Recette de la cible

| # | Contrôle | Attendu |
|---|---|---|
| R1 | Accès direct à `https://uni-preprod.avereo.fr/` sans session | redirigé vers CONNECT, aucune page UNI |
| R2 | Ouverture depuis la tuile CONNECT (compte autorisé) | UNI s'affiche |
| R3 | Rejeu du même ticket | refusé (403) |
| R4 | Ticket expiré | refusé (403) |
| R5 | Compte sans droit sur UNI | refusé |
| R6 | Déconnexion | retour au portail, UNI inaccessible ensuite |
| R7 | Parcours métier : tableau de bord, ajout du dossier de démonstration, fiche, gel du devis | conforme à `demo-2026-11-23.md` |
| R8 | Téléchargements : 12 modèles PDF/Word, synthèse imprimée | fichiers générés, en-têtes PDF conservés |
| R9 | Réimport d'une sauvegarde JSON | dossiers ajoutés sans écrasement |
| R10 | Console et réseau | aucune erreur JavaScript, aucun appel réseau sortant |
| R11 | Mobile | pas de débordement |
| R12 | Aucune donnée réelle ; cible réservée aux comptes de démonstration | confirmé par le responsable |

### Étape 7 — Reçu

Consigner (hors dépôt si la cible est sensible) : URL, empreinte installée, date, sauvegardes,
résultats R1 à R12, écarts. Aucune bascule production dans ce lot.

## 5. Retour arrière

- Avant l'étape 4 : rien à défaire hors cible.
- Après l'étape 4 : restaurer la sauvegarde de l'étape 3.2 (ou vider `public` et `private`).
- Après l'étape 5 : restaurer la configuration et le catalogue CONNECT sauvegardés, ou
  passer la ligne `uni` en `suspended` via `manage-catalog.php`, et retirer les deux
  variables `APP_LAUNCH_UNI_*`.
- Le retour arrière ne concerne que UNI : les autres applications ne sont pas modifiées.

## 6. Risques et limites

- Rendu des Word non vérifié (moteur absent) ; cases, signatures, pièces, photos et annexes à contrôler.
- Les modèles sont ceux fournis, sans attestation de validité réglementaire actuelle (Q21).
- Stockage métier local au navigateur : vider les données du navigateur efface les dossiers.
- Le bouton commun « Enregistrer en ligne » ne valide pas la persistance UNI.
- Le test Edge n'a pas été exécuté avec succès.
- Aucun fichier `package-lock.json` : `npm ci` échoue ; l'installation se fait sans lockfile.
- Réception hébergée et autorisation de merge restent des décisions du responsable.
