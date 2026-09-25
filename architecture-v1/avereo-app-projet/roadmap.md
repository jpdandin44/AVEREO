---
project: avereo-app-projet
document_type: roadmap
title: Feuille de route de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-24
owner: jpdandin
tags:
  - projet
  - roadmap
---

# Feuille de route de Projet

## Revue locale des phases — 24 septembre 2026

L'espace de revue est développé sur `feat/projet-revue-phases`, à partir de
`48ae277`. Il consulte le chantier existant et enregistre observations,
corrections, remises, approbations et accords de passage. Résultats :
[recette locale](docs/recette-revue-locale.md).

L'état de revue du chantier est celui de son journal actuel, sans redemander
les accords déjà enregistrés. L'évolution du 24 septembre ajoute la progression
par phase et la consultation des validations antérieures fournies par le
chantier. Les fiches de livrables prévus et la lecture automatique du suivi sont
également implémentées et testées localement, avec conservation des saisies
et invalidation ciblée des attestations. Les résultats et la limite de recette
navigateur sont dans le complément de recette cité ci-dessus.
Livrer l'outil ne crée aucune nouvelle approbation de livrable.
La PR de ce nouveau lot n'est pas publiée ; le planning précédent reste
une dépendance de branche dont l'état distant n'a pas été recontrôlé ici.
Voir [la procédure](workflows/revue-developpement.md) pour les accords de publication.


## Existant constaté

Le frontend historique propose dashboard, Gantt, tâches, lots, dépendances,
risques et import CSV/XLSX. Il est enveloppé par React/Vite et possède
des points d'entrée PHP pour le sas CONNECT hébergé.

## Lot implémenté localement

Dates/capacité configurables, charges décimales, validation avant remplacement,
mode séquentiel, brouillon versionné, export/reprise JSON et CSV, pilote local
généré depuis une source unique, tests et documentation.

Le lot sert à organiser les évolutions du pilote, sans les implémenter.
Les tests automatisés et la recette navigateur du pilote sont réalisés ;
l'évolution est proposée pour revue dans une PR brouillon dédiée. Les résultats sont dans
[docs/source-audit.md](docs/source-audit.md).

Le build du planning initial et la prévalidation de policy avec cases décochées sont réussis.
Le téléchargement JSON et l'import XLSX dans l'interface restent à qualifier
avant une validation complète des échanges de fichiers. Le cochage de la
checklist et le merge restent humains. Aucun déploiement n'est réalisé par ce lot.

## Extension fiches et risques — testée localement

Le moteur et l'interface disposent des descriptions, actions, critères,
checklists et risques détaillés. La reprise des anciens projets est compatible ;
l'enrichissement ajoute les fiches manquantes sans remettre à zéro le suivi.
Le document des étapes est généré depuis la même source structurée et consultable
localement. Les tests moteur des validations et de la matrice sont exécutés.

Les tests intégrés, le build et l'inspection de l'artefact de cette extension
sont réussis. Les parcours de fiche, preuve et qualification/reprise de risque
ont été vérifiés dans le navigateur local. Les preuves et les compléments de
recette encore ouverts sont consignés dans [l'audit](docs/source-audit.md).
L’extension de planning du 19 septembre relève de la
[PR #64](https://github.com/jpdandin44/AVEREO/pull/64), sans nouvelle publication
hébergée ni réalisation implicite des EV planifiées.

## Suite à arbitrer

Sauvegarde distante, collaboration, absences/jours fériés et nivellement
multiressource ne sont pas engagés. Une activation backend/MySQL exigerait un
nouveau périmètre. Les corrections du sas et de sa publication demeurent un
lot distinct ; les inscrire dans le planning ne prouve pas leur réalisation.
