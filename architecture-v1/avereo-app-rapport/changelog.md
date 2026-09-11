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

## 2026-09-11

- Correction de la semantique de `Visite Globale` : le choix complementaire
  devient le type d'habitation (`Maison`, `Appartement`, `Immeuble collectif`
  ou `Autre habitation`).
- Positionnement de `Eau -> Air -> Terre -> Feu` comme ordre obligatoire des
  dimensions de l'analyse, commun a toutes les visites globales.
- Migration defensive des anciennes valeurs d'element vers `A preciser`, sans
  leur attribuer artificiellement un type de logement.
- Ajout conditionnel de la section `Ecoute client` pour `Visite Globale` :
  motif, attentes, preoccupations, usages et contexte d'occupation.
- Ajout des accords photo et dictee au payload existant ; commandes photo et
  micro desactivees tant que l'accord correspondant n'est pas enregistre.
- Reprise des donnees d'ecoute dans le brouillon, la sauvegarde JSON, l'apercu
  et l'export Word, sans schema MySQL supplementaire.
- Priorisation du prototype fonctionnel ; etude du TDD reportee a la phase
  d'industrialisation en vue de la commercialisation.
- Limitation des nouvelles creations aux categories
  `Expertise & Visite technique` et `Visite Globale`.
- Ajout des sous-categories techniques `Evaluation Energétique`, `Mesures`,
  `cartographie` et `pathologies`.
- Masquage reversible des modules `Assistance avant-projet`,
  `Diagnostic specifique` et `Reception de travaux`, sans suppression de leur
  definition ni de la compatibilite des anciens brouillons.
- Migration defensive des anciennes classifications techniques et Habitologie.
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
