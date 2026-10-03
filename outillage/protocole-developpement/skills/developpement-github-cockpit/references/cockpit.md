---
project: protocole-developpement
document_type: data-contract
title: Contrat de pilotage d'une itération
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Contrat de pilotage

## Source unique

Réutiliser le suivi du projet. Le bloc `developmentWorkflow` peut accueillir la [fiche d'itération](../assets/iteration.json) dans un `suivi-chantier.json` existant. Un cockpit déjà doté d'un schéma équivalent peut conserver ce schéma et fournir une projection conforme au contrôleur ; ne pas maintenir deux historiques manuels.

Le contrôleur accepte une fiche directe ou ce bloc. Il est en lecture seule et ne modifie ni les décisions, ni l'environnement. Un résultat favorable signifie **cohérence des preuves déclarées** ; il faut également vérifier leurs sources, leur fraîcheur et la cible réelle.

## Informations visibles

Les trois étapes affichent un état parmi en cours, à contrôler, à valider, validée ou bloquée. Montrer l'objectif, le responsable, la prochaine action et les blocages. Relier PR, version/candidat, preuves de tests et recette, accords humains, reçus, sauvegarde/restauration, retour arrière et backlog de la suite. Indiquer la dernière observation GitHub et la date des preuves ; ne pas afficher un pourcentage arbitraire d'avancement.

## Champs de la fiche

- `candidate` : `sourceSha` complet et `artifactSha256` ; l'empreinte doit provenir de l'artefact réel.
- `checks` : `kind` (`local`, `ci`, `documentation`, `preproduction`, `production`), `status`, `sourceSha`, `artifactSha256`, `target`, `evidence` et `observedAt`.
- `targets` : `preproduction` et `production` avec `id`, `ready`, `isolated`, `empty` ; renseigner d'après un contrôle réel.
- `approvals` : `scope` (`preproduction`, `review`, `production`), `status`, `sourceSha`, `artifactSha256`, `target`, `actor`, `source`, `evidence`, `recordedAt`. Référencer les accords humains existants ; ne pas fabriquer une approbation.
- `backups` : cible, identifiant, statut vérifié, `restoreStatus`, preuve et date. Une fiche n'est pas une archive ; rapprocher l'identifiant de la sauvegarde réellement testée.
- `rollback` : statut `tested`, cible de production, empreinte du candidat et preuve.
- `github` : repository, PR, SHA accepté, empreinte d'artefact accepté, revue humaine vérifiée, preuve et date d'observation. Un merge modifiant l'artefact remet en cause les preuves précédentes.
- `delivery` : statut `delivered`, cible, SHA/empreinte, reçu et date ; distinct du simple départ d'un workflow.
- `blockers` et `nextIteration` : blocages actuels et éléments de suite. Une liste vide de blocages doit résulter du contrôle, pas d'une suppression pour faire passer la commande.

L'identité déclarée et les dates ne rendent pas le fichier inviolable. Les sources originales et mécanismes de revue du cockpit restent nécessaires.

## Préconditions vérifiées

`preproduction` exige les contrôles local/CI/documentation du candidat, l'accord de préproduction, sa cible prête et isolée, et la récupération de son état existant. `production` ajoute la recette réelle, la revue et l'acceptation GitHub, l'accord exact de production, la sauvegarde restaurée et le retour arrière testé. `close` ajoute le reçu de livraison, les contrôles réels de production et le backlog de la suite.

Tout champ absent ou preuve d'une ancienne version est refusé. Le contrôleur ne mesure pas seul la fraîcheur de la sauvegarde : l'opérateur doit confirmer qu'elle correspond à l'état immédiatement antérieur à l'écriture, en tenant compte des données intervenues depuis.

## Raccordement au cockpit AVEREO

Le modèle à trois phases est compatible avec le moteur de revue local Projet déjà utilisé par le site. Le [raccordement de ce socle](../../../workflows/cockpit-local.md) permet de le consulter sans remplacer les suivis AVEREO. Les approbations de phase sont des décisions humaines ; avant une action distante, vérifier en plus les préconditions de la fiche.

Le skill oblige l'agent à actualiser le suivi ; il n'ajoute pas de boutons de déploiement ni de synchronisation GitHub à ce cockpit.

Dans le lot de ce socle, l'observation GitHub est conservée dans `developmentWorkflow.github`
avec l'URL, le dépôt, le numéro, l'état, le SHA observé et la date. Le générateur en dérive
`phases[0].pullRequest`, lu par le cockpit. Actualiser seulement la source de l'observation,
puis régénérer ; ne pas maintenir séparément les deux représentations. Les champs
d'acceptation humaine restent distincts et sont préservés.
