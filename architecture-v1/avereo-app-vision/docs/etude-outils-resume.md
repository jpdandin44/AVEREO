# Étude des outils open source — résumé pour le développement

Source : étude du 20/11/2026 (Doc « AVEREO Vision — Étude de marché des outils open source », https://claude.ai/artifact/PsxdYjGuVTKbSPu2qm2vF5), dépôts officiels vérifiés ce jour-là. Lire ce résumé plutôt que l'étude complète ; ouvrir l'étude seulement pour un détail précis.

## Forker ou construire
Construire. Aucun produit open source ne couvre relevé vidéo + métré + plan + 3D + six exports dans notre stack.
- house-planner (MIT) : même stack (React + Vite + Konva + R3F + PHP), mais v0.1.0 et un seul auteur. Inspiration ; extraits réutilisables avec mention du copyright dans docs/licences.md.
- Pascal Editor (MIT) : Next.js + WebGPU, IFC via web-ifc (MPL). openPlan3D (MIT) : SvelteKit + Firebase (exclu : données hors de nos serveurs).

## Recommandations par besoin
- Capture : getUserMedia + MediaRecorder (iOS Safari ≥ 14.5) ; Uppy / tus-js-client (MIT) pour l'envoi reprenable ; Dexie (Apache) + vite-plugin-pwa (MIT) pour le hors ligne. WebXR absent sur iOS : mode manuel obligatoire.
- Photogrammétrie : COLMAP (BSD-3) compilé sans GPU, LSD_ENABLED=OFF, CGAL_ENABLED=OFF ; échelle par 2 cotes laser + 1 cote de contrôle (décision du 23/11/2026), mire ArUco (OpenCV, Apache) en secours ; densification/maillage OpenSfM (BSD-2) ou Open3D (MIT) ; MapAnything (modèle Apache) à tester si GPU.
- Plan 2D : Konva + react-konva (MIT).
- 3D : three.js + React Three Fiber + drei (MIT) ; Spark (MIT) pour les splats.
- Géométrie et métrés : logique pure maison + flatten-js (MIT) ; three-bvh-csg (MIT) ou Manifold (Apache) pour les ouvertures. Pas Turf.js (coordonnées géographiques).
- IFC : aucun candidat sous licence acceptée → générateur IFC4 STEP maison, ou exception pour web-ifc (MPL-2.0) : décision D1.
- DXF : @tarikjabiri/dxf (MIT) ; ezdxf (MIT, Python) côté service.
- glTF/OBJ : exporteurs three.js + glTF-Transform (MIT).
- PDF : Gotenberg (MIT, conteneur HTML→PDF) ; à défaut pdfmake (MIT). Dompdf/TCPDF (LGPL) et mPDF (GPL) hors politique.
- CSV : fputcsv natif PHP ou league/csv (MIT).

## Pièges de licence
COLMAP embarque LSD (AGPL-3.0, actif par défaut) et SiftGPU (non lucratif, compilé dès que le GPU est activé). tldraw est propriétaire. DUSt3R/MASt3R et 3D Gaussian Splatting d'Inria : non commercial. VGGT : licence propre à Meta.

## Sans LiDAR
Pas d'échelle dans une vidéo (référence obligatoire), pas de reconnaissance automatique des murs et portes, pas de mesure AR sur iPhone. En échange : Android et tous les iPhone, exports DXF/IFC, données sur les serveurs AVEREO. Le mode « cotes saisies au mètre laser » est le seul qui tient ±2 cm de façon certaine à ce stade.
