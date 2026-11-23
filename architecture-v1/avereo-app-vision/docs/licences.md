# Licences des dépendances — AVEREO Vision

Initialisé au Lot 0 (23/11/2026). **Aucune dépendance n'est installée à ce stade** : le Lot 0 ne produit aucun code applicatif. Les lignes ci-dessous sont les dépendances **prévues** par l'ADR 0001 ; elles passent à « installée » au lot qui les ajoute, avec la version réellement fixée.

## Règles (AGENTS.md)
- Licences acceptées pour le code : MIT, BSD (2 ou 3 clauses), Apache 2.0. Polices : SIL Open Font License.
- Toute autre licence (GPL, LGPL, AGPL, MPL, licence non commerciale, licence absente, ou permissive hors liste) : arrêt et question au responsable avant adoption.
- Chaque dépendance ajoutée est inscrite ici : nom, version, licence, usage. Le sous-agent verif-licences lit le fichier LICENSE du dépôt officiel avant l'inscription.
- Reproduire les fonctions de Visuary, jamais ses éléments : aucun nom, logo, texte, icône, maquette, code ou fichier de Visuary ne figure dans le projet.

## Dépendances prévues
Version observée = dernier tag stable relevé le 20/11/2026 ; la version fixée sera celle du lot d'installation. Statut : **prévue** (non installée).

| Nom | Version observée | Licence | Usage | Lot | Statut |
|---|---|---|---|---|---|
| React, React DOM | à relever au Lot 1 | MIT (à confirmer par verif-licences) | interface (stack de l'application Rapport) | 1 | prévue |
| Vite | à relever au Lot 1 | MIT (à confirmer) | outil de build | 1 | prévue |
| Outil de test (proposé : Vitest) | à relever au Lot 1 | MIT (à confirmer) | tests unitaires de la logique de métré | 1 | prévue |
| Konva | 10.10.0 | MIT | plan 2D | 1 | prévue |
| react-konva | 19.3.2 | MIT | plan 2D (liaison React) | 1 | prévue |
| flatten-js (`@flatten-js/core`) | 1.6.15 | MIT | géométrie plane des pièces | 1 | prévue |
| Inter | à relever au Lot 1 | SIL OFL 1.1 | police de l'interface | 1 | prévue |
| JetBrains Mono | à relever au Lot 1 | SIL OFL 1.1 | cotes et données techniques | 1 | prévue |
| Dexie | 4.4.7 | Apache 2.0 | stockage hors ligne | 2 | prévue |
| vite-plugin-pwa | 2.0.0 | MIT | manifeste et service worker | 2 | prévue |
| Workbox | 7.4.1 | MIT | service worker (via vite-plugin-pwa) | 2 | prévue |
| tus-js-client | 4.3.1 | MIT | envoi reprenable des vidéos | 3 | prévue (repli : envoi par morceaux maison) |
| tus-php | 2.4.0 | MIT | serveur d'envoi reprenable | 3 | prévue (à valider : maintenance faible) |
| @tarikjabiri/dxf | 2.10.1 | MIT | export DXF | 4 | prévue |
| Gotenberg (conteneur) | 9.9.1 | MIT ; embarque Chromium et LibreOffice | HTML vers PDF | 4 | prévue ; **À VÉRIFIER** : licences de Chromium et LibreOffice |
| three | r187 | MIT | maquette 3D, exporteurs glTF et OBJ | 5 | prévue |
| @react-three/fiber | 9.8.2 | MIT | maquette 3D (liaison React) | 5 | prévue |
| @react-three/drei | 10.7.9 | MIT | aides pour la vue 3D | 5 | prévue |
| three-bvh-csg | 0.0.18 | MIT | percer les ouvertures dans les murs | 5 | prévue |
| glTF-Transform | 4.5.1 | MIT | optimiser les fichiers glTF partagés | 5 | prévue ; **À VÉRIFIER** : licences de Draco et Meshopt |
| glTF-Validator | 2.0.0-dev.3.10 | Apache 2.0 | test des exports glTF | 5 | prévue (test seulement) |
| model-viewer | 4.4.0 | Apache 2.0 | page de partage client (option) | 5 | option |
| Générateur IFC4 maison | — | code AVEREO | export IFC | 6 | prévue (décision D1) |
| COLMAP | 4.2.1 | BSD-3 ; **embarque LSD (AGPL-3.0) et SiftGPU (non lucratif)** | reconstruction 3D (service) | 7 et 8 | prévue **compilée avec LSD_ENABLED=OFF, CGAL_ENABLED=OFF, sans GPU** ; **À VÉRIFIER** |
| OpenSfM | 1.1 | BSD-2 | densification CPU (service) | 8 | prévue ; dépôt actuel **À VÉRIFIER** |
| Open3D | 0.20.0 | MIT | maillage et nettoyage (service) | 8 | prévue |
| OpenCV | 5.1.0 | Apache 2.0 | mire ArUco, extraction d'images (service) | 8 | prévue ; FFmpeg (LGPL) **À VÉRIFIER** |
| trimesh | 5.2.1 | MIT | export du maillage (service) | 8 | prévue |
| ezdxf | 1.4.5 | MIT | repli DXF côté service | — | option |
| WeasyPrint | 70.0 | BSD-3 | repli PDF | — | option |
| league/csv | 9.29.0 | MIT | repli CSV | — | option |
| Manifold | 3.5.5 | Apache 2.0 | repli booléens 3D | — | option |
| MapAnything (modèle « apache ») | 1.1.3 | Apache 2.0 | reconstruction par apprentissage, **seulement si GPU (D2)** | 8 | option |

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
| IfcOpenShell | LGPL-3.0 | LGPL | générateur maison ; outil de test = décision D5 |
| Dompdf, TCPDF | LGPL | LGPL | Gotenberg |
| mPDF | GPL-2.0 | GPL | Gotenberg |
| Sweet Home 3D | GPL | GPL, outil de bureau | — |
| FreeCAD | LGPL-2.1 | outil de bureau | — |
| DUSt3R, MASt3R | CC BY-NC-SA 4.0 | usage commercial interdit | MapAnything (modèle Apache) |
| 3D Gaussian Splatting (Inria) | non commercial | usage commercial interdit | gsplat, Brush (Apache 2.0) |
| VGGT | licence propre Meta | licence non standard | MapAnything (modèle Apache) |
| tldraw | propriétaire | clé payante en production | Konva |
| Clipper2 | Boost Software License 1.0 | hors liste, décision D4 | flatten-js |
| JSTS | EPL-1.0 / EDL-1.0 | hors liste, décision D4 | flatten-js |
| FPDF | permissive propre | hors liste, décision D4 | Gotenberg |

## À VÉRIFIER
- Licence réelle de chaque dépendance à la date d'installation (lecture du fichier LICENSE du dépôt officiel par verif-licences) et dépendances transitives de l'arbre npm et Composer.
- Options de compilation de COLMAP, licences de Chromium, LibreOffice, FFmpeg, Draco et Meshopt.
- Licence des poids des extracteurs éventuellement associés à LightGlue/hloc (non retenus).
