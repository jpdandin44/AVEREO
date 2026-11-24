# ADR 0001 — Choix des moteurs open source d'AVEREO Vision

- **Statut : accepté par le responsable le 23/11/2026** (ADR et décisions D1, D2, D4, D5, D6 donnés en session ; le merge de la PR sur GitHub reste sa validation formelle). Tout changement de moteur passe par un nouvel ADR.
- Date : 23/11/2026 — Rédigé par Claude Code.
- Source des données : étude du 20/11/2026 (dépôts officiels clonés ce jour-là), reprise via `docs/etude-outils-resume.md` et la version complète de l'étude pour les versions et dates. Aucune nouvelle recherche web n'a été faite pour ce lot.
- Politique de licences (AGENTS.md) : MIT, BSD 2 ou 3 clauses, Apache 2.0 ; polices SIL OFL. Toute autre licence = décision du responsable.

## 1. Contexte
AVEREO Vision est une PWA (React + Vite) avec une API PHP + MySQL et un service de traitement séparé pour la reconstruction 3D. Elle reproduit les fonctions de Visuary (relevé, métré, plan 2D, maquette 3D, exports) sans LiDAR : capture par vidéo, photos et cotes saisies au mètre laser. Aucun produit open source existant ne couvre l'ensemble dans notre stack (étude du 20/11/2026) : on construit, sur des briques MIT, BSD ou Apache.

## 2. Décision (synthèse)
| Besoin | Moteur retenu | Licence | Statut |
|---|---|---|---|
| Capture vidéo et photos | API navigateur getUserMedia + MediaRecorder | norme W3C | retenu |
| Envoi reprenable | tus-js-client (+ serveur tus PHP, repli : envoi par morceaux maison) | MIT | retenu, essai au lot 3 |
| Hors ligne et PWA | Dexie + vite-plugin-pwa (Workbox) | Apache 2.0 ; MIT | retenu |
| Photogrammétrie (service) | COLMAP compilé sans GPU, sans LSD ni CGAL ; densification CPU OpenSfM (dépôt et chemin CPU à vérifier) ; maillage Open3D ; échelle OpenCV (ArUco) | BSD-3 ; BSD-2 ; MIT ; Apache 2.0 | retenu **sous réserve des décisions D2 et D6** et d'un essai de précision |
| Plan 2D | Konva + react-konva | MIT | retenu |
| Rendu 3D | three.js + React Three Fiber + drei | MIT | retenu |
| Géométrie et métrés | logique pure maison + flatten-js ; three-bvh-csg pour percer les murs | MIT | retenu |
| IFC | générateur IFC4 STEP maison | code AVEREO | **recommandé, décision D1** (alternative web-ifc, MPL-2.0) |
| DXF | @tarikjabiri/dxf (navigateur) ; repli ezdxf (service) | MIT | retenu |
| glTF / OBJ | exporteurs three.js + glTF-Transform ; glTF-Validator en test | MIT ; Apache 2.0 | retenu |
| PDF | Gotenberg (conteneur HTML → PDF) ; repli WeasyPrint | MIT ; BSD-3 | retenu **sous réserve de la décision D6** (programmes embarqués) |
| CSV | fputcsv natif PHP ; league/csv si besoin | PHP ; MIT | retenu |
| Service de traitement | Python 3, worker en conteneur dédié | — | retenu, mise en place après validation (AGENTS.md) |
| Polices | Inter ; JetBrains Mono (auto-hébergées) | SIL OFL | retenu |

