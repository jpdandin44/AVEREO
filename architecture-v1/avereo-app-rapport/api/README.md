---
project: avereo-app-rapport
document_type: api-index
title: API de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-11-26
owner: jpdandin
tags:
  - rapport
  - api
  - php
---

## Accès au transfert Projet — 26 novembre

`GET auth.php?action=me` ajoute `user.reportCapabilities.projectTransfer`. `POST auth.php?action=authorize-project-transfer` contrôle session, origine et action export ordinaires puis relit l’accès Projet ; succès : `ok`, `provider`, `accountId`, refus : HTTP 403 `project_transfer_refused`. Aucun contenu de dossier n’est envoyé à cette route. [Contrat précis](interventions-projet.md#autorisation-du-téléchargement) et [compatibilité des nouvelles mesures](../docs/contexte-observations-export.md).

## Droit de création technique projeté — 24 novembre

La capacité user.reportCapabilities.technicalReport de auth/me consomme désormais report_technical_create dans la politique privée CONNECT. Champ absent = false, booléen strict ; aucune liste d’identifiants ni rôle administrateur ne le remplace. Les dossiers déjà enregistrés gardent leurs contrôles usuels, les nouvelles copies/conversions exigent la capacité. [Contrat et parcours administrateur](../../avereo-app-connect/docs/profils-et-droits.md#droit-de-création-rapport-technique--complément-du-24-novembre). Les références antérieures à la liste privée sont historiques.

## Rapport Technique — capacité et champs du 24 novembre

GET auth.php?action=me ajoute user.reportCapabilities.technicalReport, booléen calculé depuis les droits administrateur et technical_report_connect_user_ids privés. POST reports.php contrôle les créations techniques, copies et conversions ; catégorie absente ou inconnue suit la normalisation historique et ne contourne pas ce contrôle. Échec : HTTP 403, technical_report_refused, sans mutation. mission_technique (objet : objet/perimetre/limites) et observations[].mesures_techniques/references_techniques/verifications_techniques/limites_techniques sont facultatifs, chaînes de 50 000 octets maximum chacune. Type incorrect : HTTP 400. Aucun nouveau point d’entrée, tableau SQL ou octet de volume autorisé. [Compatibilité et règles d’accès](../docs/rapport-technique.md#contrat-de-la-première-tranche-locale).

## Interventions — champs facultatifs du 16 novembre

Le payload existant decision.actions accepte realisation (chaîne, au plus 32 000 octets) et inclure_client (booléen strict). Champs absents acceptés ; type incorrect, null explicite pour le choix client et texte excessif rejetés. Les limites existantes de 100 actions/références s’appliquent. Aucun endpoint, schéma ou contrôle d’autorisation supplémentaire. [Contrat métier et persistance](../docs/interventions-proposees.md#données-et-compatibilité).

## Attentes et notes — champs facultatifs du 16 novembre

Les routes de rapports existantes transportent notes_attentes et attentes[].provenance_ecoute dans decision. Le validateur PHP contrôle les types, les deux champs d’écoute autorisés et la borne textuelle existante, sans nouveau droit ni endpoint. [Contrat détaillé](../docs/attentes-ecoute-client.md#données-et-compatibilité).


## Plans et repères

Révision Terrain du 14 novembre : plans[].kind admet cadastre en plus de niveau/coupe ; métadonnées cadrage/localisation facultatives conservées. observations[].phase_habitologie peut valoir terrain ; Tn est un label dérivé, jamais une référence serveur. Frontend et validation PHP correspondante doivent être livrés ensemble. [Contrat de la révision](../docs/environnement-terrain.md#données-et-composants).

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

## Recherche des sauvegardes en ligne

La liste authentifiée GET /api/reports.php accepte q (texte facultatif, 190 caractères maximum) et limit (1 à 100, 50 par défaut). Le serveur cherche une sous-chaîne dans la référence, le titre ou l’adresse **après restriction au périmètre autorisé et avant la limite**. Les caractères % et _ sont littéraux. Les résultats sont triés par dernière modification décroissante, puis par identifiant en cas d’égalité. Seules les métadonnées sont renvoyées. Le chargement du dossier complet réutilise la lecture protégée par identifiant.

## Habilitations par organisation — candidat local

Le candidat sert la liste autorisée via GET `exports.php` (filtre facultatif `reference`). POST `exports.php` reçoit `id` et `purpose`, exige l’en-tête `X-Avereo-Export: 1` et renvoie le JSON en pièce jointe. [Portée et erreurs de refus](../../../docs/administration-acces-exports.md).
