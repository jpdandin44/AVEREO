# AGENTS.md — AVEREO Vision : relevé, métré et modélisation 2D/3D AVEREO

## Ce qu'est cette application
Application AVEREO de relevé de l'existant pour la rénovation : capture (vidéo, photos, saisie manuelle), plan 2D éditable, maquette 3D, métrés automatiques (surfaces, longueurs, hauteurs, volumes, ouvertures), photos et commentaires placés sur le plan, exports.
Elle reprend les fonctions de Visuary (visuary.com), mais c'est une réalisation indépendante, construite sur des moteurs open source.

## Utilisateurs
Le fondateur d'AVEREO et les conseillers AVEREO, lors de visites de logements chez des particuliers. Une ouverture aux artisans partenaires est prévue plus tard : garde des rôles d'utilisateur extensibles, sans les construire maintenant.
Les relevés se font sur le terrain au smartphone, souvent d'une main et devant le client. Les écrans de capture doivent donc aller à l'essentiel : grandes cibles tactiles, peu de saisie, enregistrement automatique.

## Plateformes
Application web responsive, installable (PWA).
- Sur smartphone Android et iOS, dans le navigateur : capture vidéo, photos, saisie des mesures sur le terrain.
- Sur PC : édition du plan, vue 3D, métrés, exports.
Ce partage vient de l'usage : le relevé se fait au téléphone, le dossier se produit au bureau. Toute fonction qui ne marche pas dans un navigateur mobile courant (accès caméra, capteurs, WebXR) est signalée « À VÉRIFIER », avec un mode de secours manuel.

## Charte graphique AVEREO (V2.0)
Le document complet est dans docs/charte/Charte_graphique_AVEREO_V2.0.pdf. Les règles à appliquer à l'interface et aux exports sont les suivantes.
- Jetons : brand-primary #002B45 (navigation, titres, boutons principaux) ; brand-accent #FF6600 (accent, progression, état actif, CTA secondaire) ; surface #FFFFFF ; surface-muted #EEF3F6 ; text-primary #263238 ; text-muted #64748B ; surface-corporate #345469 (grands aplats) ; gris minéral #D9D9D9 (zones neutres) ; radius 8 px. Déclare-les une seule fois, comme variables CSS ou thème, et utilise-les partout.
- Répartition indicative : 70 % blanc, brume ou gris ; 20 % bleu AVEREO ou ardoise ; 10 % orange.
- Polices : Inter pour l'interface (repli Arial, sans-serif système) ; JetBrains Mono pour les cotes et les données techniques (repli Consolas). Deux familles au plus par écran ou par document.
- Accessibilité : jamais de texte courant orange sur fond blanc ; un bouton orange porte un texte bleu nuit #002B45 ; une information critique (alerte, cote hors tolérance) ne repose jamais sur la seule couleur, elle a toujours un libellé ou une icône.
- Formes : pictogrammes simples et homogènes (filaires ou géométriques) ; ombres très légères, réservées aux cartes interactives ; un filet orange fin comme repère de séparation ou de progression ; aucun dégradé, halo ni effet décoratif.
- Logo : uniquement les fichiers fournis dans docs/charte/logos/. Logo horizontal, 220 px de large au minimum à l'écran, sur fond blanc ou très clair, entouré d'une marge d'au moins 10 % de sa hauteur. Ne le redessine pas, ne le recolore pas, n'en extrais pas le symbole. Si aucun fichier n'est fourni, mets un emplacement réservé et écris « À VÉRIFIER : fichier logo ».
- Dossier PDF exporté, selon le §6.1 de la charte : couverture (logo, type de document, titre, version, date) ; en-tête avec AVEREO à gauche, le type de document à droite et un filet orange fin ; pied de page avec titre court, version/date et pagination ; titres bleu nuit ; tableaux avec en-tête bleu nuit en texte blanc et lignes alternées blanc/brume ; encadrés bleu clair pour l'information, orange pâle pour une décision ou une alerte. Les QR codes éventuels sont noirs sur fond blanc.

## Propriété intellectuelle et licences
- Reproduis les fonctions de Visuary, jamais ses éléments : ni son nom, son logo, ses textes, ses icônes ou ses maquettes d'écran, ni aucun code ou fichier tiré de son application. AVEREO commercialise l'outil sous sa propre marque et sa propre charte.
- Licences acceptées pour toute dépendance de code : MIT, BSD (2 ou 3 clauses), Apache 2.0. Les polices de la charte sous SIL Open Font License sont aussi acceptées. Exception décidée le 23/11/2026 (ADR 0001, D6) : un programme exécuté côté serveur, non modifié, non redistribué et inscrit dans docs/licences.md peut être sous BSL-1.0, MPL-2.0 ou LGPL ; AGPL, GPL, licence non commerciale et licence propriétaire restent exclues. Si une dépendance a une autre licence (GPL, LGPL, AGPL, MPL, licence non commerciale, licence absente), arrête-toi et pose-moi la question : une licence copyleft peut obliger à publier le code d'AVEREO.
- Chaque dépendance ajoutée est inscrite dans docs/licences.md : nom, version, licence, usage.

