---
project: avereo-platform
document_type: qualification
title: Tester les options des ordres Word dans Projet et Coupe
status: active
version: git
created: 2026-11-07
updated: 2026-11-08
owner: jpdandin
tags: [missions, options, word, projet, coupe, preproduction]
---

# Tester les options des ordres Word dans Projet et Coupe

Une option cochée doit ajouter son intitulé, sa consigne et sa ligne « À consigner » à la fin de l’ordre Word. Une case décochée doit retirer ces trois éléments du prochain fichier. Si aucune case n’est cochée, le document se termine après les étapes obligatoires.

Les résultats ci-dessous portent sur la version de la PR #127, avant la demande de retrait de Missions dans Coupe. Pour le candidat suivant, ce parcours reste applicable à Projet. La vérification attendue dans Coupe est désormais l’absence du générateur et la disponibilité du dessin, de « Mes projets » et des préférences. [Nouveau périmètre](protocole-missions.md#applications-qui-génèrent-des-missions).

## Vérification dans Chrome du 8 novembre 2026

Les quatre offres ont été vérifiées dans Projet et Coupe sur les deux journées. Chaque offre a produit un ordre sans option, un ordre avec la sélection A puis un ordre où les cases de A ont été décochées et remplacées par celles de B. Dans les deux applications, le changement d’offre a retiré la sélection précédente. Après fermeture de 360 Premium avec deux cases cochées, le formulaire rouvert a également produit un ordre sans rubrique facultative.

| Cadre intégré | Word téléchargés le 8 novembre | Pages ouvertes et rendues dans Word | Offres et sélections vérifiées |
| --- | ---: | ---: | --- |
| Projet | 13 | 27 | Les quatre offres en SANS, A et B, puis 360 Premium après réouverture. |
| Coupe | 10 | 21 | Énergie & Travaux, Prévention Bâti et 360 Premium en SANS, A et B, puis 360 Premium après réouverture. Habitat & Confort avait déjà passé SANS, A et B dans Coupe le 7 novembre. |

Chaque rubrique a été comparée au catalogue jusqu’à la fin du Word et du rendu PDF. Les tâches obligatoires, les coordonnées du client fictif, les deux adresses et la référence de mission concordent. Par exemple, pour 360 Premium, la sélection B ne comporte que **Relecture de devis** et **Accompagnement technique ponctuel**, même si le drone et la thermographie restent cités dans les étapes obligatoires. La sélection A de cette offre occupe trois pages dans les deux applications. L’analyse documentaire, sa consigne et sa trace figurent ensemble sur la troisième page.

Les 23 fichiers du 8 et les cinq du 7 couvrent **26 cas distincts**. Les essais Énergie & Travaux SANS et A de Coupe ont été repris pour vérifier le passage à B avec le même formulaire. Les téléchargements se sont effectués dans le cadre de l’application, avec un client fictif par application pour la session du 8. [Résultats et empreintes par fichier](../data/recette-missions/options-ordres-chrome.json).

## Parcours à reproduire dans chaque application

1. Depuis CONNECT en préproduction avec un compte autorisé, ouvrir l’application et rester dans son cadre intégré. Si l’onglet était ouvert avant la livraison de la PR #127, l’actualiser. [Projet](https://projet-preprod.avereo.fr/) · [Coupe](https://coupe-preprod.avereo.fr/).
2. Ouvrir **Mon espace → Missions** puis choisir **Offre AVEREO**. Utiliser un client fictif, une référence de dossier et une référence de mission. Saisir deux adresses distinctes, l’une pour le client et l’autre pour le lieu d’intervention, ainsi qu’un téléphone et un e-mail fictifs. Laisser le formulaire ouvert entre les essais d’une même offre.
3. Déplier **Étapes de l’ordre de mission**. Sous **Options de cet ordre prévues au devis**, vérifier que toutes les cases sont vides. Garder le même client et changer seulement le suffixe de la référence de mission à chaque génération, par exemple `TEST-PROJET-HAB-SANS`, `TEST-PROJET-HAB-A`, puis `TEST-PROJET-HAB-B`. Utiliser **Générer l’ordre Word** pour chaque fichier. Le modèle privé sert à la lettre de mission. Le bouton **Reporter au dossier** est inutile pour cet essai.
4. Pour **SANS**, laisser toutes les cases vides. Pour **A**, cocher exactement la sélection A du tableau. Pour **B**, décocher toutes les cases de A et cocher exactement celles de B. Ouvrir les fichiers `ordre-<référence>.docx` depuis les téléchargements de Chrome et vérifier que chaque fichier porte sa propre référence.
5. Dans chaque Word, relire **Coordonnées du client**, **Intervention** et **Étapes de la prestation**. Vérifier le nombre et l’ordre des étapes. Pour **SANS**, vérifier l’absence du titre **Options retenues pour cet ordre**. Pour **A** et **B**, comparer toute cette rubrique à la sélection attendue, y compris les consignes et les traces. Une option décochée doit avoir disparu du nouveau document.
6. Avec des cases encore cochées, passer à l’offre suivante. Constater que toutes ses cases sont vides et générer **SANS** avant de les modifier. À la fin, laisser une option cochée, sélectionner **Fermer**, rouvrir **Mon espace → Missions**, reprendre la même offre et émettre un dernier ordre sans option. Répéter le parcours depuis la seconde application.

