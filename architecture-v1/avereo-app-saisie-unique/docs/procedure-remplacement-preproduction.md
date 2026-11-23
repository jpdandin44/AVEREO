---
project: avereo-app-saisie-unique
document_type: procedure
title: Procédure de remplacement du candidat UNI en préproduction
status: draft
version: git
created: 2026-11-23
updated: 2026-11-23
owner: jpdandin
tags: [avereo, uni, preproduction, installation, connect]
---

# Procédure de remplacement du candidat UNI en préproduction

**Brouillon, non exécuté.** Cette procédure ne vaut ni accord d'installation ni autorisation de merge. Elle
complète le [plan d'installation](plan-installation-preproduction.md) pour le cas réel du 23 novembre :
UNI est déjà installé derrière CONNECT, et seul le fichier de l'application doit être remplacé.

## 1. Objet et périmètre

Remplacer `private/app.html` sur `uni-preprod.avereo.fr` par un candidat qui contient les deux corrections de la
recette du 23 novembre ([fiche de recette](recette-preproduction.md)) :

- PR #184 : « Procuration (fonds) » enregistrée sous `PRP` dans le pack de modèles (11 modèles sur 12 utilisables avant).
- PR #185 : la liste des dossiers ne déborde plus de la page à 375 px (R11).

Ne sont **pas** modifiés : `~/.avereo/uni-preprod/config.php`, le secret UNI, le répertoire de nonces, CONNECT,
la ligne de catalogue `uni`, le dossier `public/` et `private/gate.php`. Hors périmètre : production, persistance
serveur, rendu des Word.

## 2. Accords et entrées à fournir par le responsable

1. Merge de #184 et de #185 dans `main` (avec leurs contrôles). Le candidat est fabriqué à partir d'un commit
   nommé de `main` qui contient les deux ; ce commit est consigné dans le reçu (le manifeste ne porte pas de SHA Git).
2. Emplacement des modèles sources privés (`DOSSIER_MODELES`), absents de ce poste. Ils ne sont jamais commités.
3. Autorisation d'installer les dépendances Python `python-docx` et `pypdf` (téléchargement depuis PyPI), absentes ici.
4. **Accord exact d'installation** de l'empreinte SHA-256 du candidat, une fois calculée à l'étape 4 ci-dessous.
5. Accès à la cible (Terminal cPanel) ouvert par le responsable.

## 3. Prérequis constatés le 23 novembre 2026 sur le poste de travail

| Élément | État |
|---|---|
| Node 24.18.0 ; React 19.2.8, esbuild 0.28.2, Playwright 1.56.0, pdf-lib 1.17.1, JSZip 3.10.1 | présents, aux versions déclarées |
| Python 3.14.6 ; `python-docx`, `pypdf` | **modules absents** |
| Modèles sources privés | **absents** |
| Navigateur de Playwright | absent ; Chrome installé : l'indiquer par `UNI_BROWSER_EXECUTABLE` |
| `npm run test:e2e` (via `node --test`) | ne rend pas la main sur ce poste ; `node tests/e2e/ecrans.test.mjs` s'exécute normalement (10 tests sur 10) |
| `private/gate.php` | le fichier du poste (CRLF, 11 517 octets) diffère du fichier du dépôt (11 230 octets) et de l'installé (11 231 octets) : **ne pas le livrer** |

## 4. Fabrication du candidat

Depuis un checkout propre du commit retenu (`git rev-parse HEAD` à consigner) :

```sh
cd architecture-v1/avereo-app-saisie-unique/frontend
npm install --no-package-lock --prefer-offline --no-audit --no-fund
npm test
UNI_BROWSER_EXECUTABLE="CHEMIN_CHROME" node tests/e2e/ecrans.test.mjs
cd ..
python workflows/preparer-modeles.py DOSSIER_MODELES .local/modeles-demo.json
node frontend/scripts/build.mjs --templates .local/modeles-demo.json --livrer
node frontend/scripts/demo-pack.mjs
node workflows/preparer-livraison.mjs
```

Contrôles avant tout dépôt :

- `npm test` et les tests d'écran réussissent, dont le test à 375 px.
- La sortie de `preparer-modeles.py` liste 12 codes et contient `PRP`, pas `PRF`.
- `.local/livraison/documents/generation.json` contient `PRP` ; ce fichier ne sert que de contrôle et reste hors dépôt.
- `.local/release/manifest.json` : `environment: preproduction`, `productionAuthorized: false`. Noter `artifactSha256`.

Seul `.local/release/private/app.html` est déposé. Le reste de `.local/` (modèles, documents générés) n'est ni
commité, ni transmis, ni collé dans une conversation.

## 5. Remplacement sur la cible (après l'accord exact du point 2.4)

Dans le Terminal cPanel, `RACINE` étant `~/uni-preprod.avereo.fr` ; `private` reste hors racine web :

```sh
cd RACINE/private
sha256sum app.html                       # attendu avant remplacement : fadd2649…415a0
cp -p app.html app.html.avant-20261123   # sauvegarde, même dossier privé
# déposer le candidat sous le nom app.html.nouveau (gestionnaire de fichiers ou FTPS)
sha256sum app.html.nouveau               # doit égaler artifactSha256 du manifeste
chmod --reference=app.html app.html.nouveau
mv -f app.html.nouveau app.html
sha256sum app.html                       # doit égaler artifactSha256 du manifeste
```

Si une empreinte ne correspond pas, arrêter : ne pas faire le `mv` (ou revenir en arrière, §7).

## 6. Recette après remplacement

Dans une session CONNECT ouverte par le responsable, sur la tuile UNI. Données fictives uniquement.

| Contrôle | Attendu |
|---|---|
| R1 | accès direct sans session : redirection vers CONNECT |
| R2 | UNI s'ouvre depuis la tuile |
| R8 | après gel du devis, 12 modèles sur 12 générables ; « Procuration (fonds) » n'est plus désactivée |
| R11 | à 375 px, la page ne déborde pas ; la liste des dossiers défile dans son cadre |
| R7, R9, R10 | gel du devis, export et réimport, console sans erreur : inchangés |

Les dossiers du navigateur (clé `avereo-uni-dossiers`) ne sont pas touchés par ce remplacement. Prévoir un
rechargement forcé du navigateur si l'ancienne version s'affiche. Les résultats sont ajoutés à la fiche de recette.

## 7. Retour arrière

```sh
cd RACINE/private
mv app.html app.html.rejete
mv app.html.avant-20261123 app.html
sha256sum app.html                       # doit redonner fadd2649…415a0
```

Le retour arrière ne concerne que `app.html`. Supprimer `app.html.rejete` et la sauvegarde seulement après accord.

## 8. Reçu à consigner

URL, commit source (`git rev-parse HEAD`), empreintes avant et après, date et heure, noms des sauvegardes,
résultats de la recette, écarts. Aucun secret ni ticket CONNECT.

## 9. Risques et limites

- Le pack de modèles est privé et intégré à `app.html` : ce fichier ne quitte jamais l'espace privé de la cible.
- La fabrication réelle dépend des modèles sources ; sans eux, la correction PRP n'est pas vérifiable de bout en bout.
- L'origine exacte du `gate.php` installé (différence d'un octet avec le dépôt) n'est pas expliquée ; ce remplacement n'y touche pas.
- Rendu des Word, Edge, Firefox et téléphone réel restent non vérifiés.
