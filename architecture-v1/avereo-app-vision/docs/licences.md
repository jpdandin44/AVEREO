---
project: avereo-app-vision
document_type: licenses
title: Licences des dépendances
status: active
version: git
created: 2026-11-23
updated: 2026-11-26
owner: jpdandin
tags: [vision, licences]
---

# Licences des dépendances — AVEREO Vision

T-10 (26/11/2026) : aucune dépendance ajoutée ; compression par canvas, empreinte par Web Crypto, serveur PHP sans bibliothèque supplémentaire. Les fichiers npm et leur verrouillage restent inchangés.

Initialisé au Lot 0 (23/11/2026). **Aucune dépendance n'est installée à ce stade** : le Lot 0 ne produit aucun code applicatif. Les lignes ci-dessous sont les dépendances **prévues** par l'ADR 0001 ; elles passent à « installée » au lot qui les ajoute, avec la version réellement fixée.

## Règles (AGENTS.md)
- Licences acceptées pour le code : MIT, BSD (2 ou 3 clauses), Apache 2.0. Polices : SIL Open Font License.
- Toute autre licence (GPL, LGPL, AGPL, MPL, licence non commerciale, licence absente, ou permissive hors liste) : arrêt et question au responsable avant adoption.
- Chaque dépendance ajoutée est inscrite ici : nom, version, licence, usage. Le sous-agent verif-licences lit le fichier LICENSE du dépôt officiel avant l'inscription.
- Dépendances système (bibliothèques et programmes embarqués dans un conteneur, non installés par npm ou Composer) : mêmes règles ; celles qui sortent de la liste sont suivies dans la section « Dépendances système à instruire » et par la décision D6.
- Reproduire les fonctions de Visuary, jamais ses éléments : aucun nom, logo, texte, icône, maquette, code ou fichier de Visuary ne figure dans le projet.

## Dépendances prévues
Version observée = dernier tag stable relevé le 20/11/2026 ; la version fixée est celle du lot d'installation. Statut : **prévue** (non installée) ou **installée** (lot 1, contrôle du 24/11/2026 : fichier LICENSE lu dans `node_modules` par le sous-agent verif-licences, concordant avec le champ `license`).

| Nom | Version observée | Licence | Usage | Lot | Statut |
|---|---|---|---|---|---|
| React, React DOM | 19.3.1 | MIT | interface | 1 | **installée** |
| Vite | 7.3.8 | MIT | outil de build | 1 | **installée** (développement) |
| @vitejs/plugin-react | 5.2.0 | MIT | plugin React de Vite | 1 | **installée** (développement) |
| Outil de test | — | lanceur natif de Node (`node --test`) | tests unitaires de la logique de métré | 1 | aucune dépendance ajoutée (Vitest abandonné, décision du 24/11/2026) |
| Konva | 10.11.0 | MIT | plan 2D | 1 | **installée** |
| react-konva | 19.3.2 | MIT | plan 2D (liaison React) | 1 | **installée** (exige React 19) |
| flatten-js (`@flatten-js/core`) | 1.6.15 | MIT | géométrie plane des pièces | — | non installée : la surface (formule de Gauss) et l'auto-intersection sont codées dans `frontend/src/domain/geometrie.js` |
| Inter (`@fontsource/inter`) | 5.3.0 | SIL OFL 1.1 | police de l'interface, auto-hébergée | 1 | **installée** |
| JetBrains Mono (`@fontsource/jetbrains-mono`) | 5.3.0 | SIL OFL 1.1 | cotes et données techniques, auto-hébergée | 1 | **installée** |
| Dexie | 4.4.7 | Apache 2.0 | stockage hors ligne (IndexedDB) | 2 | **installée** (aucune dépendance transitive) |
| fake-indexeddb | 6.2.8 | Apache 2.0 | simulation d'IndexedDB pour tester le stockage Dexie sous Node | 2 | **installée, dépendance de développement seulement** (jamais dans le build) |
| vite-plugin-pwa | 2.0.0 | MIT | manifeste et service worker | 2C | **installée** (dépendance de développement : construction seulement) |
| Workbox (`workbox-window` 7.4.1 et modules générés) | 7.4.1 | MIT | service worker : seuls les modules MIT de précache et de routage sont livrés dans `sw.js` | 2C | **installée** |
| tus-js-client | 4.3.1 | MIT | envoi reprenable des vidéos | 3 | prévue (repli : envoi par morceaux maison) |
| tus-php | 2.4.0 | MIT | serveur d'envoi reprenable | 3 | prévue (à valider : maintenance faible) |
| @tarikjabiri/dxf | 2.10.1 | MIT | export DXF | 4 | prévue |
| Gotenberg (conteneur) | 9.9.1 | MIT ; embarque Chromium et LibreOffice | HTML vers PDF | 4 | prévue **sous réserve de la décision D6** ; **À VÉRIFIER** : licences de Chromium et LibreOffice |
| three | r187 | MIT | maquette 3D, exporteurs glTF et OBJ | 5 | prévue |
| @react-three/fiber | 9.8.2 | MIT | maquette 3D (liaison React) | 5 | prévue |
| @react-three/drei | 10.7.9 | MIT | aides pour la vue 3D | 5 | prévue |
| three-bvh-csg | 0.0.18 | MIT | percer les ouvertures dans les murs | 5 | prévue |
| glTF-Transform | 4.5.1 | MIT | optimiser les fichiers glTF partagés | 5 | prévue ; **À VÉRIFIER** : licences de Draco et Meshopt |
| glTF-Validator | 2.0.0-dev.3.10 (développement) | Apache 2.0 | test des exports glTF | 5 | prévue (test seulement) |
| model-viewer | 4.4.0 | Apache 2.0 | page de partage client (option) | 5 | option |
| Générateur IFC4 maison | — | code AVEREO | export IFC | 6 | prévue (décision D1) |
| COLMAP | 4.2.1 | BSD-3 ; **embarque LSD (AGPL-3.0) et SiftGPU (non lucratif)** | reconstruction 3D (service) | 7 et 8 | prévue **compilée avec LSD et CGAL désactivés et sans GPU (CUDA et OpenGL)** ; Boost (BSL-1.0) et Eigen (MPL-2.0) requis : décision D6 ; **À VÉRIFIER** |
| OpenSfM | 1.1 | BSD-2 | densification CPU (service) | 8 | prévue sous réserve ; dépôt actuel (OpenSfM/OpenSfM ?) et chemin CPU **À VÉRIFIER** |
| Open3D | 0.20.0 | MIT | maillage et nettoyage (service) | 8 | prévue |
| OpenCV | 5.1.0 | Apache 2.0 | mire ArUco, extraction d'images (service) | 8 | prévue ; FFmpeg (LGPL ou GPL selon la compilation) : décision D6 |
| trimesh | 5.2.1 | MIT | export du maillage (service) | 8 | prévue |
| ezdxf | 1.4.5 | MIT | repli DXF côté service | — | option |
| WeasyPrint | 70.0 | BSD-3 ; dépend de Pango (LGPL) | repli PDF | — | option sous réserve de D6 |
| league/csv | 9.29.0 | MIT | repli CSV | — | option |
| Manifold | 3.5.5 | Apache 2.0 | repli booléens 3D | — | option |
| MapAnything (modèle « apache ») | 1.1.3 | Apache 2.0 | reconstruction par apprentissage, **seulement si GPU (D2)** | 8 | option |

