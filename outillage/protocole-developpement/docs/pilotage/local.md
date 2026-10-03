---
project: protocole-developpement
document_type: generated-cockpit-document
title: Protocole et preuves locales
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [cockpit, derive]
---

# Revue locale du protocole

Document dérivé automatiquement de la source du skill. Les accords et livraisons réels restent distincts.

## Contrôles de ce lot

- Douze tests du contrôleur réussis sur données fictives : preuves, versions, accords, restauration et retour arrière.
- Validation structurelle du skill réussie à la source et via son installation utilisateur.
- Le modèle d’itération vide est refusé pour un passage en production.
- Compatibilité du moteur de cockpit vérifiée : trois phases, dépendances et décision fictive dans une copie temporaire ; aucune décision ajoutée au suivi réel.
- L’API du cockpit local répond sur 127.0.0.1:5194 avec la source de ce lot et aucun défaut de suivi signalé.
- Interface observée dans le navigateur : trois étapes visibles, revue locale en attente, bouton d’approbation conditionné aux critères humains.
- Les deux installations utilisateur pointent vers la même source ; la règle globale référence le skill.
- Appel court DEV : / $dev installé et validé ; une seule source du protocole, sans nouvelle permission de livraison.
- Intégration AVEREO vérifiée : douze tests, deux skills valides, installateur dans un profil temporaire, 31 documents et 61 liens locaux, contrôle de base du monorepo réussi.
- Deux tests supplémentaires vérifient la projection de la PR, la conservation des décisions humaines et le refus de remplacer une preuve approuvée.

## Protocole de référence

# Protocole commun

**Une itération = un objectif, un périmètre, un candidat vérifié et un suivi dans le cockpit.** Le cycle reste le même pour un site, une application ou un agent. Les contrôles techniques s'adaptent au projet.

## Les trois étapes

| Étape | Travail | Condition de passage | Mise à jour du cockpit |
| --- | --- | --- | --- |
| 1. Local | Développer, essayer, ajuster, corriger et documenter. | Contrôles locaux et CI pertinents réussis ; PR et candidat identifiés ; cible de préproduction prête et accord applicable. | Objectif, branche, PR, candidat, tests, réserves et prochaine action. |
| 2. Préproduction | Installer le candidat sur une cible isolée, tester le comportement réel et corriger. | Recette réelle réussie sur la version retenue ; validation humaine, version acceptée pour livraison et préparation de production complète. | URL/cible, candidat installé, preuves de recette, corrections, validation et sauvegarde/retour arrière. |
| 3. Production | Livrer la version autorisée, contrôler le résultat et traiter les incidents. | Contrôles de production réussis ou incident explicitement pris en charge ; bilan et suite conservés. | Version effectivement livrée, reçu, contrôles réels, retour arrière, réserves et prochaine itération. |

Un échec revient à la correction de l'étape concernée. Une correction du code en préproduction est enregistrée dans la branche, contrôlée localement, poussée dans la PR puis réinstallée ; éviter les correctifs serveur sans source et sans trace.

## Avant de commencer

1. Lire les instructions et documents du dépôt ; inspecter les changements existants et la dernière observation GitHub.
2. Fixer l'objectif, les critères observables, le périmètre, le responsable et le budget. Réutiliser les accords déjà acquis ; demander les inconnues qui conditionnent réellement une action.
3. Rattacher le lot au cockpit canonique. Réutiliser son journal ; conserver les phases et preuves antérieures. Une absence de cockpit ou de cible se consigne comme inconnue, pas comme réussite.
4. Identifier les commandes réellement disponibles pour tester, construire et livrer. Préparer les trois cibles et le plan de récupération avant les écritures distantes.

## 1 — Local

Travailler sur une branche dédiée au lot, à partir de l'état Git pertinent. Préserver les autres applications et les travaux de l'utilisateur. Faire les corrections dans la source, exécuter les contrôles proportionnés et actualiser la documentation.

Créer ou actualiser une seule PR du même périmètre avec le template du dépôt. Y relier l'environnement de validation, le diff, les preuves et les risques. Une PR en brouillon porte une préparation incomplète ; elle devient prête à examiner quand le lot et ses preuves sont prêts. Les cases et approbations humaines restent au responsable.

Conserver le SHA source, l'empreinte de l'artefact et les liens des exécutions CI. GitHub vérifie le code ; une CI verte ne prouve pas l'état hébergé.

**Passage vers préproduction :** contrôles locaux/CI/documentaires réussis sur ce candidat, cible exacte isolée et prête, accord de préproduction applicable, récupération prévue. Si la cible contient un état à conserver, sauvegarder et tester la restauration avant remplacement. Pour une cible neuve, vérifier qu'elle est vide et isolée.

