---
project: avereo-app-rapport
document_type: documentation
title: Compression locale des nouvelles photos — candidat isolé
status: active
version: git
created: 2026-11-12
updated: 2026-11-13
owner: jpdandin
tags: [rapport, photos, compression, word]
---

## Reprise du 13 novembre — première tranche fonctionnelle des originaux

Le responsable a demandé de lancer le prochain lot. La branche a intégré `main` après PR149 ; le développement local de la conservation/réouverture privée est désormais engagé. `App.jsx` et les styles intègrent ce parcours, contrairement à l’état de clôture historique ci-dessous. **Le module de compression reste non importé et non activé** ; `photo.src`, JSON et Word ne sont pas optimisés dans cette première tranche. L’éditeur de recadrage/annotations reste à développer. [État actuel, recette et limites](photos-originales-et-annotations.md). Les chiffres 135 et 147 ci-dessous concernent les candidats historiques, pas les nouveaux tests client.


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
| `node --test` (tout le frontend, module compris), sur la base `f48a3a9` | 135 réussis, 0 échec (123 existants + 12 du module), avant puis après le retrait de l'intégration. Ce total est distinct des 135 tests du lot 0 ; le total sur la branche empilée est donné plus bas (147). |
| `vite build` | Réussi avec l'intégration d'essai (1626 modules), puis sans elle (`App.jsx` identique à la base). |
| Module dans Chrome, images synthétiques | JPEG 4000×3000 de 11,6 Mio → 2400×1800, 9,0 Mio gagnés ; PNG transparent → zone transparente à 255,255,255 ; EXIF 6 → 1800×2400 et repère à la bonne place ; petite image identique ; JPEG déjà léger gardé ; fichier corrompu isolé sans perdre le lot. |
| Intégration d'essai dans l'application construite | Import, état d'attente, bilan ; suppression du constat, changement d'étape et import JSON pendant le traitement sans photo injectée ; message d'erreur par fichier. |

Limites : images synthétiques de bruit, aucune vraie photo ; l'intégration d'essai a été retirée à la demande du responsable et n'est pas dans la branche. Ses principes sont à reprendre dans le futur lot : traitement porté par l'assistant plutôt que par l'étape (il survit à la navigation), invalidation lors d'un import JSON ou d'une sortie, ajout par mise à jour fonctionnelle de l'état et refus si le constat a disparu.

## Relecture complémentaire de Claude Code reprise par Codex

Le 13 novembre, le responsable demande à Codex de reprendre ses derniers échanges dans la session Claude Code **Compression photos rapport**. Les demandes visibles sont la relecture du diff complet et le bilan final, puis la correction de la ligne des 135 tests et sa transmission à l'orchestrateur. Claude indique ne pas pouvoir contacter la session Codex ; son message est récupéré directement dans l'interface par Codex et rapproché du fichier courant.

La correction de comptage est conservée : **135 = 123 tests de la base `f48a3a9` + 12 du module photo**, tandis que **147 = 135 tests du lot 0 + 12 du module photo** sur la branche empilée `be7c38b`. Claude annonce la réussite de ces 147 tests et de `vite build` lors de sa relecture ; ces exécutions restent attribuées à Claude, distinctes de la qualification précédente par Codex. Aucun test ou build supplémentaire n'est relancé pour la seule reprise des messages.

Vérification de réception par Codex : correction présente dans ce document ; aucun import du module depuis le parcours applicatif ; diff nul des fichiers `App.jsx`, `styles.css` et `reportDocx.js` contre la base lot 0. La précision Word est également confirmée dans le code : 570 px limite la taille d'affichage, sans diminuer les octets JPEG/PNG/GIF incorporés ; WebP est converti en PNG à définition native. Les modifications de clôture et cette réception restent locales, non publiées dans le candidat présenté.

Les essais sur vraies photos, HEIC/HEIF, appareils mobiles, lots volumineux, choix de quotas et politique des originaux restent ouverts. Le PDF natif est seulement cadré. La reprise de ces messages n'active aucune compression et ne lance pas le stockage ou l'éditeur.

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

## Clôture du lot photo (journée du 12 novembre, consignée le 13)

Compte rendu de clôture de la session Claude Code **Compression photos rapport**, à la demande du responsable.

- **Branche et tête :** `feat/rapport-photos-compression`, HEAD `be7c38b`, base initiale `f48a3a9`, empilée sur le lot 0.
- **Préparé :** module `photoCompression.js` et ses 12 tests, **isolé et non activé** ; import de photos inchangé (`src` octet-identique) ; cadrage [photos originales et annotations](photos-originales-et-annotations.md) en quatre phases ; documents alignés ; PDF natif seulement cadré.
- **Vérifié par Claude :** 147 tests Node et `vite build` réussis lors de la relecture de `be7c38b` ; essais navigateur sur images synthétiques, ceux du candidat initial uniquement.
- **Publication vérifiée par Codex le 13 novembre :** `be7c38b` est déjà poussé dans la [PR150 en brouillon](https://github.com/jpdandin44/AVEREO/pull/150), dont la tête distante est `be7c38b67a6004069ec003affc65dfdea829c7f3`. Les modifications documentaires postérieures, dont cette clôture, la correction du total 135 et l'actualisation faite par Codex, ne sont ni commitées ni poussées. La formulation initiale de clôture de Claude ne disposait pas de cette vérification distante. Aucune nouvelle publication, fusion, livraison ou opération serveur n'est exécutée pour la clôture.
- **Limites restantes :** vraies photos de téléphone, HEIC/HEIF, mobile, lots volumineux ; décisions du cadrage (paramétrage du stockage privé, quotas, suppression, accès administrateur, formes des opérations de recadrage) ; aucune API photo, table photo, interface d'annotation ni conservation privée des originaux n'est implémentée par ce lot.
- **À la reprise :** attendre une demande explicite du responsable pour le lot fonctionnel « originaux privés », à traiter après le lot 0 ; la compression ne s'y activera qu'après confirmation serveur de l'original.

## Historique des versions

- 2026-11-12 : candidat de compression, essais et cadrage PDF natif.
- 2026-11-12 : intégration au parcours retirée ; module conservé isolé en attendant les originaux privés en ligne.
- 2026-11-13 : clôture du lot photo de la journée du 12 novembre.
