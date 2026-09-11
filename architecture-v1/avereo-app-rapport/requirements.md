---
project: avereo-app-rapport
document_type: requirements
title: Exigences de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-11
owner: jpdandin
tags:
  - rapport
  - exigences
  - habitologie
---

# Exigences de Rapport AVEREO

## Exigences fonctionnelles durables

- Le moteur de rapport technique, ses brouillons, photos, dictee, signature et
  exports restent disponibles sans regression volontaire.
- Une nouvelle creation propose uniquement les categories
  `Expertise & Visite technique` et `Visite Globale`.
- `Expertise & Visite technique` propose uniquement `Evaluation Energétique`,
  `Mesures`, `cartographie` et `pathologies`.
- `Visite Globale` propose uniquement `Eau`, `Air`, `Terre` et `Feu`.
- `Assistance avant-projet`, `Diagnostic specifique` et
  `Reception de travaux` restent disponibles dans le code comme modules
  complementaires masques dans l'interface de creation.
- Tous les rapports utilisent le meme assistant : `Dossier`, `Site`,
  `Protocoles`, `Observations` et `Export`, avec des adaptations futures
  conditionnees par la categorie principale.
- Les brouillons historiques restent lisibles. Les anciennes denominations
  sont normalisees vers les categories actives et les sous-categories
  historiques sont conservees sans reclassement metier arbitraire.
- Un ancien dossier `Reception de travaux` reste lisible mais ce type n'est
  plus selectionnable pour un nouveau dossier.
- Un ancien brouillon du prototype Habitologie ou du type
  `Rapport Habitologue` est converti vers `Visite Globale` sans ouvrir un
  second moteur ni lui attribuer artificiellement un element.
- Apres une recherche d'adresse ayant fourni des coordonnees valides, l'etape
  `Site` propose l'ouverture du rapport officiel Georisques correspondant.
- Le lien Georisques reste disponible pour tous les types de rapport : il fait
  partie du socle commun de localisation et ne modifie pas le dossier.

## Exigences techniques et securite

- La classification repose sur les champs existants `categorie` et
  `sous_categorie`.
- Les secrets et donnees d'authentification restent hors du navigateur et du
  depot.
- En environnement heberge, AVEREO CONNECT reste le point d'acces unique.
- Les sources externes futures doivent afficher leur origine et leur date, et
  disposer d'une saisie manuelle de secours lorsque le parcours l'exige.
- Pendant la phase de prototype fonctionnel, les evolutions privilegient la
  validation du besoin et du parcours utilisateur. Le TDD et la strategie de
  tests automatisee complete sont reportes a la phase d'industrialisation en
  vue de la commercialisation ; les controles existants et les validations
  proportionnees au risque restent executes.
- Les coordonnees transmises au service Georisques sont validees et aucun nom,
  email, commentaire, photo ou autre contenu du dossier n'est inclus dans le
  lien externe.

## Limites du lot courant

Le lot courant simplifie le catalogue visible et sa normalisation. Les phases
`Ecoute`, `Observation/Analyse`, `Explication` et
`Pistes d'accompagnement` sont encore une proposition en etude, decrite dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).
La sauvegarde et l'export existants sont deja reutilises.
