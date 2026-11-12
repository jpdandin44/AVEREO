---
project: avereo-app-rapport
document_type: documentation
title: Compression locale des nouvelles photos — candidat isolé
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, photos, compression, word]
---

# Compression locale des nouvelles photos — candidat isolé

Branche `feat/rapport-photos-compression`, préparée initialement sur `f48a3a9` selon le [prompt de délégation](../prompts/delegation-compression-photos.md), puis empilée par Codex sur le complément lot 0 (PR #149). Le suivi canonique porte la tête et la base exactes présentées en revue.

## Statut : module testé, non activé

Le responsable a précisé que les photos **originales** doivent être conservées dans un espace privé du dossier en ligne, accessible avec CONNECT, avant d'en tirer une version recadrée et annotée pour le rapport ([cadrage](photos-originales-et-annotations.md)). Cette conservation n'existe pas encore. En conséquence :

- le parcours normal d'import est **inchangé** : `src` reste la data URL octet-identique du fichier choisi, sans compression ni message de gain ;
- seuls restent dans la branche `frontend/src/photoCompression.js` et ses 12 tests `node:test`, **non importés** par `App.jsx` ;
- la compression ne sera branchée qu'à la phase de développement local du lot « originaux », et seulement après confirmation serveur de l'original. Une optimisation ne doit jamais supprimer le seul exemplaire d'une photo.

## Ce que fait le module (réglage proposé pour revue)

| Règle | Valeur |
| --- | --- |
| Formats traités | JPEG, PNG, WebP. GIF, SVG et formats non décodables partout restent intacts. |
| Déclenchement | Fichier de plus de 1,5 Mio ; en dessous, ni décodage ni ré-encodage. |
| Dimension | 2400 px maximum sur le grand côté, sans déformation ni agrandissement. |
| Sortie | JPEG, qualité 0,88. |
| Retenue | Seulement si au moins 15 % plus léger ; sinon l'original est conservé octet pour octet. |
| Transparence | PNG/WebP peints sur fond blanc explicite. |
| Orientation | Celle que le navigateur affiche (EXIF) est appliquée à la version optimisée. |
| Identifiant, nom, horodatage | Comme l'import actuel : UUID, nom du fichier, heure d'import. |
| Erreurs | Image non décodable : original conservé et signalé ; fichier illisible : refusé seul ; le reste du lot est ajouté. |
| Ajout au dossier | `appendPhotos` n'ajoute qu'au constat visé du dernier état ; il rend le même objet si le constat n'existe plus. |

Le Word existant reconnaît déjà `data:image/jpeg` (`reportDocx.js`, inchangé). Une photo optimisée perd ses métadonnées EXIF (dont une éventuelle position) ; l'original privé les garderait.

## Essais du candidat initial

Ces résultats concernent le module et une intégration d'essai **retirée du parcours** ; ils ne décrivent aucune conservation d'original en ligne. Ils ne préjugent pas de la qualification du futur lot.

| Contrôle | Résultat |
| --- | --- |
| `node --test` (tout le frontend, module compris) | 135 réussis, 0 échec, avant puis après le retrait de l'intégration. |
| `vite build` | Réussi avec l'intégration d'essai (1626 modules), puis sans elle (`App.jsx` identique à la base). |
| Module dans Chrome, images synthétiques | JPEG 4000×3000 de 11,6 Mio → 2400×1800, 9,0 Mio gagnés ; PNG transparent → zone transparente à 255,255,255 ; EXIF 6 → 1800×2400 et repère à la bonne place ; petite image identique ; JPEG déjà léger gardé ; fichier corrompu isolé sans perdre le lot. |
| Intégration d'essai dans l'application construite | Import, état d'attente, bilan ; suppression du constat, changement d'étape et import JSON pendant le traitement sans photo injectée ; message d'erreur par fichier. |

Limites : images synthétiques de bruit, aucune vraie photo ; l'intégration d'essai a été retirée à la demande du responsable et n'est pas dans la branche. Ses principes sont à reprendre dans le futur lot : traitement porté par l'assistant plutôt que par l'étape (il survit à la navigation), invalidation lors d'un import JSON ou d'une sortie, ajout par mise à jour fonctionnelle de l'état et refus si le constat a disparu.

## Points à qualifier avant toute activation

Après intégration sur le lot 0, Codex a exécuté les **147 tests Node** (135 du lot 0 + 12 du module isolé) : tous réussis. Le diff de `App.jsx`, `styles.css` et `reportDocx.js` par rapport à cette base est vide ; l'application n'importe pas le module candidat. Les essais de navigateur ci-dessus restent ceux de la délégation initiale et ne sont pas réattribués à une conservation d'originaux en ligne.

- Vraies photos de téléphone : poids, netteté d'un détail à 2400 px / 0,88, validation des seuils par le responsable.
- HEIC/HEIF, mobile (mémoire, limites de canvas), lots de 20 photos ou plus.
- Word avec photos mélangées ; poids des dossiers et plafond JSON de 50 Mio.
- Conservation durable de l'original et ses refus : voir le [cadrage](photos-originales-et-annotations.md).

## Cadrage distinct : PDF natif

Aucun PDF n'est développé. Le frontend n'a aucun générateur de PDF de rapport : l'export est un Word natif (`reportDocx.js`) construit depuis le HTML de `buildReportHtml` (`reportDelivery.js`), et l'aperçu est ce HTML dans une iframe sandboxée.

Points d'intégration : le HTML unique déjà filtré expert/client ; les images en data URL, donc l'effet du choix « version rapport » sur le poids d'un PDF ; les plans annotés (`annotatedPlanImage`) et la signature rendus par canvas ; le futur circuit des PDF finaux vers Passeport Immo ([repérage](reperage-observations.md)).

Inconnues : moteur (impression du navigateur, bibliothèque cliente avec dépendance nouvelle, conversion serveur avec nouveau service) ; fidélité au Word relu (pagination, polices, tableaux, liens) ; poids et définition cible des photos ; accessibilité et archivage attendus ; stockage, propriétaire et validation de l'expert avant diffusion.

## Historique des versions

- 2026-11-12 : candidat de compression, essais et cadrage PDF natif.
- 2026-11-12 : intégration au parcours retirée ; module conservé isolé en attendant les originaux privés en ligne.
