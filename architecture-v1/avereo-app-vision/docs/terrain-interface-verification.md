---
project: avereo-app-vision
document_type: verification
title: Vérification locale de l’interface terrain T-11
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [vision, terrain, verification]
---

# Vérification locale de l’interface terrain T-11

## Candidat et périmètre

Branche `vision/lot-3a-terrain`, changements laissés dans l’arbre de travail conformément au brief. Référence initiale du brief : T-10 `b086aa1`. Aucun commit, push, PR, réglage GitHub, accès serveur, déploiement ou secret. Aucun changement de serveur, synchronisation, migration, dépendance ou autre sous-projet.

Suivi canonique : `data/suivi-vision.json`, entrée `terrainT11`. Les quatre phases restent **Cadrage → Développement local → Préproduction → Mise en production**. T-11 réalise le développement local ; aucune approbation ni passage de phase n’est créé. Les preuves et validations historiques des autres lots sont conservées.

## Choix d’interface et description des écrans

- Dans « Pièce sélectionnée », trois blocs Cotes laser : longueur, largeur, contrôle hauteur/diagonale. Sélection des repères, mètres saisis avec virgule ou point, millimètres entiers stockés. Les deux sommets de diagonale sont distincts. Chaque résultat indique plan, mesure, écart en mm, OK ou hors tolérance avec pictogramme et message de `evaluerCotesLaser`. Effacement individuel. Police de données existante.
- À gauche, « Photos et commentaires » : deux boutons distincts (caméra arrière demandée / choix de fichier), miniature, date, pièce ou niveau et état d’envoi avec icône. Un repère appareil photo ouvre un dialogue natif modal avec titre, image, fermeture Échap et retour du focus. « Commenter cette photo » conserve la photo sélectionnée après fermeture du dialogue.
- Un formulaire de commentaire accepte la dictée native du clavier, compte les caractères (plafond 500), choisit point/pièce/mur/photo. Les listes donnent accès au clavier aux mêmes objets que le plan. Le dialogue d’un commentaire propose modifier et supprimer. Les cibles absentes et commentaires dépassant un mur raccourci sont signalés.
- Sur le plan, repères appareil photo et bulle dessinés en géométrie simple, au-dessus des pièces. Cibles 48 × 48 px indépendantes du zoom. Les photos et commentaires de point sont déplaçables ; les autres commentaires suivent leur cible par `positionCommentaire`. Validation uniquement en fin de glissement.
- Le dialogue de suppression propose les trois choix du brief pour pièce, photo et sommet (deux murs voisins). Les chemins existants de suppression/insertion de sommet sont dans Plan2D (double-clic et double-toucher) ; ListeMurs ne possédait aucune suppression. Ils passent maintenant tous par les fonctions terrain. Un refus géométrique reste affiché.
- À faible largeur, les champs se réduisent, les boutons terrain occupent la largeur et la création rectangulaire garde quatre champs. Jetons existants, aucun dégradé ni texte orange sur blanc.

## Intégration et fichiers

`frontend/src/features/terrain/` : `logique.js`, `usePhotos.js`, `CotesLaser.jsx`, `CarteTerrain.jsx`, `Dialogue.jsx`. Intégration : `features/releve/EcranReleve.jsx`, `useReleve.js`, `features/plan2d/Plan2D.jsx` et `styles/base.css`. Tests : `frontend/tests/terrain-interface.test.mjs`.

Une seule écriture des objets à l’écran : `useReleve.validerNiveau`, historique et enregistrement automatique R03. Pour une photo : compression → empreinte → `sauverMedia` réussi → ajout au niveau. L’ajout asynchrone cible le niveau capturé et applique sa fonction sur l’état récent (les commentaires ajoutés pendant la compression sont préservés). Aucun appel d’écriture de `creerMedias` depuis l’écran. Lecture locale ou téléchargement authentifié, URL blob révoquées au démontage/renouvellement.

La suppression conserve d’abord une intention durable du fichier, y compris sans blob local, puis retire l’objet par `supprimerCible`. Annuler restaure l’objet et les commentaires de l’historique mais ne restaure pas le fichier : « Photo supprimée ». Les marques locales sont conservées dans le hook après acquittement de suppression ; les 404 distantes donnent aussi ce message. L’historique n’est pas persistant, conformément au contrat existant.

## Contrôles exécutés

- `npm.cmd test` : **299 tests réussis**, zéro échec, dont **15 nouveaux** tests terrain/interface sans DOM. Placement par défaut, ordre fichier/objet, refus de compression/empreinte/stockage, intention de suppression, cibles et plafond texte, suppression/détachement pièce/sommet/photo, insertion, glissement, conversions laser et seuil, actions réelles du réducteur useReleve et annuler/rétablir, préservation de l’état récent pendant un ajout tardif.
- `npm.cmd run build -- --configLoader runner` : réussi, application et service worker générés. Avertissement de taille des bundles > 500 kB ; pas d’ajout de dépendance pour le traiter.
- `git diff --check` : réussi. Relecture du diff et recherche des chemins de suppression/insertion. Contrôles de charte inclus dans la suite Node.
- Cohérence documentaire : JSON canonique lisible, métadonnées des documents touchés, liens locaux des documents créés/modifiés et restriction du diff à Vision contrôlés.
- PHP/MySQL : non exécutés ; pas de modification PHP. Claude Code les relancera comme prévu dans le brief. Les tests Node ne constituent pas une preuve de non-régression PHP/MySQL.

## À VÉRIFIER

L’inventaire CUA indique « The browser access host is unavailable », sans navigateur accessible. Aucune capture ni recette interactive n’est revendiquée : les descriptions ci-dessus proviennent du code. Rendu réel 375 px, absence de défilement horizontal, focus et clavier des dialogues, glissement tactile et prise/import par canvas restent à essayer. Les règles CSS et dimensions Konva sont inspectées, sans mesure des éléments rendus.

Sur **1 Android et 1 iPhone** : capture/import, compression réelle, persistance après rechargement, quota/éviction, coupure réseau puis envoi et lecture authentifiée depuis un autre navigateur. Une photo distante sans blob local n’est pas garantie hors ligne (limite T-10 conservée). Le scénario détaillé est dans [revue-locale.md](revue-locale.md#recette-t-11--interface-terrain).

## Bilan documentaire

Politique documentaire globale appliquée dans le périmètre Vision. README créé pour indexer les sources existantes faisant office d’architecture, requirements, roadmap et décisions, sans duplication. Répertoires prompts/workflows/api créés avec renvois aux sources réelles. Architecture, exigences R13/R17/R36/R37/R38, plan des lots, changelog et scénario de recette actualisés ; suivi JSON enrichi sans modifier les validations historiques. Licences contrôlées, aucune nouvelle dépendance.

Statut : **À jour dans le périmètre documentaire T-11** ; qualification fonctionnelle mobile incomplète et identifiée ci-dessus. Les états anciens d’autres lots ne sont pas une nouvelle vérification de leur environnement hébergé. Prochaine action : relecture du candidat local, recette interactive et contrôles PHP par Claude Code, puis essais physiques avec les autorisations propres à leur cible.
