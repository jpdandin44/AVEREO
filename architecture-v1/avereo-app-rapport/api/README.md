---
project: avereo-app-rapport
document_type: api-index
title: API de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-02
owner: jpdandin
tags:
  - rapport
  - api
  - php
---

## Plans et repères

Les opérations de sauvegarde existantes transportent les champs optionnels `plans` et `observations[].reperes`. `observation-plans-validation.php` vérifie images, dimensions, listes et références et retourne une erreur `report_plans_invalid` (422) sans sauvegarde en cas d’invalidité. Les permissions et la propriété existantes restent inchangées. [Données, bornes et compatibilité](../docs/reperage-observations.md#données-de-référence).


# API de Rapport AVEREO

L'implementation PHP est publiee depuis `frontend/public/api/`. Les contrats
et controles existants sont decrits dans `docs/architecture.md`,
`docs/authentication.md` et `database/README.md`.

L'application n'ajoute pas de nouvel endpoint interne pour la synthese des
risques. Le frontend utilise l'API publique Georisques V1, documentee dans
[`georisques.md`](georisques.md). Cette integration ne requiert aucun secret.

La carte cadastrale directe IGN (WMTS/Leaflet) et ses limites sont decrites dans
[`cartographie.md`](cartographie.md). Aucun secret ni endpoint interne ajoute.

Les vues d'urbanisme, de relief et d'orientation sont decrites dans
[`contexte-du-bien.md`](contexte-du-bien.md).

Un contrat machine-readable propre a Rapport sera ajoute ici lorsqu'une
evolution d'API interne structurante le necessitera.