## Sélections à comparer

Les sélections A et B sont complémentaires. Ensemble elles exercent chaque option de chaque prestation. Dans le Word, comparer la rubrique facultative et ses phrases complètes. Par exemple, le drone et la thermographie font déjà partie du déroulé de base de 360 Premium. Un mot retrouvé dans une étape obligatoire ne prouve pas qu’une option a été ajoutée. Les consignes et traces de référence sont dans le [catalogue des quatre prestations](../data/modeles-lettres-mission.json).

| Prestation | Étapes obligatoires | A — cases à cocher | B — cases à cocher après avoir décoché A |
| --- | ---: | --- | --- |
| Habitat & Confort | 5 | Thermographie intérieure · Accompagnement technique ponctuel | Analyse documentaire complémentaire |
| Énergie & Travaux | 6 | Relecture de devis · Analyse documentaire complémentaire | Thermographie intérieure · Accompagnement technique ponctuel |
| Prévention Bâti | 6 | Inspection visuelle par drone · Analyse documentaire complémentaire | Thermographie · Accompagnement technique ponctuel |
| 360 Premium | 7 | Fissures et contexte RGA · Analyse documentaire complémentaire | Relecture de devis · Accompagnement technique ponctuel |

Si une case décochée persiste ou si une option cochée manque, relever l’application, l’offre, la référence de mission et le nom du fichier. Conserver le Word de l’essai avec données fictives et la sélection exacte à reproduire.

## Résultats du 7 novembre 2026

| Vérification | Résultat |
| --- | --- |
| Coupe, téléchargements depuis le cadre dans Chrome connecté | Habitat & Confort **SANS, A, B** et Énergie & Travaux **SANS, A**. Les cinq fichiers ont été ouverts dans Microsoft Word. Les dix pages rendues contiennent les coordonnées fictives, les étapes obligatoires et exactement les options prévues, consignes et traces comprises. Le passage d’Habitat B à Énergie SANS a également retiré l’analyse documentaire, commune aux deux offres. |
| Projet et Coupe, contrôle des générateurs servis en préproduction | Les deux ressources HTTPS correspondent octet pour octet à la PR #127 installée. Chaque ressource a été exécutée séparément sur un formulaire simulé. Les 56 sélections possibles par application (8, 16, 16 et 16) ont produit 112 Word comparés au catalogue. Deux Word supplémentaires confirment le retour à zéro après fermeture et réouverture. |
| Parcours dans Chrome restant à observer | Les quatre offres avec options dans le cadre de Projet. Dans Coupe, Énergie & Travaux **B**, les essais avec options de Prévention Bâti et 360 Premium et la réouverture du formulaire. Le pilotage de Chrome s’est arrêté lorsque l’adresse de la fenêtre n’était plus identifiable avec certitude. |

Les huit ordres de la recette initiale de la PR #127 couvraient les prestations de base dans les deux cadres. Les contrôles ci-dessus portent sur les options. La version testée est celle de la PR #127 déjà installée. La PR #128 rassemble la documentation. [Reçu des options et empreintes des cinq Word](../data/recette-missions/options-ordres-preproduction.json) · [Recette initiale des ordres](preparation-missions.md#ordres-détaillés-de-la-pr-127-en-préproduction).
