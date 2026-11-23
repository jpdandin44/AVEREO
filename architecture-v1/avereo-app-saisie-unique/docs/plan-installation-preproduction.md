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

Hors périmètre : production, persistance serveur des dossiers, synchronisation
multiutilisateur, dépôt Anah, changement des droits CONNECT existants, publication des
modèles ou des fichiers générés dans le dépôt.

## 2. Hypothèses à confirmer

| # | Hypothèse | Source | À confirmer par |
|---|---|---|---|
| H1 | URL cible `https://uni-preprod.avereo.fr`, racine web `public` | schéma des autres applications (`<app>-preprod.avereo.fr`) ; accord de principe du 23/11 | responsable |
| H2 | Portail CONNECT de préproduction `https://connect-preprod.avereo.fr` | `.env.example` CONNECT et docs des autres applications | responsable |
| H3 | Fichier de configuration privé `~/.avereo/uni-preprod/config.php` | `connect-gate.php` : chemin cherché dès que la racine web contient `preprod` | à contrôler sur la cible |
| H4 | Le sous-domaine, son certificat HTTPS et sa racine `public` n'existent pas encore | aucune trace dans le dépôt | responsable |
| H5 | Le pack privé de modèles est disponible sur le poste de build | `preparer-modeles.py` en a besoin ; absent de ce checkout | responsable |

## 3. Décisions et accords humains requis avant l'étape 3

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
