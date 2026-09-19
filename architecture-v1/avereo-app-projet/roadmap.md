---
project: avereo-app-projet
document_type: roadmap
title: Feuille de route de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - roadmap
---

# Feuille de route de Projet

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

Le build final et la prévalidation de policy avec cases décochées sont réussis.
Le téléchargement JSON et l'import XLSX dans l'interface restent à qualifier
avant une validation complète des échanges de fichiers. Le cochage de la
checklist et le merge restent humains. Aucun déploiement n'est réalisé par ce lot.

## Suite à arbitrer

Sauvegarde distante, collaboration, absences/jours fériés et nivellement
multiressource ne sont pas engagés. Une activation backend/MySQL exigerait un
nouveau périmètre. Les corrections du sas et de sa publication demeurent un
lot distinct ; les inscrire dans le planning ne prouve pas leur réalisation.
