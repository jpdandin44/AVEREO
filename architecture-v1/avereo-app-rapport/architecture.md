---
project: avereo-app-rapport
document_type: architecture-index
title: Architecture de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - architecture
---

# Architecture de Rapport AVEREO

Rapport est une application autonome du monorepo AVEREO : frontend React/Vite,
API PHP, base MySQL dediee et acces heberge par le sas AVEREO CONNECT.

La description technique detaillee et les flux restent maintenus dans
[`docs/architecture.md`](docs/architecture.md). L'authentification est decrite
dans [`docs/authentication.md`](docs/authentication.md) et les donnees dans
[`database/README.md`](database/README.md).

La classification des nouveaux dossiers expose uniquement
`Expertise & Visite technique` et `Visite Globale`. Les categories
`Assistance avant-projet`, `Diagnostic specifique` et
`Reception de travaux` restent dans le catalogue du frontend avec le statut
masque. Elles demeurent chargeables pour assurer la compatibilite des dossiers
existants et pourront etre reactivees comme modules complementaires.

`Visite Globale` reutilise le meme assistant, la meme API et le meme stockage.
La valeur existante `categorie` conditionne l'affichage de la phase `Ecoute`
dans l'etape `Dossier`. Ses champs et consentements sont conserves dans l'objet
JSON `ecoute`, au sein du payload existant. Aucune nouvelle base, API, table ou
application n'est introduite.
Les anciennes classifications `Expertise & visite technique` et
`Rapport Habitologue` sont normalisees sans inventer un type d'habitation. Pour
`Visite Globale`, le champ technique historique `sous_categorie` conserve la
valeur du type d'habitation afin de preserver le schema existant. Les constantes
de workflow portent separement l'ordre d'analyse `Eau -> Air -> Terre -> Feu`.
Le payload conserve egalement `habitologie_protocoles` pour les points retenus,
`phase_habitologie` et `controle_habitologie` sur chaque observation, ainsi
qu'une synthese `risques` sourcee et horodatee issue de Georisques V1. Ces
ajouts restent compatibles avec les brouillons plus anciens grace a la fusion
des valeurs par defaut.
