---
project: avereo-app-rapport
document_type: prompt
title: Délégation de l’ordre des observations dans le lot 0
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, observations, delegation]
---

# Délégation de l’ordre des observations dans le lot 0

## Objectif

Aligner la numérotation des observations, les plans et les Word sur le protocole Eau → Air → Terre → Feu, puis À classer. L'utilisateur peut saisir le chauffage en premier ; la restitution doit tout de même suivre ce protocole. Une nouvelle demande fixe le libellé exact « Conseils habitologue » pour toutes les observations.

## Contexte et entrées

Travailler dans la copie déjà autorisée, branche `feat/rapport-lot0-observations`, issue du candidat `f48a3a9`. La PR #148 conserve son candidat et ses validations ; ne pas la modifier. Lire les AGENTS.md et ce contrat. Codex modifie App.jsx, DecisionSupportPanel.jsx, le libellé reportProfiles.js, ses tests et la documentation.

`frontend/src/observationOrder.js` est le contrat partagé, propriété Codex :

- `orderedObservations(report)` renvoie les objets d'origine ordonnés selon les phases pour Visite Globale, sans modifier l'entrée ; au sein d'une phase l'ordre du tableau JSON est conservé. Les observations sans phase reconnue restent à la fin ; les phases désactivées ne sont pas supprimées.
- `observationNumber(report, observation)` donne le numéro global à partir de l'objet d'origine.
- `moveObservation(report, sourceId, targetId)` déplace à la position du destinataire dans la même phase seulement ; conserve les objets, identifiants et données ; ne pas modifier ce module.

Les autres catégories gardent l'ordre du tableau. Aucun champ `numero` n'est ajouté au payload. Les numéros sont dérivés ; les références restent les identifiants stables.

## Instructions et fichiers autorisés

Modifier seulement les fichiers suivants et leurs tests existants :

- `frontend/src/reportHtml.js` : ordonner le Word expert et conserver une même numérotation des observations et de leurs références aux plans.
- `frontend/src/reportDelivery.js` : filtrer les observations client après le tri global, conserver leurs numéros globaux (ne pas les renuméroter à partir de 1 après sélection), aucune fuite d'un constat exclu. Présenter le numéro de chaque constat client même sans plan.
- `frontend/src/observationPlans.js` et `ObservationPlans.jsx` : liste et repères dans l'ordre commun, numéros identiques sur toutes les vues et aux exports. Ne pas déplacer ou réécrire les coordonnées.
- `frontend/src/ReportDeliveryOptions.jsx` : sélection client triée, avec numéro commun affiché ; sélection conservée par identifiant.
- tests de `reportDelivery`, `observationPlans` : cas Feu saisi avant Eau, plusieurs constats d'une phase déplacés, JSON aller-retour, sélection client avec trous, repères et photo/texte/coordonnées intacts. Les anciens tests de libellé doivent attendre « Conseils habitologue » ; la modification du helper et reportProfiles.test appartient à Codex.
- `docs/delegation-ordre-resultat.md` : compte rendu factuel en français avec front matter, résultats réels et limites.

## Contraintes et sources autorisées

Rester dans Rapport et dans les fichiers autorisés. Aucun commit, push, merge, déploiement, accès serveur, compte, secret ni nouvelle dépendance. Ne pas modifier App.jsx, DecisionSupportPanel.jsx, observationOrder.js ou ses tests, reportProfiles.js ou ses tests, styles, documents canoniques. Ne pas modifier les données d'un autre intervenant. Aucun tri implicite destructif des tableaux stockés à l'import. Les termes anciens dans les documents historiques doivent rester historiques.

## Format de sortie et tests

Modifications locales et compte rendu. Exécuter les tests ciblés ; signaler échecs et hypothèses. Build final et essais navigateur/Word par Codex. Ne pas attendre d'autorisation supplémentaire pour les fichiers locaux autorisés.

## Historique des versions

- 2026-11-12 : première délégation du complément demandé au lot 0.