## Stack et hébergement
- Front-end : React + Vite. API et stockage : PHP + MySQL. C'est la stack de l'application Rapport du même dépôt (architecture-v1/avereo-app-rapport/) : lis son AGENTS.md et reprends ses conventions de structure et de configuration.
- Les traitements lourds (reconstruction 3D à partir d'une vidéo) tournent dans un service de traitement séparé, en conteneur dédié sur le serveur OVH d'AVEREO. Tu ne connais pas les caractéristiques de ce serveur : indique les ressources nécessaires (CPU, GPU, mémoire, disque) et marque « À VÉRIFIER » leur adéquation. Ce service n'est mis en place qu'après ma validation de l'ADR.
- Moteurs open source retenus : voir docs/adr/. Tout changement de moteur passe par un nouvel ADR que je valide.
- Commandes (définies au lot 1), à lancer dans `frontend/` : installation `npm ci` ; tests `npm test` (lanceur natif de Node, `node --test`, aucun outil de test à installer) ; build `npm run build` ; lancement local `npm run dev` (Vite, http://localhost:5173 par défaut). Un seul test : `npm test -- tests/metres.test.mjs`. Prérequis : Node 20.19 ou plus, ou 22.12 ou plus.
- Revue locale (25/11/2026) : `local/vision-revue.ps1 up -Nom recette` (application de `main`, http://127.0.0.1:5250/revue/) et `local/vision-revue.ps1 up -Nom validation -Source <worktree de la PR>` (candidat de la PR, http://127.0.0.1:5251/revue/), comptes fictifs Conseiller A, Conseiller B, Fondateur F ; le lien de validation va dans la case « environnement de validation » de chaque PR. Voir `docs/revue-locale.md`.
- API et base (lot 2A), depuis `architecture-v1/avereo-app-vision/` (Docker Desktop requis) : `powershell -ExecutionPolicy Bypass -File .\local\vision-local.ps1 up` (puis `test`, `health`, `migrate`, `down`, `reset`) ; tests PHP sans base sur le poste : `php tests/api/run.php <filtre>`. Détails dans `docs/local-development.md` ; authentification dans `docs/authentication.md`.
- Langage et versions (lot 1) : JavaScript (modules ES) avec types JSDoc, comme l'application Rapport ; React 19, Vite 7, Konva et react-konva pour le plan 2D. La logique pure (métrés, géométrie, modèle) est dans `frontend/src/domain/`, sans React ni DOM, et testée dans `frontend/tests/`.
- La CI du dépôt (`.github/workflows/ci.yml`) ne contient pas encore AVEREO Vision : à ajouter par une PR séparée, avec l'accord du responsable.

## Exports attendus
- PDF : dossier unique (plan, métrés, photos, commentaires), mis en page selon la charte.
- DXF : plan 2D.
- IFC : maquette 3D du bâtiment.
- glTF et OBJ : maquette 3D pour visualisation et partage.
- CSV : métrés par pièce.

## Précision
Les longueurs calculées par l'application s'écartent de ±2 cm au plus des cotes d'une pièce de référence relevée au mètre laser. Tout mode de capture qui ne peut pas tenir cette tolérance est signalé comme tel dans l'interface et dans docs/exigences.md.

## Façon de travailler
- Ouvre et lis un fichier avant d'en parler ; ne tire aucune conclusion de son seul nom.
- Travaille par lots. Un lot correspond à une branche `vision/lot-N-<sujet>` et à une PR vers main. Je fais les merges ; tu n'en fais jamais.
- Chaque exigence a un identifiant R01, R02… et un « terminé quand ». La matrice docs/exigences.md donne pour chacune : statut, fichiers concernés, test associé.
- Les calculs de métré sont de la logique pure, séparée de l'interface, et couverte par des tests unitaires avec des valeurs de référence chiffrées. Exemple : pièce rectangulaire de 4,00 × 3,00 m et 2,50 m de hauteur → 12,00 m² au sol, 35,00 m² de murs bruts, 30,00 m³.
- Quand une information manque ou qu'un comportement de Visuary n'est pas documenté, écris « À VÉRIFIER : … » dans la PR et dans docs/exigences.md, puis choisis la solution la plus simple et réversible. N'invente ni format, ni précision, ni comportement.
- Avant de clore un lot : les tests et le build passent, tu as relu ton diff, et docs/exigences.md et docs/licences.md sont à jour.

## Actions qui exigent mon accord préalable
- Ajouter un service payant ou une API externe, ou envoyer des données hors de nos serveurs : les relevés montrent des logements de particuliers.
- Mettre en place le service de traitement sur le serveur OVH, ou toute nouvelle infrastructure.
- Changer un moteur, la stack ou un schéma de base de données déjà livré.
- Modifier un autre sous-projet du dépôt, ou supprimer un fichier hors de architecture-v1/avereo-app-vision/.