## 2 — Préproduction

Installer le candidat identifié, contrôler son empreinte et enregistrer le reçu. Conserver l'isolement, les transports de messages de test et les données adaptées au contexte. Ne pas importer les comptes, secrets ou données sensibles de production par commodité.

Tester le résultat réel : chargement, parcours utiles, droits, données et interactions avec les services nécessaires. Les captures et le rendu navigateur portent sur cette cible, en précisant bureau/mobile si utile. Pour un agent, vérifier les évaluations, outils, effets externes et plafonds ; une simulation d'outil reste une preuve distincte d'une action réelle.

Lors d'une correction, retourner à la source locale, mettre à jour la PR et recommencer la recette concernée. Conserver les anciens reçus comme historiques.

Le responsable examine le candidat final et ses réserves. Vérifier la PR et la validation réellement enregistrées. Le merge reste humain selon les règles du dépôt et peut intervenir avant ou après la recette, selon son modèle de déploiement. Si son résultat change le contenu ou l'artefact, qualifier le nouveau candidat ; ne pas réutiliser les preuves d'une ancienne version.

**Passage vers production :** recette du candidat retenu réussie, revue humaine et acceptation GitHub établies, accord explicite pour sa cible et son effet, sauvegarde fraîche et restauration contrôlée, retour arrière qualifié et contrôles après livraison prêts. Livraison en maintenance et ouverture publique sont deux effets distincts.

## 3 — Production

Préparer d'abord un résultat concret à examiner : version, contenu livré, cible, effet public, risques connus, sauvegarde, restauration et retour arrière. Demander l'accord qui manque seulement à ce point ; un accord déjà acquis pour ces mêmes paramètres n'est pas redemandé par routine.

Relire les prérequis à l'exécution, notamment les modifications ou données reçues depuis la qualification. Livrer l'artefact contrôlé avec l'outil du dépôt. Conserver le reçu et vérifier le comportement réel de production : disponibilité attendue, version, parcours critiques, données et erreurs. Pour un agent, vérifier aussi son exécution et ses effets réellement autorisés.

En cas d'incident, suspendre l'action en cause, préserver les données récentes et appliquer le retour arrière autorisé. Un retour arrière de code ne justifie pas l'écrasement d'une base complète. Enregistrer le résultat, les limites et la suite nécessaire.

Clore l'itération avec les preuves, réserves, documentation et décision de clôture prévues dans le projet. Créer le backlog de la prochaine itération sans transformer des idées en engagements. Son nouveau périmètre et son candidat ont leur propre revue.

## GitHub et cockpit

GitHub porte les branches, PR, SHA, contrôles CI et reçus de workflows. Le cockpit porte le pilotage : étape réelle, responsable, prochaine action, blocages, décisions et liens de preuve. Le [contrat du cockpit](../../skills/developpement-github-cockpit/references/cockpit.md) précise les informations communes.

Les règles d'environnement GitHub doivent être vérifiées sur chaque dépôt : leur simple mention dans un YAML n'établit pas qu'un approbateur ou une protection est configuré. La disponibilité de certaines protections dépend du dépôt et de l'offre GitHub. Un déploiement de production ne doit pas partir de tout push sans son mécanisme d'accord prévu ; qualifier la configuration réelle avant usage.

Aucun service de surveillance n'est installé par ce protocole. Rafraîchir GitHub aux passages et indiquer la date de dernière observation ; une synchronisation continue nécessite une réalisation et une autorisation distinctes.

## Contrôles adaptés

| Type | Contrôles usuels à adapter au risque |
| --- | --- |
| Site | Pages et formulaires, images/styles, bureau/mobile, administration, conservation des contenus et sauvegarde/restauration. |
| Application | Tests métier, build, droits, stockage/migrations, parcours critiques, version de l'artefact et services réels. |
| Agent | Évaluations reproductibles, outils et permissions, données, effets externes, limites d'exécution, version prompts/configuration/modèle et retour à la version précédente. |

Ces exemples ne remplacent pas les règles locales. Un champ non applicable doit être motivé ; un contrôle manquant reste un blocage du passage qui en dépend.

## Références de mise en œuvre

- [Contrat et contrôleur du cockpit](../../skills/developpement-github-cockpit/references/cockpit.md).
- [Documentation officielle — skills](https://learn.chatgpt.com/docs/build-skills), [instructions globales](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [GitHub — environnements de déploiement](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Les choix de cycle et d'accords ci-dessus proviennent du responsable ; ces documentations expliquent les mécanismes des outils.