## Dépendances transitives du Lot 1 (contrôle du 24/11/2026)
125 paquets transitifs (`package-lock.json`), tous avec une licence renseignée : MIT 115, ISC 5, OFL-1.1 2 (les polices), Apache-2.0 1, BSD-3-Clause 1, CC-BY-4.0 1. Aucune licence GPL, LGPL, AGPL, MPL, non commerciale ou absente. Les paquets livrés dans le build (react, react-dom, konva, react-konva et leurs dépendances directes) sont tous MIT.

| Paquet | Licence | Usage | Statut |
|---|---|---|---|
| caniuse-lite 1.0.30001827 | **CC-BY-4.0** (données de compatibilité des navigateurs, licence non logicielle) | dépendance transitive de développement des outils de build ; non livrée dans l'application | **Accepté par le responsable le 24/11/2026** (exception limitée : données, dépendance de développement, non livrée dans l'application ; hors de la liste MIT, BSD, Apache 2.0 de `AGENTS.md`) |

## Lot 2C : outils de construction de l'application installable (décision D13 du 25/11/2026)
`vite-plugin-pwa` et `workbox-build` apportent 22 dépendances de construction sous des licences permissives hors de la liste MIT, BSD, Apache 2.0 de `AGENTS.md` : **ISC** (13 : at-least-node, foreground-child, get-own-enumerable-property-symbols, idb, isexe, minimatch 5, signal-exit, which, etc.) et **BlueOak-1.0.0** (9 : glob, graceful-fs, jackspeak, lru-cache 11, minimatch 10, minipass, path-scurry, package-json-from-dist, @isaacs/cliui). `type-fest` est sous double licence MIT ou CC0 (MIT retenue). **Accepté par le responsable le 25/11/2026** : exception limitée aux outils exécutés pendant la construction, **rien de ces paquets n'est livré** dans l'application (le `sw.js` livré ne contient que les modules Workbox MIT de précache et de routage ; `idb` n'est pas utilisé). `@vite-pwa/assets-generator` n'est **pas** installé (il tire `sharp`/libvips, LGPL) : les icônes provisoires sont produites par `frontend/scripts/icones-provisoires.mjs`, sans dépendance.

## Lot 2A : aucune nouvelle dépendance de code
Ni npm ni Composer : l'API PHP, les tests PHP, l'exécuteur de migrations et la passerelle CONNECT sont écrits dans le dépôt, sans bibliothèque tierce. Environnement de développement local (non livré, non redistribué) : images Docker `php:8.4-cli` et `php:8.3-cli` (PHP License 3.01 ; la 8.3 est la version de l'hébergement, pour les tests) avec l'extension `pdo_mysql` compilée depuis les sources de l'image, et image `mysql:8.4` (MySQL, GPL-2.0 avec exception pour les logiciels libres) utilisée uniquement comme service local ; la pile MySQL est imposée par `AGENTS.md`. Rien n'est ajouté à l'application livrée.

## Dépendances système à instruire (décision D6)
Signalées par la relecture adversariale Codex du Lot 0 ; non revérifiées sur les sources amont à ce stade. **Décision D6 du responsable (23/11/2026)** : un programme exécuté côté serveur, non modifié, non redistribué et inscrit ici peut être sous BSL-1.0, MPL-2.0 ou LGPL ; AGPL, GPL, non commercial et propriétaire restent exclus. Ces lectures de licence ne sont pas un avis juridique.

| Composant | Requis par | Licence signalée | Lot | Statut |
|---|---|---|---|---|
| Boost | COLMAP | BSL-1.0 (hors liste) | 7 | accepté (règle D6) |
| Eigen | COLMAP | MPL-2.0 | 7 | accepté (règle D6), version non modifiée, dans le conteneur de traitement |
| FFmpeg | extraction d'images (OpenCV, service) | LGPL ou GPL selon la compilation | 7 | accepté sous règle D6 si le build n'a aucun composant GPL : **À VÉRIFIER au lot 7** |
| Pango | WeasyPrint (repli PDF) | LGPL | — | non décidé : à trancher seulement si le repli WeasyPrint est utilisé |
| LibreOffice | image Gotenberg | MPL-2.0 et autres | 4 | accepté en principe (règle D6, image amont non modifiée) ; audit au lot 4 ; étudier une image sans LibreOffice |
| Chromium | image Gotenberg | licences multiples | 4 | accepté en principe (règle D6) ; à instruire au lot 4 |

## Code réutilisé d'autres projets
Aucun à ce jour. Si des extraits de house-planner (MIT, structure murs/pièces, exports DXF/PDF/CSV) sont repris, chaque emprunt est inscrit ici avec le projet, le fichier d'origine, l'auteur et le texte de copyright de sa licence MIT.

| Projet | Fichier d'origine | Fichier AVEREO | Copyright et licence | Date |
|---|---|---|---|---|
| — | — | — | — | — |

## Licences écartées (hors politique)
| Outil | Licence | Raison | Alternative retenue |
|---|---|---|---|
| WebODM, ODM, OpenMVS, OpenSplat, xeokit SDK | AGPL-3.0 | copyleft réseau | COLMAP conforme, OpenSfM, three.js |
| LSD (dans COLMAP) | AGPL-3.0 | actif par défaut | désactivé à la compilation |
| SiftGPU (dans COLMAP) | non lucratif seulement | compilé dès que le GPU est activé | COLMAP sans GPU |
| Meshroom / AliceVision, OpenMVG, web-ifc, IFClite | MPL-2.0 | copyleft par fichier | COLMAP, OpenSfM ; web-ifc = décision D1 |
| IfcOpenShell | LGPL-3.0 | LGPL | générateur maison ; accepté **comme outil de test seulement** (D5, 23/11/2026) |
| Dompdf, TCPDF | LGPL | LGPL | Gotenberg |
| mPDF | GPL-2.0 | GPL | Gotenberg |
| Sweet Home 3D | GPL | GPL, outil de bureau | — |
| FreeCAD | LGPL-2.1 | outil de bureau | — |
| DUSt3R, MASt3R | CC BY-NC-SA 4.0 | usage commercial interdit | MapAnything (modèle Apache) |
| 3D Gaussian Splatting (Inria) | non commercial | usage commercial interdit | gsplat, Brush (Apache 2.0) |
| VGGT | licence propre Meta | licence non standard | MapAnything (modèle Apache) |
| tldraw | propriétaire | clé payante en production | Konva |
| Clipper2 | Boost Software License 1.0 | refusé (D4, 23/11/2026) | flatten-js |
| JSTS | EPL-1.0 / EDL-1.0 | refusé (D4, 23/11/2026) | flatten-js |
| FPDF | permissive propre | refusé (D4, 23/11/2026) | Gotenberg |

## À VÉRIFIER
- Licence réelle de chaque dépendance à la date d'installation (lecture du fichier LICENSE du dépôt officiel par verif-licences) et dépendances transitives de l'arbre npm et Composer.
- Options de compilation de COLMAP, licences de Chromium, LibreOffice, FFmpeg, Draco et Meshopt.
- Licence des poids des extracteurs éventuellement associés à LightGlue/hloc (non retenus).
