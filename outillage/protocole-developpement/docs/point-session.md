---
project: protocole-developpement
document_type: session-handoff
title: Point de session — création du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-04
owner: jpdandin
tags: [developpement, reprise, cockpit]
---

# Point de session — reprise du 4 octobre 2026

Le [protocole](../skills/developpement-github-cockpit/references/protocole.md) et le [skill](../skills/developpement-github-cockpit/SKILL.md) sont créés et installés pour l'utilisateur. Le cycle présente quatre phases : Cadrage, Développement local, Préproduction et Mise en production. La règle commune et ses modèles sont actualisés à la demande du responsable. Les trois anciennes étapes sont conservées en instantané avec leur mapping ; aucun accord humain n’est renuméroté. Les contrôles et les accords humains sont distincts. La règle 23 des consignes globales demande l'utilisation du skill pour les lots de développement et leurs reprises.

Le [suivi canonique](pilotage/suivi-chantier.json) porte la revue de ce lot. Les preuves locales sont dans [verification.json](../data/verification.json). La phase locale attend sa revue humaine ; les suivantes restent non commencées. Aucun site, application ou agent n'a été déployé par cette création.

Le cockpit de revue fonctionne sur [la boucle locale](http://127.0.0.1:5194/), avec le moteur AVEREO existant et une source de suivi distincte. Le lanceur et le mapping sont décrits dans [le raccordement](../workflows/cockpit-local.md). L'installation du skill référence ce dossier : tout déplacement doit réaligner les liens utilisateur.

La [PR #75](https://github.com/jpdandin44/AVEREO/pull/75) porte désormais la règle à quatre phases, en brouillon. Elle est rattachée à la phase locale ; le merge historique de création #73 ne vaut pas validation de ce lot. La CI de cette nouvelle PR reste à observer.

## Prochaine reprise

Dans le dépôt du prochain développement, invoquer `$dev` ou commencer par `DEV :`, avec l'objectif et le périmètre. Le nom `$developpement-github-cockpit` reste disponible. L'appel court renvoie au même protocole et ne vaut pas accord de livraison. Réutiliser le suivi existant et qualifier les commandes, GitHub, environnements et accords avant les actions qui en dépendent.

La source est rattachée au dépôt `jpdandin44/AVEREO`, sous `outillage/protocole-developpement`,
par une PR distincte. Le suivi de la phase 1 porte son lien et sa dernière observation.
Les skills sont installés au niveau utilisateur pour être appelés dans les autres dépôts.

TBD — confirmer le cockpit commun définitif. Les protections GitHub et commandes de
livraison restent à qualifier projet par projet. La distribution par PR ne constitue
ni son merge, ni l'installation d'une CI ou d'une préproduction dans tous les dépôts.

## Bilan documentaire

Socle documentaire créé et sources identifiées. Le processus reste dans le skill ; les vues du cockpit sont dérivées du protocole et du suivi. Les vérifications portent sur ce socle, ses liens, ses métadonnées et le raccordement local. Elles ne constituent pas un audit documentaire de tous les projets.

## Rattachement GitHub et source locale

La [PR #73](https://github.com/jpdandin44/AVEREO/pull/73) de création est fusionnée le 3 octobre, constat relu le 4 octobre. La règle à quatre phases est préparée dans un nouveau lot ; aucune approbation n’est héritée du merge de création. Les deux skills installés pointent vers ce checkout AVEREO ; le cockpit utilise son suivi canonique. La copie locale initiale est conservée comme historique avec un renvoi vers cette source, car Windows a refusé son déplacement. Aucun accord humain de phase, de merge ou de production n’a été ajouté par l’agent.

Les quatorze tests locaux, le raccordement du cockpit et les contrôles documentaires ont réussi. Les workflows GitHub `CI` et `Developpement commun` ont réussi sur le SHA indiqué dans `verification.json` ; `PR Policy` est ignoré pour cette PR en brouillon. Les observations de GitHub sont datées : la révision observée peut précéder un commit documentaire ultérieur. Vérifier à nouveau la tête de PR avant une décision ou un passage d’environnement.