## 3. Décisions à prendre par le responsable
| ID | Décision | Recommandation de Claude Code | Conséquence si accepté | Conséquence si refusé |
|---|---|---|---|---|
| D1 | IFC : accepter une dépendance **MPL-2.0** (web-ifc) ou écrire un générateur IFC4 STEP maison. | Générateur maison : modèle simple (site, bâtiment, niveaux, espaces, murs, dalles, portes, fenêtres), validé par un outil externe. Aucune licence à accepter. | Option B (web-ifc accepté) : moins de code à écrire ; copyleft limité aux fichiers MPL (toute modification de leurs fichiers doit être publiée). | Option A (générateur maison) : lot 6 plus long (tâche Codex à fort effort) ; validation de conformité nécessaire (D5). |
| D2 | Serveur OVH : **GPU ou CPU seul** pour la reconstruction. Caractéristiques du serveur : inconnues de Claude Code, à fournir. | Partir CPU seul. | GPU : reconstruction dense COLMAP (CUDA) et essai de MapAnything possibles, mais SiftGPU (usage non lucratif) est compilé dès que le GPU est activé : désactivation ciblée à vérifier. | CPU : densification par OpenSfM (CPU), qualité en intérieur peu texturé à mesurer. |
| D3 | Mise à l'échelle : **prise le 23/11/2026** — 2 cotes laser pour l'échelle + 1 cote de contrôle (écart > 2 cm = hors tolérance), mire ArUco en secours. | — | Exigences R17, R18, R21. | — |
| D4 | Accepter explicitement des licences permissives **hors liste** : BSL-1.0 (Clipper2), FPDF, EDL-1.0 (JSTS). | Refuser pour Clipper2, FPDF et JSTS (inutiles : flatten-js et Gotenberg couvrent les besoins). **Réserve** : COLMAP exige Boost, sous BSL-1.0 : voir D6. | Éviterait un peu de code ; non nécessaire. | Aucun impact. |
| D5 | **Nouvelle** : outil de validation des fichiers IFC pendant les tests, hors application livrée. IfcOpenShell est la référence mais sous LGPL-3.0. | Utiliser IfcOpenShell uniquement comme outil de test local, non distribué ni installé en production, **si tu l'acceptes** ; sinon valider avec un lecteur IFC ouvert à la main. | Test automatisé de conformité IFC. | Trouver un autre validateur de schéma disponible et autorisé ; l'ouverture manuelle dans un lecteur ne suffit pas à clore le lot 6 (R44). |
| D6 | **Nouvelle** (relecture adversariale Codex, à confirmer sur les sources amont) : dépendances système des moteurs retenus, hors liste MIT/BSD/Apache : Boost (BSL-1.0) et Eigen (MPL-2.0) requis par COLMAP ; FFmpeg (LGPL ou GPL selon la compilation) pour extraire les images de la vidéo ; Pango (LGPL) pour WeasyPrint ; LibreOffice (MPL-2.0 et autres licences) et Chromium dans l'image Gotenberg. | Instruire chacune avant son lot (Lot 4 pour Gotenberg, Lot 7 pour COLMAP et FFmpeg), avec l'inventaire des composants et licences réellement livrés ; étudier une image Gotenberg limitée à Chromium. Aucune adoption avant ta décision. | Les lots 4 et 7 peuvent démarrer. | Chercher des alternatives (pdfmake pour le PDF, autre extraction d'images) ; COLMAP ne se passe pas de Boost ni d'Eigen : la reconstruction vidéo serait alors à reconsidérer par un nouvel ADR. |
| — | **Mise en place du service de traitement sur le serveur OVH** (conteneur dédié) : à ne faire qu'après validation de cet ADR et accord explicite. | Faire un essai CPU sur ton poste ou un conteneur local d'abord (Lot 7). | — | — |

### Décisions du responsable (23/11/2026)
Le tableau ci-dessus donne les recommandations de Claude Code ; le responsable les a toutes acceptées en session.
- **D1** : générateur IFC4 STEP maison. Réexamen possible par nouvel ADR si le lot 6 est trop long.
- **D2** : CPU seul au départ ; D2 est rouvert si l'essai du lot 7 montre une qualité insuffisante.
- **D4** : Clipper2, FPDF et JSTS refusés.
- **D5** : IfcOpenShell accepté **comme outil de test seulement** (ni dans l'application, ni dans les conteneurs, ni en production).
- **D6** : règle acceptée : un programme exécuté côté serveur, non modifié, non redistribué et inscrit dans `docs/licences.md` peut être sous BSL-1.0, MPL-2.0 ou LGPL ; AGPL, GPL, non commercial et propriétaire restent exclus. Boost, Eigen, FFmpeg (build sans composants GPL, à vérifier au lot 7) et l'image Gotenberg non modifiée (audit au lot 4) sont acceptés sous cette règle ; Pango (repli WeasyPrint) n'est pas décidé. Ces lectures de licence ne sont pas un avis juridique.
- **Service de traitement** : essai en conteneur local autorisé ; mise en place sur le serveur OVH seulement après un accord séparé, une fois l'essai de précision fait et les caractéristiques du serveur fournies.
- L'inscription au cockpit s'appliquera après le merge de la PR, sur accord explicite.

## 4. Comparatifs par besoin
Lecture : « Android » et « iOS » désignent le navigateur du téléphone (Chrome Android ; Safari iOS) ; « service » = s'exécute dans le conteneur de traitement, pas sur le téléphone. « Dernière publication » = dernier tag stable observé le 20/11/2026. Les liens sont les dépôts ou pages officiels habituels de chaque projet ; **À VÉRIFIER** : leur exactitude est à contrôler par le sous-agent verif-licences au lot 1, avant d'inscrire la dépendance dans `docs/licences.md`.

### 4.1 Capture vidéo et photos
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| getUserMedia + MediaRecorder | norme W3C | norme (sans dépendance) | — | Chrome Android | Safari ≥ 14.5 | front | **Retenu.** Format produit (MP4 ou WebM) et caméra en PWA installée sur iOS : À VÉRIFIER | https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder |
| `<input type="file" capture>` | norme HTML | norme | — | oui | oui | front | **Retenu comme secours** (vidéo ou photo) | https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture |
| WebXR (hit-test, depth) | norme W3C | norme | — | partiel (Chrome + ARCore) | **non pris en charge** | front | Écarté pour la capture de base ; mode manuel obligatoire | https://www.w3.org/TR/webxr/ |
| RecordRTC | 5.6.2 | MIT | 09/03/2021 | oui | oui | front | Écarté : inactif, apporte peu face à MediaRecorder | https://github.com/muaz-khan/RecordRTC |
| react-webcam | 7.1.1 | MIT | 07/06/2023 | oui | oui | front (React) | Écarté : inactif, simple surcouche | https://github.com/mozmorris/react-webcam |

### 4.2 Envoi reprenable et hors ligne
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| tus-js-client | 4.3.1 (5.0.0-pre3 en cours) | MIT | 16/01/2025 | oui | oui | front | **Retenu** pour l'envoi reprenable | https://github.com/tus/tus-js-client |
| tus-php (serveur) | 2.4.0 | MIT | 17/02/2024 | — | — | PHP | **Retenu sous réserve** : aucune activité depuis oct. 2025 ; repli = envoi par morceaux maison (essai au lot 3) | https://github.com/ankitpokhrel/tus-php |
| Uppy | 6.0.8 | MIT | 18/11/2026 | oui | oui | front (React) | Option : interface d'envoi toute faite ; bundle à limiter | https://github.com/transloadit/uppy |
| Dexie.js | 4.4.7 | Apache 2.0 | 19/10/2026 | oui | oui (quota : À VÉRIFIER) | front | **Retenu** (stockage hors ligne IndexedDB) | https://github.com/dexie/Dexie.js |
| IndexedDB natif | norme W3C | norme | — | oui | oui | front | Alternative sans dépendance ; plus de code | https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API |
| vite-plugin-pwa | 2.0.0 | MIT | 03/10/2026 | oui | oui | front (Vite) | **Retenu** (manifeste, service worker) | https://github.com/vite-pwa/vite-plugin-pwa |
| Workbox | 7.4.1 | MIT | 04/05/2026 | oui | oui | front | **Retenu** (via vite-plugin-pwa) | https://github.com/GoogleChrome/workbox |

### 4.3 Photogrammétrie et mise à l'échelle (service de traitement)
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| COLMAP | 4.2.1 | BSD-3 ; **embarque LSD (AGPL-3.0, actif par défaut) et SiftGPU (non lucratif seulement)** | 29/09/2026 | service | service | service (CLI, pycolmap) | **Retenu**, compilé avec `LSD_ENABLED=OFF`, `CGAL_ENABLED=OFF`, sans GPU. Le support GPU s'active aussi par OpenGL, pas seulement par CUDA : désactiver les deux et vérifier à l'inspection de la compilation que SiftGPU n'est pas construit (options exactes à relever dans le CMake du tag retenu). L'image Docker officielle ne doit pas être utilisée sans vérifier ces options. Dépendances Boost (BSL-1.0) et Eigen (MPL-2.0) : décision D6. À VÉRIFIER | https://github.com/colmap/colmap |
| OpenSfM | 1.1 | BSD-2 | 14/08/2026 | service | service | service (Python/C++) | **Retenu sous réserve** : la documentation courante décrit une densification accélérée par GPU ; le chemin CPU et le contrat COLMAP → OpenSfM → Open3D (caméras, poses, distorsions) sont à démontrer au Lot 7 ; qualité en intérieur peu texturé : À VÉRIFIER. L'ancien dépôt mapillary/OpenSfM n'est plus développé | https://github.com/OpenSfM/OpenSfM (dépôt continuateur signalé par la relecture Codex ; à confirmer) |
| Open3D | 0.20.0 | MIT | 16/09/2026 | service | service | service (Python/C++) | **Retenu** (nettoyage, maillage Poisson ou TSDF, mesures) | https://github.com/isl-org/Open3D |
| OpenCV (ArUco) | 5.1.0 | Apache 2.0 | 05/11/2026 | service | service | service ; opencv.js possible | **Retenu** (mire ArUco en secours, extraction d'images) ; FFmpeg (LGPL) sous-jacent : À VÉRIFIER | https://github.com/opencv/opencv |
| MapAnything (modèle « apache ») | 1.1.3 | Apache 2.0 (code et modèle Apache) | 17/07/2026 | service | service | service (PyTorch) | **Option si GPU (D2)**, essai à faire ; précision ±2 cm non démontrée ; ne pas utiliser le modèle par défaut | https://github.com/facebookresearch/map-anything |
| GLOMAP | 1.2.0 | BSD-3 | 30/10/2025 | service | service | service | Écarté pour l'instant : faible activité ; intégration dans COLMAP : À VÉRIFIER | https://github.com/colmap/glomap |
| WebODM / ODM | 4.0.1 / 3.6.2 | **AGPL-3.0** | 14/11/2026 / 11/08/2026 | service | service | service | **Écarté (licence)** | https://github.com/OpenDroneMap/ODM |
| Meshroom / AliceVision | 2025.1.8 | **MPL-2.0** | 31/08/2026 | service | service | service | **Écarté (licence)** | https://github.com/alicevision/Meshroom |
| DUSt3R / MASt3R | — | **CC BY-NC-SA 4.0** | — | service | service | service | **Écarté (usage commercial interdit)** | https://github.com/naver/dust3r |

### 4.4 Plan 2D éditable
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| Konva + react-konva | 10.10.0 ; 19.3.2 | MIT | 19/11/2026 ; 14/10/2026 | oui (tactile) | oui (tactile) | front (React), canvas 2D | **Retenu.** Pas de notion de mur ni de cote : logique à écrire | https://github.com/konvajs/konva |
| Fabric.js | tag v740 | MIT | 18/05/2026 | oui | oui | front, sans liaison React officielle | Alternative : orienté dessin libre | https://github.com/fabricjs/fabric.js |
| Paper.js | 0.17.0 | MIT | 03/11/2026 | oui | oui | front, sans liaison React | Alternative : bonnes opérations booléennes sur tracés | https://github.com/paperjs/paper.js |
| PixiJS | 8.23.0 | MIT | 11/11/2026 | oui | oui | front, WebGL/WebGPU | Écarté : moteur de rendu sans outils d'édition | https://github.com/pixijs/pixijs |
| tldraw | 5.6.2 | **propriétaire** (clé de licence en production) | 20/11/2026 | oui | oui | front | **Écarté (licence)** | https://github.com/tldraw/tldraw |

### 4.5 Rendu 3D web
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| three.js | r187 | MIT | 30/10/2026 | oui (WebGL) | oui (WebGL) | front | **Retenu.** Pas de semver : figer la version | https://github.com/mrdoob/three.js |
| React Three Fiber | 9.8.2 | MIT | 14/10/2026 | oui | oui | front (React) | **Retenu** (v10 en alpha : ne pas l'adopter) | https://github.com/pmndrs/react-three-fiber |
| drei | 10.7.9 | MIT | 25/09/2026 | oui | oui | front (React) | **Retenu** (peu de mainteneurs actifs) | https://github.com/pmndrs/drei |
| Babylon.js | 9.37.1 | Apache 2.0 | 18/11/2026 | oui | oui | front ; liaison React : À VÉRIFIER | Alternative : plus complet, plus lourd | https://github.com/BabylonJS/Babylon.js |
| PlayCanvas Engine | 2.24.2 | MIT | 18/11/2026 | oui | oui | front ; liaison React : À VÉRIFIER | Alternative : orienté jeu et splats | https://github.com/playcanvas/engine |
| model-viewer | 4.4.0 | Apache 2.0 | 09/10/2026 | oui | oui | front (Web Component) | Option pour la page de partage client (lecture seule) | https://github.com/google/model-viewer |
| Spark | 2.4.0 | MIT | 19/10/2026 | oui | oui | front (three.js) | Option pour afficher des splats ; non utilisé avant le Lot 8 | https://github.com/sparkjsdev/spark |

Contrainte : rester en WebGL (WebGPU n'existe sur iOS qu'à partir d'iOS 26).

### 4.6 Géométrie et métrés
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| Logique pure maison (TypeScript) | — | code AVEREO | — | oui | oui | front | **Retenu** pour tous les calculs de métré, testés sur valeurs de référence (REF-1 à REF-3) | `frontend/src/domain/metres/` |
| flatten-js | 1.6.15 | MIT | 25/10/2026 | oui | oui | front, Node | **Retenu** pour les cas difficiles (polygones, intersections, distances) | https://github.com/alexbol99/flatten-js |
| three-bvh-csg | 0.0.18 | MIT | 17/02/2026 | oui | oui | front (three.js) | **Retenu** pour percer les ouvertures en 3D (version 0.0.x : figer) | https://github.com/gkjohnson/three-bvh-csg |
| Manifold | 3.5.5 | Apache 2.0 | 12/11/2026 | oui (WASM) | oui (WASM) | front et service | Repli robuste pour les booléens 3D | https://github.com/elalish/manifold |
| Turf.js | 7.4.0 | MIT | 03/08/2026 | oui | oui | front | **Écarté** : coordonnées géographiques, inadapté à un plan en mètres | https://github.com/Turfjs/turf |
| Clipper2 | 2.0.1 | **Boost Software License 1.0** (hors liste) | 20/12/2025 | via portage | via portage | front (portage) | **Écarté** sauf décision D4 | https://github.com/AngusJohnson/Clipper2 |
| JSTS | 2.12.1 | **EPL-1.0 / EDL-1.0** (hors liste) | 16/11/2024 | oui | oui | front | **Écarté** sauf décision D4 ; inactif | https://github.com/bjornharrtell/jsts |

### 4.7 IFC
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| Générateur IFC4 STEP maison | — | code AVEREO | — | oui | oui | front ou PHP | **Recommandé (D1)** : modèle simple, validation externe (D5) | norme IFC4 : https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/ |
| web-ifc | 0.80 selon l'étude (0.0.80 dans le manifeste lu par la relecture Codex : À VÉRIFIER) | **MPL-2.0** | 19/11/2026 | oui (WASM) | oui (WASM) | front | **Décision D1** : lit et écrit l'IFC ; copyleft par fichier | https://github.com/ThatOpen/engine_web-ifc |
| @thatopen/components | 3.6.0 | MIT, mais dépend de web-ifc (MPL-2.0) | 22/10/2026 | oui | oui | front | Écarté (licence effective MPL-2.0) | https://github.com/ThatOpen/engine_components |
| IFClite | 12.3.0 | **MPL-2.0** | 16/11/2026 | oui | oui | front (WASM) | Écarté (licence) | À VÉRIFIER (dépôt officiel) |
| IfcOpenShell | 0.9.0 | **LGPL-3.0** | 01/10/2026 | service | service | service (Python/C++) | Écarté comme dépendance ; **outil de test seulement, décision D5** | https://github.com/IfcOpenShell/IfcOpenShell |
| xeokit SDK | 2.6.114 | **AGPL-3.0** | 02/09/2026 | oui | oui | front | Écarté (licence) | https://github.com/xeokit/xeokit-sdk |

### 4.8 DXF
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| @tarikjabiri/dxf | 2.10.1 (3.0.0-alpha en cours) | MIT | 14/11/2026 | oui | oui | front, Node | **Retenu** (mono-mainteneur : risque noté) | https://github.com/tarikjabiri/dxf |
| ezdxf | 1.4.5 | MIT | 16/10/2026 | service | service | service (Python) | **Repli** : le plus complet (calques, cotes, blocs) | https://github.com/mozman/ezdxf |
| Maker.js | 0.9.17 | Apache 2.0 | 26/09/2016 | oui | oui | front, Node | Écarté : ancien | https://github.com/microsoft/maker.js |
| dxf-writer | 1.18.4 (npm, À VÉRIFIER) | MIT | nov. 2022 (inactif) | oui | oui | front | Écarté : inactif | https://github.com/ognjen-petrovic/js-dxf |

### 4.9 glTF et OBJ
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| three.js GLTFExporter / OBJExporter | r187 | MIT | 30/10/2026 | oui | oui | front | **Retenu** | https://github.com/mrdoob/three.js |
| glTF-Transform | 4.5.1 | MIT | 28/09/2026 | oui | oui | front, service | **Retenu** pour optimiser les fichiers partagés ; licences des encodeurs Draco et Meshopt : À VÉRIFIER avant usage | https://github.com/donmccurdy/glTF-Transform |
| trimesh | 5.2.1 | MIT | 12/11/2026 | service | service | service (Python) | **Retenu** pour exporter le maillage de la photogrammétrie | https://github.com/mikedh/trimesh |
| Assimp | 6.0.6 | BSD-3 | 09/11/2026 | service | service | service (C++) | Écarté : plus lourd à intégrer | https://github.com/assimp/assimp |
| glTF-Validator | 2.0.0-dev.3.10 (version de développement : fixer le tag exact au Lot 5) | Apache 2.0 | 22/10/2024 | — | — | tests | **Retenu en test** (R45) | https://github.com/KhronosGroup/glTF-Validator |

### 4.10 PDF
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| Gotenberg | 9.9.1 | MIT ; embarque Chromium et LibreOffice (programmes séparés) | 20/11/2026 | service | service | service (API HTTP appelée par PHP) | **Retenu.** Impact des licences de Chromium et LibreOffice : À VÉRIFIER avant le Lot 4 | https://github.com/gotenberg/gotenberg |
| WeasyPrint | 70.0 | BSD-3 | 08/09/2026 | service | service | service (Python) | **Repli** : pas de JavaScript dans la page ; dépend de Pango (LGPL) : décision D6 | https://github.com/Kozea/WeasyPrint |
| pdfmake | 0.3.14 | MIT | 08/11/2026 | oui | oui | front | Alternative : export hors ligne possible | https://github.com/bpampuch/pdfmake |
| @react-pdf/renderer | 4.9.0 | MIT | 27/08/2026 | oui | oui | front (React) | Alternative : rendu par composants React | https://github.com/diegomura/react-pdf |
| Puppeteer / Playwright | 25.18.1 / 1.65.1 | Apache 2.0 | 17/11/2026 / 13/11/2026 | service | service | service (Node) | Écarté : exige Node dans le conteneur ; Playwright utile pour les tests de bout en bout | https://github.com/puppeteer/puppeteer |
| Dompdf, TCPDF, mPDF | — | **LGPL-2.1, LGPL-3.0, GPL-2.0** | — | — | — | PHP | **Écartés (licence)** | — |
| FPDF | 1.9.0 | licence permissive propre, **hors liste** | 31/05/2026 | — | — | PHP | **Écarté** sauf décision D4 ; très bas niveau | http://www.fpdf.org |

### 4.11 CSV
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| `fputcsv` (PHP natif) | PHP | licence PHP | — | — | — | PHP | **Retenu** : aucune dépendance ; BOM UTF-8 et séparateur « ; » ajoutés à la main | https://www.php.net/manual/en/function.fputcsv.php |
| league/csv | 9.29.0 | MIT | 28/10/2026 | — | — | PHP | Repli : gère BOM UTF-8 et « ; » pour Excel | https://github.com/thephpleague/csv |
| PapaParse | 5.7.1 | MIT | 11/11/2026 | oui | oui | front | Option : export hors ligne côté navigateur | https://github.com/mholt/PapaParse |

### 4.12 Polices
| Moteur | Version | Licence | Dernière publication | Android | iOS | Compatibilité stack | Recommandation | Lien officiel |
|---|---|---|---|---|---|---|---|---|
| Inter | à relever au Lot 1 | SIL OFL 1.1 | À VÉRIFIER | oui | oui | front, PDF | **Retenu** (interface), auto-hébergée dans l'application (pas d'appel à un service de polices externe : confidentialité) | https://github.com/rsms/inter |
| JetBrains Mono | à relever au Lot 1 | SIL OFL 1.1 | À VÉRIFIER | oui | oui | front, PDF | **Retenu** (cotes et données techniques) | https://github.com/JetBrains/JetBrainsMono |
| Arial / Consolas | système | — | — | oui | oui | front | Replis imposés par la charte | — |

## 5. Service de traitement
- **Rôle** : reconstruction 3D à partir d'une vidéo, mise à l'échelle, export du maillage, et à terme conversions lourdes. L'API PHP dépose une tâche ; le service la traite et rend le statut et le résultat.
- **Langage** : **Python 3** (version à fixer au Lot 7). COLMAP (pycolmap), OpenCV, Open3D, ezdxf et trimesh ont tous une interface Python ; PHP et Node ne les couvrent pas.
- **Conteneur** : image dédiée, sur le serveur OVH, sans accès réseau sortant, avec un volume partagé en lecture pour les vidéos et en écriture pour les résultats. Un worker lit une table `traitements` de la base MySQL (pas de bus de messages à installer).
- **Ressources nécessaires — hypothèse de dimensionnement, aucune source ne publie de besoin chiffré pour une pièce** : CPU 8 cœurs, mémoire 16 Go, disque 50 Go de travail (hors stockage des vidéos), aucun GPU dans la base (D2). Avec un GPU : carte NVIDIA compatible CUDA ≥ 11 (exigence de COLMAP pour la stéréo dense) ; MapAnything réclame jusqu'à 140 Go de mémoire selon son dépôt pour 2 000 vues, besoin pour une pièce : À VÉRIFIER. **Constat du 24/11/2026 (`docs/serveur-ovh.md`) : le seul serveur OVH relevé est un VPS-1 (2 vCores, 4 Go, 40 Go, sans GPU), très en dessous de ces valeurs : il ne convient pas à la reconstruction. Le choix d'une offre (achat) reste soumis à l'accord du responsable, après l'essai local du Lot 7.**
- **Temps estimé par pièce** : **non estimable sans mesure**. Objectif de départ, à confirmer ou corriger par l'essai du Lot 7 : moins de 60 minutes par pièce sur CPU (objectif, pas une mesure).
- **Conditions sur le serveur OVH** (à valider) : Docker ou équivalent disponible ; ressources réservées au conteneur sans gêner les autres applications AVEREO ; stockage des vidéos et sauvegardes ; aucune donnée ne quitte le serveur. Mise en place seulement après validation de cet ADR et accord explicite du responsable (AGENTS.md).
- **Précision** : ±2 cm non garanti en mode vidéo ; il sera mesuré sur la pièce de référence (R22) avant d'être promis.

## 6. Conséquences
- Les licences de toutes les dépendances retenues sont MIT, BSD, Apache 2.0 ou SIL OFL ; hors dépendances système à instruire (D6), les exceptions possibles sont posées en décisions D1, D4, D5 et D6.
- Le calcul de métré reste de la logique pure sans dépendance de rendu, ce qui rend les exports cohérents (R48) et testables (R31).
- Le mode « cotes saisies au mètre laser » est le seul dont la tenue de ±2 cm est attendue ; elle reste à démontrer par R29 sur la pièce de référence : il structure les premiers lots ; la vidéo vient après les exports PDF et DXF.
- Le générateur IFC maison est du code à écrire et à valider (risque assumé de D1).

## 7. À VÉRIFIER
- Options de compilation réelles de l'image COLMAP ; faute de preuve, compiler soi-même.
- Dépôt actuel d'OpenSfM (l'ancien n'est plus développé).
- Format vidéo MediaRecorder iOS/Android, caméra en PWA sur iOS, quota hors ligne iOS.
- Licence des poids des extracteurs liés à LightGlue/hloc (non retenus ici).
- Programmes embarqués par Gotenberg (Chromium, LibreOffice), FFmpeg (extraction d'images de la vidéo), Boost et Eigen (COLMAP), Pango (WeasyPrint) : à instruire avant les Lots 4 et 7 (décision D6).
- Chemin CPU d'OpenSfM dans le tag retenu et dépôt de référence.
- Licences des encodeurs Draco et Meshopt de glTF-Transform.
- Licence du schéma IFC5 (hors périmètre : IFC4 retenu).
- Ressources, durée et précision de la reconstruction sur la pièce de référence.
- Exactitude des liens officiels de ce document.
