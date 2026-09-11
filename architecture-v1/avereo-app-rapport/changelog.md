---
project: avereo-app-rapport
document_type: changelog
title: Evolutions significatives de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-11
owner: jpdandin
tags:
  - rapport
  - changelog
---

# Evolutions significatives de Rapport AVEREO

## A venir

- Limitation des nouvelles creations aux categories
  `Expertise & Visite technique` et `Visite Globale`.
- Ajout des sous-categories techniques `Evaluation Energétique`, `Mesures`,
  `cartographie`, `pathologies` et des elements `Eau`, `Air`, `Terre`, `Feu`.
- Masquage reversible des modules `Assistance avant-projet`,
  `Diagnostic specifique` et `Reception de travaux`, sans suppression de leur
  definition ni de la compatibilite des anciens brouillons.
- Migration defensive des anciennes classifications techniques et Habitologie,
  sans attribution arbitraire d'un element aux dossiers historiques.
- Formalisation du workflow Habitologie dans une proposition en etude separee
  de l'etat implemente.

## 2026-09-10

- Retablissement dans l'etape `Site` du bouton `Rapport des risques`, omis lors
  de la migration statique de juillet 2026.
- Construction et validation testees du lien vers le rapport PDF officiel
  Georisques a partir des seules coordonnees longitude/latitude.
- Remplacement du type de dossier `Reception de travaux` par
  `Rapport Habitologue` pour les nouvelles creations.
- Reutilisation du meme assistant, du brouillon, des photos, de la dictee, de
  la sauvegarde et de l'export.
- Conservation des anciens dossiers Reception et conversion des prototypes de
  brouillon Habitologie vers le nouveau type.
- Extension de la suite a douze tests unitaires executables avec `npm test`.
