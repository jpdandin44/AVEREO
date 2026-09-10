---
project: avereo-app-rapport
document_type: architecture-index
title: Architecture de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-10
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

Le `Rapport Habitologue` reutilise le meme assistant, la meme API et le meme
stockage. Il est identifie par la valeur existante
`categorie = Rapport Habitologue`, utilisable ensuite pour conditionner le
workflow. Aucune nouvelle base, API, table ou application n'est introduite.
L'ancien type `Reception de travaux` est conserve en lecture pour les dossiers
existants mais n'est plus propose pour une nouvelle creation.
